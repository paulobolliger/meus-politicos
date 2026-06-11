import { NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'

export const runtime = 'nodejs'

type GlossarioRow = {
  slug: string
  termo: string
  definicao_simples: string
  categoria: string | null
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const pool = getPgPool()

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
