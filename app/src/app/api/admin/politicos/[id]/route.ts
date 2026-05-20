import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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

  const { error } = await db.from('politicos').update(updates).eq('id', id) as { error: { message: string } | null }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await db.from('admin_logs').insert({
    usuario_id: user.id,
    acao: 'editar_politico',
    entidade: 'politicos',
    entidade_id: id,
    detalhe: updates,
  })

  return NextResponse.json({ ok: true })
}
