'use server'

import { revalidatePath } from 'next/cache'
import { getPgPool } from '@/lib/db/pool'
import { getCurrentUser } from '@/lib/auth/current-user'

export type SaveProfileData = {
  nome: string
  uf: string
  municipio: string
  notifVotacao: boolean
  notifFalta: boolean
  notifGasto: boolean
  notifPartido: boolean
  notifCandidato: boolean
}

export async function salvarConfiguracoes(data: SaveProfileData) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    throw new Error('Não autenticado')
  }

  const db = getPgPool()
  await db.query(
    `UPDATE perfis
     SET nome = $1,
         uf = $2,
         municipio = $3,
         notif_votacao = $4,
         notif_falta = $5,
         notif_gasto = $6,
         notif_partido = $7,
         notif_candidato = $8,
         atualizado_em = NOW()
     WHERE id = $9`,
    [
      data.nome || null,
      data.uf || null,
      data.municipio || null,
      data.notifVotacao,
      data.notifFalta,
      data.notifGasto,
      data.notifPartido,
      data.notifCandidato,
      currentUser.perfilId,
    ]
  )

  revalidatePath('/conta')
  revalidatePath('/painel')
  return { success: true }
}
