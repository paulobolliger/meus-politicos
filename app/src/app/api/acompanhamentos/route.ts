import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'

import { getCurrentUser } from '@/lib/auth/current-user'

type AcompanhamentoRow = {
  politico_id: string
  tipo: string
}

type PgError = Error & {
  code?: string
}

// POST /api/acompanhamentos — follow
export async function POST(request: NextRequest) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const payload = body as Record<string, unknown>
  const politicoId = payload?.politico_id as string | undefined
  const tipo = (payload?.tipo as string | undefined) || 'seguir'

  if (!politicoId) {
    return NextResponse.json({ error: 'politico_id é obrigatório' }, { status: 400 })
  }

  if (tipo !== 'seguir' && tipo !== 'voto') {
    return NextResponse.json({ error: "tipo inválido (deve ser 'seguir' ou 'voto')" }, { status: 400 })
  }

  try {
    await getPgPool().query(
      `INSERT INTO acompanhamentos (usuario_id, politico_id, tipo) 
       VALUES ($1, $2, $3)
       ON CONFLICT (usuario_id, politico_id) 
       DO UPDATE SET tipo = EXCLUDED.tipo`,
      [currentUser.perfilId, politicoId, tipo]
    )
  } catch (error) {
    const pgError = error as PgError

    if (pgError.code === '23503') {
      return NextResponse.json({ error: 'politico_id inválido.' }, { status: 400 })
    }

    console.error('[Acompanhamentos POST Error]:', error)
    return NextResponse.json({ error: 'Erro interno ao salvar acompanhamento.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}

// GET /api/acompanhamentos — lista IDs que o usuário segue
export async function GET() {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    return NextResponse.json({ ids: [], acompanhamentos: [] })
  }

  try {
    const { rows } = await getPgPool().query<AcompanhamentoRow>(
      'SELECT politico_id, tipo FROM acompanhamentos WHERE usuario_id = $1',
      [currentUser.perfilId]
    )

    return NextResponse.json({
      ids: rows.map((r) => r.politico_id),
      acompanhamentos: rows,
    })
  } catch (error) {
    console.error('[Acompanhamentos GET Error]:', error)
    return NextResponse.json({ error: 'Erro interno ao obter acompanhamentos.', ids: [], acompanhamentos: [] }, { status: 500 })
  }
}
