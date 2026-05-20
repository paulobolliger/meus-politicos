import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
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
  const supabase = await createClient()
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: flags } = await db
    .from('feature_flags')
    .select('id, slug, descricao, ativo, rollout_pct, atualizado_em')
    .order('slug', { ascending: true }) as { data: FeatureFlag[] | null }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800 }}>
      <AdminPageHeader
        title="Feature Flags"
        subtitle="Controle de funcionalidades por flag"
      />
      <FeatureFlagList flags={flags ?? []} />
    </div>
  )
}
