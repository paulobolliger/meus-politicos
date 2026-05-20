import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminCard'
import { EtlSourceCard } from '@/components/admin/EtlSourceCard'

export const metadata = { title: 'ETL Monitor — Admin' }

type EtlRow = {
  id: string
  fonte: string
  tipo: string | null
  status: string
  criado_em: string
  duracao_ms: number | null
  registros: number | null
  mensagem: string | null
}

type EtlSource = {
  fonte: string
  latest: EtlRow
  history: EtlRow[]
}

function etlBadgeVariant(status: string): 'ok' | 'warn' | 'err' | 'never' {
  if (status === 'ok' || status === 'sucesso') return 'ok'
  if (status === 'parcial' || status === 'aviso') return 'warn'
  if (status === 'erro' || status === 'falha') return 'err'
  return 'never'
}

export default async function EtlMonitorPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const params = await searchParams
  const focusFonte = params.fonte ?? null

  const { data: rows } = await adminClient
    .from('coletas_log')
    .select('id, fonte, tipo, status, criado_em, duracao_ms, registros, mensagem')
    .order('fonte', { ascending: true })
    .order('criado_em', { ascending: false })
    .limit(500)

  // Group by fonte
  const sourceMap = new Map<string, EtlSource>()
  for (const row of (rows ?? []) as EtlRow[]) {
    if (!sourceMap.has(row.fonte)) {
      sourceMap.set(row.fonte, { fonte: row.fonte, latest: row, history: [] })
    }
    const src = sourceMap.get(row.fonte)!
    if (src.history.length < 10) src.history.push(row)
  }

  const sources = Array.from(sourceMap.values())

  // Count errors
  const errorCount = sources.filter(
    (s) => etlBadgeVariant(s.latest.status) === 'err'
  ).length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000 }}>
      <AdminPageHeader
        title="ETL Monitor"
        subtitle={`${sources.length} fontes monitoradas${errorCount > 0 ? ` — ${errorCount} com erro` : ''}`}
      />

      {errorCount > 0 && (
        <div
          style={{
            background: 'var(--neg-soft)',
            borderLeft: '3px solid var(--neg)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            fontSize: 14,
            color: 'var(--neg)',
            fontWeight: 500,
          }}
        >
          {errorCount} fonte{errorCount > 1 ? 's com erro' : ' com erro'} — verifique abaixo.
        </div>
      )}

      {sources.length === 0 ? (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: 32,
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontSize: 14,
          }}
        >
          Nenhum dado em <code>coletas_log</code> ainda.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {sources.map((src) => (
            <EtlSourceCard
              key={src.fonte}
              source={src}
              defaultOpen={focusFonte === src.fonte}
              badgeVariant={etlBadgeVariant(src.latest.status)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
