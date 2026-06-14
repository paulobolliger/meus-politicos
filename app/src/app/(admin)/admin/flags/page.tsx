import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth/current-user'
import { getPgPool } from '@/lib/db/pool'
import { AdminPageHeader } from '@/components/admin/AdminCard'
import { FeatureFlagList } from '@/components/admin/FeatureFlagList'

export const metadata = { title: 'Feature Flags — Admin' }

type FeatureFlag = {
  id: string
  slug: string
  descricao: string | null
  ativo: boolean
  rollout_pct: number
  atualizado_em: string
}

export default async function FeatureFlagsPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/painel')

  const { rows: flags } = await getPgPool().query<FeatureFlag>(`
    SELECT id, slug, descricao, ativo, rollout_pct, atualizado_em::text AS atualizado_em
    FROM feature_flags
    ORDER BY slug ASC
  `)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <AdminPageHeader
        title="Feature Flags"
        subtitle="Controle de funcionalidades por flag"
      />
      <FeatureFlagList flags={flags} />
    </div>
  )
}
