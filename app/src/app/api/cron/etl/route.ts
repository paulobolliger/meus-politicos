import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'
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
  // 1. Validar autenticação via token estático (Bearer Token)
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null
  const expectedToken = process.env.CRON_SECRET_TOKEN

  if (!expectedToken) {
    console.error('[CRON ETL] Variável CRON_SECRET_TOKEN não configurada no servidor.')
    return NextResponse.json({ error: 'Erro de configuração do servidor' }, { status: 500 })
  }

  if (!token || token !== expectedToken) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  // 2. Extrair parâmetros do corpo da requisição
  const body = await req.json().catch(() => ({})) as { fonte?: string }
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

  // Resolver o caminho do Python do virtualenv (.venv) ou padrão do sistema
  const pythonWin = path.join(workspaceRoot, '.venv', 'Scripts', 'python.exe')
  const pythonUnix = path.join(workspaceRoot, '.venv', 'bin', 'python')
  const pythonPath = fs.existsSync(pythonWin) ? pythonWin : (fs.existsSync(pythonUnix) ? pythonUnix : 'python')

  // 3. Gravar log inicial 'em_andamento'
  let logId: string | null = null
  try {
    const logRes = await getPgPool().query(
      `INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, iniciado_em, criado_em)
       VALUES ($1, $2, 'em_andamento', 0, 0, 'Iniciado em segundo plano via Cron...', now(), now())
       RETURNING id`,
      [fonte, scriptInfo.tipo]
    )
    logId = logRes.rows[0]?.id ? String(logRes.rows[0].id) : null
  } catch (err) {
    console.error('[CRON ETL] Erro ao gravar log inicial no banco:', err)
  }

  // 4. Executar script Python em background (spawn)
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

  // O processo roda em segundo plano; a Promise de pós-execução atualiza o banco
  child.on('close', async (code) => {
    const durationMs = Date.now() - startTime
    const status = code === 0 ? 'ok' : 'falhou'
    const finalMsg = output.trim() || `Processo finalizado com código de saída ${code}`

    try {
      if (logId) {
        await getPgPool().query(
          `UPDATE coletas_log
           SET status = $1, duracao_ms = $2, mensagem = $3, concluido_em = now()
           WHERE id = $4`,
          [status, durationMs, finalMsg.substring(0, 10000), logId]
        )
      } else {
        await getPgPool().query(
          `INSERT INTO coletas_log (fonte, tipo, status, registros, duracao_ms, mensagem, iniciado_em, concluido_em, criado_em)
           VALUES ($1, $2, $3, 0, $4, $5, now(), now(), now())`,
          [fonte, scriptInfo.tipo, status, durationMs, finalMsg.substring(0, 10000)]
        )
      }
      console.log(`[CRON ETL] Execução finalizada para a fonte "${fonte}" com status "${status}".`)
    } catch (err) {
      console.error('[CRON ETL] Erro ao atualizar log de encerramento no banco:', err)
    }
  })

  // Retorna imediatamente o ID do log para o orquestrador (n8n) acompanhar o status
  return NextResponse.json({
    message: `Execução da fonte "${fonte}" iniciada com sucesso em segundo plano via Cron.`,
    logId: logId
  })
}
