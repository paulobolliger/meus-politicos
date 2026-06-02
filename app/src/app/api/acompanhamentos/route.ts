import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

import { getCurrentUser } from '@/lib/auth/current-user'

type AcompanhamentoRow = {
  politico_id: string
}

type PgError = Error & {
  code?: string
}

let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }

  return _pool
}

// POST /api/acompanhamentos — follow
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const politicoId = (body as Record<string, unknown>)?.politico_id as string | undefined
  if (!politicoId) {
    return NextResponse.json({ error: 'politico_id é obrigatório' }, { status: 400 })
  }

  try {
    await getPool().query(
      'INSERT INTO acompanhamentos (usuario_id, politico_id) VALUES ($1, $2)',
      [currentUser.perfilId, politicoId]
    )
  } catch (error) {
    const pgError = error as PgError

    // 23505 = unique_violation (já estava seguindo) — não é erro para o cliente
    if (pgError.code === '23505') {
      return NextResponse.json({ ok: true })
    }

    if (pgError.code === '23503') {
      return NextResponse.json({ error: 'politico_id inválido.' }, { status: 400 })
    }

    return NextResponse.json({ error: pgError.message, code: pgError.code }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// GET /api/acompanhamentos — lista IDs que o usuário segue
export async function GET() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ ids: [] })
  }

  try {
    const { rows } = await getPool().query<AcompanhamentoRow>(
      'SELECT politico_id FROM acompanhamentos WHERE usuario_id = $1',
      [currentUser.perfilId]
    )

    return NextResponse.json({ ids: rows.map((r) => r.politico_id) })
  } catch (error) {
    const pgError = error as PgError
    return NextResponse.json({ error: pgError.message, code: pgError.code, ids: [] }, { status: 500 })
  }
}
