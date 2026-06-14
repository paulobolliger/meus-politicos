import { NextRequest, NextResponse } from 'next/server'

import { getCurrentUser } from '@/lib/auth/current-user'
import { getPgPool } from '@/lib/db/pool'

type PgError = Error & {
  code?: string
}

/**
 * PATCH /api/admin/emendas/match
 * Vincula emendas órfãs (politico_id IS NULL) de um parlamentar a um político do banco.
 * Body: { nome_parlamentar: string, politico_id: string }
 */
export async function PATCH(req: NextRequest): Promise<NextResponse> {
  const currentUser = await getCurrentUser()

  if (!currentUser) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  if (currentUser.role !== 'admin') {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  const body = await req.json() as {
    nome_parlamentar?: string
    politico_id?: string
  }

  if (!body.nome_parlamentar || !body.politico_id) {
    return NextResponse.json({ error: 'nome_parlamentar e politico_id são obrigatórios' }, { status: 400 })
  }

  try {
    // Buscar código SIAFI do nome se ainda não tiver no político
    await getPgPool().query(
      'SELECT id, codigo_siafi FROM politicos WHERE id = $1 LIMIT 1',
      [body.politico_id]
    )

    // Atualiza emendas pelo nome (case-insensitive)
    const result = await getPgPool().query(
      `UPDATE emendas
       SET politico_id = $1,
           atualizado_em = $2
       WHERE politico_id IS NULL
         AND nome_parlamentar ILIKE $3`,
      [body.politico_id, new Date().toISOString(), body.nome_parlamentar]
    )

    const emendasAtualizadas = result.rowCount ?? 0

    await getPgPool().query(
      `INSERT INTO admin_logs (usuario_id, acao, entidade, entidade_id, detalhe)
       VALUES ($1, 'match_emendas', 'emendas', $2, $3::jsonb)`,
      [
        currentUser.perfilId,
        body.politico_id,
        JSON.stringify({
          nome_parlamentar: body.nome_parlamentar,
          politico_id: body.politico_id,
          emendas_atualizadas: emendasAtualizadas,
        }),
      ]
    )

    return NextResponse.json({ ok: true, emendas_atualizadas: emendasAtualizadas })
  } catch (error) {
    const pgError = error as PgError
    return NextResponse.json({ error: pgError.message, code: pgError.code }, { status: 500 })
  }
}
