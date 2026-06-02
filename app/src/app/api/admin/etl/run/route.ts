import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

import { getCurrentUser } from '@/lib/auth/current-user'

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

  // Log the admin action (no actual ETL trigger yet)
  await getPool().query(
    `INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
     VALUES ($1, 'etl_rodar_agora', 'coletas_log', $2, $3::jsonb)`,
    [
      currentUser.perfilId,
      fonte,
      JSON.stringify({ fonte, solicitado_em: new Date().toISOString() }),
    ]
  )

  return NextResponse.json({
    message: `Ação registrada para ETL "${fonte}". Trigger manual via SSH em breve.`,
  })
}
