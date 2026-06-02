import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

import { getCurrentUser } from '@/lib/auth/current-user'

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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const currentUser = await getCurrentUser()

  if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as Record<string, string>

  // Only allow certain fields
  const allowed = ['foto_url', 'nome_eleitoral', 'codigo_siafi', 'email']
  const updates: Record<string, string> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido' }, { status: 400 })
  }

  const setClauses: string[] = []
  const values: string[] = []

  for (const [key, value] of Object.entries(updates)) {
    values.push(value)
    setClauses.push(`${key} = $${values.length}`)
  }

  values.push(id)

  try {
    await getPool().query(
      `UPDATE politicos
       SET ${setClauses.join(', ')}
       WHERE id = $${values.length}`,
      values
    )

    await getPool().query(
      `INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
       VALUES ($1, 'editar_politico', 'politicos', $2, $3::jsonb)`,
      [
        currentUser.perfilId,
        id,
        JSON.stringify(updates),
      ]
    )
  } catch (error) {
    const pgError = error as PgError
    return NextResponse.json({ error: pgError.message, code: pgError.code }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
