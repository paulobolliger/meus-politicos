import { NextRequest, NextResponse } from 'next/server'

import { createAdminClient, createClient } from '@/lib/supabase/server'

// DELETE /api/acompanhamentos/[politicoId] — unfollow
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ politicoId: string }> }
) {
  const supabase = await createClient()
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { politicoId } = await params

  const { error } = await db
    .from('acompanhamentos')
    .delete()
    .eq('usuario_id', user.id)
    .eq('politico_id', politicoId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
