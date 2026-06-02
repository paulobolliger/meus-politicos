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

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const currentUser = await getCurrentUser()

  if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json() as {
    id?: string
    slug?: string
    ativo?: boolean
    rollout_pct?: number
  }

  if (!body.id && !body.slug) {
    return NextResponse.json({ error: 'id ou slug obrigatório' }, { status: 400 })
  }

  const updates: { ativo?: boolean; rollout_pct?: number; atualizado_em: string } = {
    atualizado_em: new Date().toISOString(),
  }

  if (typeof body.ativo === 'boolean') updates.ativo = body.ativo
  if (typeof body.rollout_pct === 'number') updates.rollout_pct = body.rollout_pct

  const setClauses: string[] = ['atualizado_em = $1']
  const values: unknown[] = [updates.atualizado_em]

  if ('ativo' in updates) {
    values.push(updates.ativo)
    setClauses.push(`ativo = $${values.length}`)
  }

  if ('rollout_pct' in updates) {
    values.push(updates.rollout_pct)
    setClauses.push(`rollout_pct = $${values.length}`)
  }

  const identifier = body.id ?? body.slug
  const identifierColumn = body.id ? 'id' : 'slug'
  values.push(identifier)

  try {
    await getPool().query(
      `UPDATE feature_flags
       SET ${setClauses.join(', ')}
       WHERE ${identifierColumn} = $${values.length}`,
      values
    )

    await getPool().query(
      `INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
       VALUES ($1, 'atualizar_feature_flag', 'feature_flags', $2, $3::jsonb)`,
      [
        currentUser.perfilId,
        identifier,
        JSON.stringify(updates),
      ]
    )
  } catch (error) {
    const pgError = error as PgError
    return NextResponse.json({ error: pgError.message, code: pgError.code }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
