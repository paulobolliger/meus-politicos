import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/current-user'
import { getPgPool } from '@/lib/db/pool'

type PgError = Error & {
  code?: string
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const currentUser = await getCurrentUser()

  if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const { id } = await params
  const body = await req.json() as Record<string, string>

  // Only allow certain fields
  const allowed = [
    'foto_url',
    'nome_eleitoral',
    'codigo_siafi',
    'email',
    'partido_id',
    'situacao',
    'gabinete_nome',
    'gabinete_telefone',
    'gabinete_email',
    'uf',
    'cargo',
  ]
  const updates: Record<string, string | null> = {}
  for (const key of allowed) {
    if (key in body) {
      const val = body[key]
      if ((key === 'uf' || key === 'cargo') && !val) {
        return NextResponse.json({ error: `O campo ${key} é obrigatório.` }, { status: 400 })
      }
      updates[key] = (val === '' || val === undefined || val === null) ? null : val
    }
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Nenhum campo válido' }, { status: 400 })
  }

  const setClauses: string[] = []
  const values: (string | null)[] = []

  for (const [key, value] of Object.entries(updates)) {
    values.push(value)
    setClauses.push(`${key} = $${values.length}`)
  }

  values.push(id)

  try {
    await getPgPool().query(
      `UPDATE politicos
       SET ${setClauses.join(', ')}
       WHERE id = $${values.length}`,
      values
    )

    await getPgPool().query(
      `INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
       VALUES ($1, 'editar_politico', 'politicos', $2, $3::jsonb)`,
      [
        currentUser.perfilId,
        id,
        JSON.stringify(updates),
      ]
    )
  } catch (error) {
    const pgError = error as PgError
    return NextResponse.json({ error: pgError.message, code: pgError.code }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
