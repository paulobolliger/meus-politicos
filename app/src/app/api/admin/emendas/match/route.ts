import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

/**
 * PATCH /api/admin/emendas/match
 * Vincula emendas órfãs (politico_id IS NULL) de um parlamentar a um político do banco.
 * Body: { nome_parlamentar: string, politico_id: string }
 */
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
    nome_parlamentar?: string
    politico_id?: string
  }

  if (!body.nome_parlamentar || !body.politico_id) {
    return NextResponse.json({ error: 'nome_parlamentar e politico_id são obrigatórios' }, { status: 400 })
  }

  // Atualiza emendas pelo nome (case-insensitive)
  const { error, count } = await db
    .from('emendas')
    .update({ politico_id: body.politico_id, atualizado_em: new Date().toISOString() })
    .is('politico_id', null)
    .ilike('nome_parlamentar', body.nome_parlamentar) as { error: { message: string } | null; count: number | null }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Buscar código SIAFI do nome se ainda não tiver no político
  const { data: politico } = await db
    .from('politicos')
    .select('id, codigo_siafi')
    .eq('id', body.politico_id)
    .single() as { data: { id: string; codigo_siafi: string | null } | null; error: unknown }

  // Log
  await db.from('admin_logs').insert({
    usuario_id: user.id,
    acao: 'match_emendas',
    entidade: 'emendas',
    entidade_id: body.politico_id,
    detalhe: {
      nome_parlamentar: body.nome_parlamentar,
      politico_id: body.politico_id,
      emendas_atualizadas: count,
    },
  })

  return NextResponse.json({ ok: true, emendas_atualizadas: count ?? 0 })
}
