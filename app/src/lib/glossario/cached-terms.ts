import { cache } from 'react'
import { getPgPool } from '@/lib/db/pool'

export type GlossaryTerm = {
  slug: string
  termo: string
  definicao_simples: string
}

/**
 * Fetch all glossary terms with React cache memoization.
 * Avoids repeated database queries when multiple components parse text on the same page.
 */
export const getCachedGlossaryTerms = cache(async (): Promise<GlossaryTerm[]> => {
  const pool = getPgPool()
  try {
    const { rows } = await pool.query<GlossaryTerm>(
      `SELECT slug, termo, definicao_simples 
       FROM glossario 
       ORDER BY LENGTH(termo) DESC`
    )
    return rows
  } catch (err) {
    console.error('[getCachedGlossaryTerms] Erro ao buscar termos do glossário:', err)
    return []
  }
})
