import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'
import { getCurrentUser } from '@/lib/auth/current-user'
import path from 'path'
import fs from 'fs'
import { spawn } from 'child_process'

const SCRIPTS_MAP: Record<string, { script: string; tipo: string; args?: string[] }> = {
  alesp: { script: 'etl/ale/collect_alesp.py', tipo: 'deputados' },
  almg: { script: 'etl/ale/collect_almg.py', tipo: 'deputados' },
  almt: { script: 'etl/ale/collect_almt.py', tipo: 'deputados' },
  cldf: { script: 'etl/ale/collect_cldf.py', tipo: 'deputados' },
  sapl_ac: { script: 'etl/ale/collect_sapl.py', tipo: 'deputados' },
  camara_deputados: { script: 'etl/camara/collect_deputados.py', tipo: 'deputados' },
  camara_ceap: { script: 'etl/camara/collect_camara_gastos.py', tipo: 'gastos' },
  camara_ceap_bulk: { script: 'etl/camara/collect_camara_gastos.py', tipo: 'gastos', args: ['--paginas', '500'] },
  camara_votos_bulk: { script: 'etl/camara/collect_votacoes.py', tipo: 'votacoes' },
  camara_eventos: { script: 'etl/camara/collect_proposicoes.py', tipo: 'proposicoes' },
  senado_ceaps: { script: 'etl/senado/collect_senado_gastos.py', tipo: 'gastos' },
  senado_legis: { script: 'etl/senado/collect_senadores.py', tipo: 'senadores' },
  tse: { script: 'etl/tse/collect_candidatos_2026.py', tipo: 'candidatos' },
  portal_transparencia: { script: 'etl/portal_transparencia/collect_emendas.py', tipo: 'emendas' },
  portal_transparencia_emendas: { script: 'etl/portal_transparencia/collect_emendas.py', tipo: 'emendas', args: ['--tipo', 'emendas'] },
  portal_transparencia_pix: { script: 'etl/portal_transparencia/collect_emendas.py', tipo: 'emendas', args: ['--tipo', 'pix'] },
  ibge: { script: 'etl/ibge/collect_municipios.py', tipo: 'municipios' },
  ibge_master: { script: 'etl/ibge/collect_municipios.py', tipo: 'municipios' },
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json() as { fonte?: string }
  const { fonte } = body

  if (!fonte) {
    return NextResponse.json({ error: 'Parâmetro fonte obrigatório' }, { status: 400 })
  }

  const scriptInfo = SCRIPTS_MAP[fonte]
  if (!scriptInfo) {
    return NextResponse.json({ error: `Fonte "${fonte}" desconhecida` }, { status: 400 })
  }

  const cwd = process.cwd()
  const workspaceRoot = cwd.endsWith('app') ? path.join(cwd, '..') : cwd

  const scriptFullPath = path.join(workspaceRoot, scriptInfo.script)
  if (!fs.existsSync(scriptFullPath)) {
    return NextResponse.json({ error: `Script não encontrado no disco: ${scriptInfo.script}` }, { status: 404 })
  }

  // Resolve virtualenv Python or fallback to system python
  const pythonWin = path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe')
  const pythonUnix = path.join(workspaceRoot, '.venv', 'bin', 'python')
  const pythonPath = fs.existsSync(pythonWin) ? pythonWin : (fs.existsSync(pythonUnix) ? pythonUnix : 'python')

  // Log the admin action in admin_logs using the centralized pool
  await getPgPool().query(
    `INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
     VALUES ($1, 'etl_rodar_agora', 'coletas_log', $2, $3::jsonb)`,
    [
      currentUser.perfilId,
      fonte,
      JSON.stringify({ fonte, solicitado_em: new Date().toISOString() }),
    ]
  )

  // Insert initial "em_andamento" log into coletas_log
  let logId: string | null = null
  try {
    const logRes = await getPgPool().query(
      `INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, iniciado_em, criado_em)
       VALUES ($1, $2, 'em_andamento', 0, 0, 'Iniciado em segundo plano...', now(), now())
       RETURNING id`,
      [fonte, scriptInfo.tipo]
    )
    logId = logRes.rows[0]?.id ? String(logRes.rows[0].id) : null
  } catch (err) {
    console.error('Erro ao gravar log inicial:', err)
  }

  // Spawn the child process in background
  const args = [scriptFullPath, ...(scriptInfo.args || [])]
  const child = spawn(pythonPath, args, {
    cwd: workspaceRoot,
    env: {
      ...process.env,
      PYTHONUNBUFFERED: '1',
    },
  })

  let output = ''
  child.stdout.on('data', (data) => {
    output += data.toString()
  })
  child.stderr.on('data', (data) => {
    output += data.toString()
  })

  const startTime = Date.now()

  child.on('close', async (code) => {
    const durationMs = Date.now() - startTime
    const status = code === 0 ? 'ok' : 'falhou'
    const finalMsg = output.trim() || `Processo finalizado com código de saída ${code}`

    try {
      if (logId) {
        // Update the existing log entry
        await getPgPool().query(
          `UPDATE coletas_log
           SET status = $1, duracao_ms = $2, mensagem = $3, concluido_em = now()
           WHERE id = $4`,
          [status, durationMs, finalMsg.substring(0, 10000), logId]
        )
      } else {
        // Fallback: insert new log entry if initial insert failed
        await getPgPool().query(
          `INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, iniciado_em, concluido_em, criado_em)
           VALUES ($1, $2, $3, 0, $4, $5, now(), now(), now())`,
          [fonte, scriptInfo.tipo, status, durationMs, finalMsg.substring(0, 10000)]
        )
      }
    } catch (err) {
      console.error('Erro ao atualizar log do processo ETL no banco:', err)
    }
  })

  return NextResponse.json({
    message: `Execução da fonte "${fonte}" iniciada com sucesso em segundo plano via virtualenv.`,
  })
}
