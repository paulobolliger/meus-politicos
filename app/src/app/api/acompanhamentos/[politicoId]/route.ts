import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'

import { getCurrentUser } from '@/lib/auth/current-user'

type PgError = Error & {
  code?: string
}



// DELETE /api/acompanhamentos/[politicoId] — unfollow
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ politicoId: string }> }
) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { politicoId } = await params

  try {
    await getPgPool().query(
      'DELETE FROM acompanhamentos WHERE usuario_id = $1 AND politico_id = $2',
      [currentUser.perfilId, politicoId]
    )
  } catch (error) {
    return NextResponse.json({ error: 'Erro interno ao remover acompanhamento.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
