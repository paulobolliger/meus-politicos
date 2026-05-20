import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest): Promise<NextResponse> {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { data: perfil } = await db
    .from('perfis')
    .select('role')
    .eq('id', user.id)
    .single() as { data: { role: string | null } | null; error: unknown }

  if (!perfil || perfil.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json() as { fonte?: string }
  const { fonte } = body

  if (!fonte) {
    return NextResponse.json({ error: 'Parâmetro fonte obrigatório' }, { status: 400 })
  }

  // Log the admin action (no actual ETL trigger yet)
  await db.from('admin_logs').insert({
    usuario_id: user.id,
    acao: 'etl_rodar_agora',
    entidade: 'coletas_log',
    entidade_id: fonte,
    detalhe: { fonte, solicitado_em: new Date().toISOString() },
  })

  return NextResponse.json({
    message: `Ação registrada para ETL "${fonte}". Trigger manual via SSH em breve.`,
  })
}
