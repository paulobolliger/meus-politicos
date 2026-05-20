import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    const supabase = await createClient()

    // Try to get authenticated user (no error if anon)
    const { data: { user } } = await supabase.auth.getUser()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('analytics_eventos')
      .insert({
        tipo,
        payload: payload ?? null,
        usuario_id: user?.id ?? null,
      })

  } catch {
    // Silently absorb errors — analytics must never break the app
  }

  return NextResponse.json({ ok: true }, { status: 202 })
}
