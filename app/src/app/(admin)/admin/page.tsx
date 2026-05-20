import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageHeader, KpiCard, StatusBadge } from '@/components/admin/AdminCard'

export const metadata = { title: 'Dashboard Admin — Meus Políticos' }

type EtlRow = {
  fonte: string
  status: string
  criado_em: string
  duracao_ms: number | null
  registros: number | null
  mensagem: string | null
}

function etlBadgeVariant(status: string): 'ok' | 'warn' | 'err' | 'never' {
  if (status === 'ok' || status === 'sucesso') return 'ok'
  if (status === 'parcial' || status === 'aviso') return 'warn'
  if (status === 'erro' || status === 'falha') return 'err'
  return 'never'
}

function fmtDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('pt-BR')
}

export default async function AdminDashboardPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  // User stats
  const { count: totalUsers } = await adminClient
    .from('perfis')
    .select('*', { count: 'exact', head: true })

  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const { count: newUsers7d } = await adminClient
    .from('perfis')
    .select('*', { count: 'exact', head: true })
    .gte('criado_em', since7d)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any
  // DB counts — use adminClient (service role) for tables not in generated types
  const counts = await Promise.all([
    db.from('politicos').select('*', { count: 'exact', head: true }),
    db.from('emendas').select('*', { count: 'exact', head: true }),
    db.from('gastos').select('*', { count: 'exact', head: true }),
    db.from('votacoes').select('*', { count: 'exact', head: true }),
    db.from('proposicoes').select('*', { count: 'exact', head: true }),
    db.from('municipios').select('*', { count: 'exact', head: true }),
  ]) as { count: number | null }[]

  const [politicos, emendas, gastos, votacoes, proposicoes, municipios] = counts

  // ETL latest per fonte
  const { data: etlRaw } = await adminClient
    .from('coletas_log')
    .select('fonte, status, criado_em, duracao_ms, registros, mensagem')
    .order('criado_em', { ascending: false })
    .limit(200)

  // Group by fonte — pick latest per fonte
  const etlMap = new Map<string, EtlRow>()
  for (const row of (etlRaw ?? []) as EtlRow[]) {
    if (!etlMap.has(row.fonte)) etlMap.set(row.fonte, row)
  }
  const etlLatest = Array.from(etlMap.values())

  // Alert if any ETL failed in last 24h
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const failedRecent = etlLatest.filter(
    (r) =>
      (r.status === 'erro' || r.status === 'falha') && r.criado_em > since24h
  )

  const dbCards = [
    { label: 'Políticos', value: politicos.count ?? 0 },
    { label: 'Emendas', value: emendas.count ?? 0 },
    { label: 'Gastos', value: gastos.count ?? 0 },
    { label: 'Votações', value: votacoes.count ?? 0 },
    { label: 'Proposições', value: proposicoes.count ?? 0 },
    { label: 'Municípios', value: municipios.count ?? 0 },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100 }}>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Visão geral do sistema — dados em tempo real"
      />

      {/* Alert banner */}
      {failedRecent.length > 0 && (
        <div
          style={{
            background: 'var(--neg-soft)',
            borderLeft: '3px solid var(--neg)',
            borderRadius: 8,
            padding: '12px 16px',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <span style={{ fontSize: 18 }}>⚠</span>
          <span style={{ fontSize: 14, color: 'var(--neg)', fontWeight: 500 }}>
            {failedRecent.length} ETL{failedRecent.length > 1 ? 's falharam' : ' falhou'} nas
            últimas 24h:{' '}
            <strong>{failedRecent.map((r) => r.fonte).join(', ')}</strong>
          </span>
        </div>
      )}

      {/* Users KPIs */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        USUÁRIOS
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 12,
          marginBottom: 28,
        }}
      >
        <KpiCard label="Total de usuários" value={fmtNum(totalUsers)} />
        <KpiCard label="Novos (7 dias)" value={fmtNum(newUsers7d)} />
      </div>

      {/* DB KPIs */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        BASE DE DADOS
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {dbCards.map((c) => (
          <KpiCard key={c.label} label={c.label} value={fmtNum(c.value)} />
        ))}
      </div>

      {/* ETL Status table */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        STATUS DOS ETLs
      </h2>

      {etlLatest.length === 0 ? (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '32px',
            textAlign: 'center',
            color: 'var(--ink-3)',
            fontSize: 14,
          }}
        >
          Nenhum registro em <code>coletas_log</code> ainda.
        </div>
      ) : (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: 13.5,
            }}
          >
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                {['Fonte', 'Última execução', 'Duração', 'Registros', 'Status', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: 12,
                      color: 'var(--ink-3)',
                      letterSpacing: '0.04em',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {etlLatest.map((row) => {
                const variant = etlBadgeVariant(row.status)
                const isFailed = variant === 'err'
                return (
                  <tr
                    key={row.fonte}
                    style={{ borderTop: '1px solid var(--line)' }}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 500, color: 'var(--ink)' }}>
                      {row.fonte}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {fmtDate(row.criado_em)}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {fmtDuration(row.duracao_ms)}
                    </td>
                    <td style={{ padding: '10px 14px', color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                      {fmtNum(row.registros)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <StatusBadge variant={variant} label={row.status} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {isFailed && (
                        <a
                          href={`/admin/etl?fonte=${encodeURIComponent(row.fonte)}`}
                          style={{
                            fontSize: 12,
                            color: 'var(--brand)',
                            textDecoration: 'none',
                            fontWeight: 500,
                            border: '1px solid var(--line)',
                            borderRadius: 5,
                            padding: '3px 10px',
                            display: 'inline-block',
                          }}
                        >
                          Ver ETL →
                        </a>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
