import { NextResponse } from 'next/server'
import { Pool } from 'pg'

export const runtime = 'nodejs'

type GlossarioRow = {
  slug: string
  termo: string
  definicao_simples: string
  categoria: string | null
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
      max: 3,
      idleTimeoutMillis: 30_000,
    })
  }
  return _pool
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const pool = getPool()

  const result = await pool.query<GlossarioRow>(
    `
      SELECT slug, termo, definicao_simples, categoria
      FROM glossario
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  )
  const data = result.rows[0] ?? null

  if (!data) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
