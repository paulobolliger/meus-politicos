import { redirect } from 'next/navigation'
import { Pool } from 'pg'
import { getCurrentUser } from '@/lib/auth/current-user'
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

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }

  return pool
}

export default async function FeatureFlagsPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/painel')

  const { rows: flags } = await getPool().query<FeatureFlag>(`
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
