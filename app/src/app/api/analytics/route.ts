import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getPgPool } from '@/lib/db/pool'

/**
 * POST /api/analytics
 *
 * Body: { tipo: string, payload?: object }
 *
 * Tipos esperados:
 *   busca          → payload: { q, cargo, uf, partido }
 *   perfil_view    → payload: { slug, cargo, uf }
 *   emenda_view    → payload: { slug }
 *   glossario_view → payload: { slug }
 *   comparar       → payload: { slugs: string[] }
 *
 * Sem PII — sem email, sem IP armazenado.
 * Retorna 202 sempre (best-effort, não bloqueia o cliente).
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const { tipo, payload } = body as { tipo?: string; payload?: Record<string, unknown> }

    if (!tipo || typeof tipo !== 'string' || tipo.length > 64) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    const currentUser = await getCurrentUser().catch(() => null)

    await getPgPool().query(
      `
        INSERT INTO analytics_eventos (tipo, payload, usuario_id)
        VALUES ($1, $2::jsonb, $3)
      `,
      [tipo, JSON.stringify(payload ?? null), currentUser?.perfilId ?? null]
    )

  } catch {
    // Silently absorb errors — analytics must never break the app
  }

  return NextResponse.json({ ok: true }, { status: 202 })
}
