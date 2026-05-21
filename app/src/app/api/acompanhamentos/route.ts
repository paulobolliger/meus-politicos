import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

// POST /api/acompanhamentos — follow
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
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

  const { error } = await db
    .from('acompanhamentos')
    .insert({ usuario_id: user.id, politico_id: politicoId })

  // 23505 = unique_violation (já estava seguindo) — não é erro para o cliente
  if (error && error.code !== '23505') {
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Sem permissão para acompanhar. Verifique grants/policies da tabela acompanhamentos.' },
        { status: 403 }
      )
    }

    if (error.code === '23503') {
      return NextResponse.json({ error: 'politico_id inválido.' }, { status: 400 })
    }

    return NextResponse.json({ error: error.message, code: error.code }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// GET /api/acompanhamentos — lista IDs que o usuário segue
export async function GET() {
  const supabase = await createClient()
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ ids: [] })
  }

  const { data, error } = await db
    .from('acompanhamentos')
    .select('politico_id')
    .eq('usuario_id', user.id)

  if (error) {
    if (error.code === '42501') {
      return NextResponse.json(
        { error: 'Sem permissão para listar acompanhamentos. Verifique grants/policies.', ids: [] },
        { status: 403 }
      )
    }
    return NextResponse.json({ error: error.message, code: error.code, ids: [] }, { status: 500 })
  }

  return NextResponse.json({ ids: (data ?? []).map((r) => r.politico_id) })
}
