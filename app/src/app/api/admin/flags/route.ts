import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { data: perfil } = await db
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string | null } | null; error: unknown }

  if (!perfil || perfil.role !== 'admin') {
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

  let query = db.from('feature_flags').update(updates)
  if (body.id) {
    query = query.eq('id', body.id)
  } else {
    query = query.eq('slug', body.slug)
  }

  const { error } = await query as { error: { message: string } | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log
  await db.from('admin_logs').insert({
    usuario_id: user.id,
    acao: 'atualizar_feature_flag',
    entidade: 'feature_flags',
    entidade_id: body.id ?? body.slug,
    detalhe: updates,
  })

  return NextResponse.json({ ok: true })
}
