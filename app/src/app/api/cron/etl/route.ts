import { timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'
import { ETL_SOURCES, type EtlSource, sanitizeEtlParams } from '@/lib/etl/sources'

function isAuthorized(req: NextRequest): boolean {
  const expected = process.env.CRON_SECRET_TOKEN
  const received = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '')
  if (!expected || !received) return false

  const expectedBuffer = Buffer.from(expected)
  const receivedBuffer = Buffer.from(received)
  return expectedBuffer.length === receivedBuffer.length &&
    timingSafeEqual(expectedBuffer, receivedBuffer)
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  if (!process.env.CRON_SECRET_TOKEN) {
    return NextResponse.json({ error: 'CRON_SECRET_TOKEN não configurado' }, { status: 500 })
  }
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json().catch(() => ({})) as {
    fonte?: string
    parametros?: unknown
    prioridade?: number
  }
  if (!body.fonte || !(body.fonte in ETL_SOURCES)) {
    return NextResponse.json({ error: `Fonte inválida: ${body.fonte ?? ''}` }, { status: 400 })
  }

  const fonte = body.fonte as EtlSource
  const parametros = sanitizeEtlParams(fonte, body.parametros)
  const prioridade = Number.isInteger(body.prioridade)
    ? Math.max(1, Math.min(1000, Number(body.prioridade)))
    : 100

  try {
    const { rows } = await getPgPool().query(
      `INSERT INTO etl_jobs (fonte, parametros, prioridade, solicitado_por)
       VALUES ($1, $2::jsonb, $3, 'n8n')
       RETURNING id, fonte, parametros, status, criado_em`,
      [fonte, JSON.stringify(parametros), prioridade]
    )
    return NextResponse.json({ job: rows[0] }, { status: 202 })
  } catch (error) {
    const dbError = error as { code?: string }
    if (dbError.code === '23505') {
      const { rows } = await getPgPool().query(
        `SELECT id, fonte, parametros, status, criado_em
         FROM etl_jobs
         WHERE fonte = $1 AND status IN ('pendente', 'em_andamento')
         ORDER BY criado_em DESC LIMIT 1`,
        [fonte]
      )
      return NextResponse.json({ job: rows[0], duplicate: true }, { status: 200 })
    }
    console.error('[ETL Queue] Falha ao enfileirar job:', error)
    return NextResponse.json({ error: 'Falha ao enfileirar ETL' }, { status: 500 })
  }
}

export async function GET(req: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Parâmetro id obrigatório' }, { status: 400 })
  }

  const { rows } = await getPgPool().query(
    `SELECT id, fonte, parametros, status, tentativas, max_tentativas,
            exit_code, mensagem, stdout_resumo, criado_em, iniciado_em, concluido_em
     FROM etl_jobs WHERE id = $1`,
    [id]
  )
  if (!rows[0]) return NextResponse.json({ error: 'Job não encontrado' }, { status: 404 })
  return NextResponse.json({ job: rows[0] })
}
