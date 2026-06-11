import { unstable_cache } from 'next/cache'
import { getPgPool } from '@/lib/db/pool'

export const getFeatureFlags = unstable_cache(
  async () => {
    try {
      const { rows } = await getPgPool().query<{ slug: string; ativo: boolean; rollout_pct: number }>(
        'SELECT slug, ativo, rollout_pct FROM feature_flags'
      )
      const flags: Record<string, { ativo: boolean; rollout_pct: number }> = {}
      for (const row of rows) {
        flags[row.slug] = { ativo: row.ativo, rollout_pct: row.rollout_pct }
      }
      return flags
    } catch (err) {
      console.error('Erro ao buscar feature flags do banco:', err)
      return {}
    }
  },
  ['feature-flags-cache'],
  { revalidate: 60 }
)

export async function isFeatureActive(slug: string, userId?: string): Promise<boolean> {
  const flags = await getFeatureFlags()
  const flag = flags[slug]
  if (!flag) return false
  if (!flag.ativo) return false
  if (flag.rollout_pct === 100) return true
  if (flag.rollout_pct === 0) return false

  if (userId) {
    let hash = 0
    const str = `${userId}:${slug}`
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i)
      hash |= 0
    }
    const pct = Math.abs(hash % 100)
    return pct < flag.rollout_pct
  }

  return Math.random() * 100 < flag.rollout_pct
}
