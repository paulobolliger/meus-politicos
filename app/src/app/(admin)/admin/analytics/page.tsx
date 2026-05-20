import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageHeader, KpiCard } from '@/components/admin/AdminCard'

export const metadata = { title: 'Analytics — Admin' }

type EventRow = {
  tipo: string
  payload: Record<string, unknown> | null
  criado_em: string
  usuario_id: string | null
}

type SearchEntry = { query: string; count: number }
type ViewEntry = { politico_id: string; nome: string; count: number }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const { data: eventos } = await db
    .from('analytics_eventos')
    .select('tipo, payload, criado_em, usuario_id')
    .order('criado_em', { ascending: false })
    .limit(2000) as { data: EventRow[] | null }

  const rows = eventos ?? []

  // Total events
  const totalEventos = rows.length
  const totalBuscas = rows.filter((r) => r.tipo === 'busca').length
  const totalViews = rows.filter((r) => r.tipo === 'perfil_view').length

  // Top searches
  const searchMap = new Map<string, number>()
  for (const r of rows) {
    if (r.tipo === 'busca' && r.payload) {
      const q = String((r.payload as { query?: string }).query ?? '').trim().toLowerCase()
      if (q) searchMap.set(q, (searchMap.get(q) ?? 0) + 1)
    }
  }
  const topSearches: SearchEntry[] = Array.from(searchMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([query, count]) => ({ query, count }))

  // Top politician views
  const viewMap = new Map<string, { nome: string; count: number }>()
  for (const r of rows) {
    if (r.tipo === 'perfil_view' && r.payload) {
      const p = r.payload as { politico_id?: string; nome?: string }
      const pid = String(p.politico_id ?? '')
      if (pid) {
        const entry = viewMap.get(pid) ?? { nome: p.nome ?? pid, count: 0 }
        entry.count++
        viewMap.set(pid, entry)
      }
    }
  }
  const topViews: ViewEntry[] = Array.from(viewMap.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 15)
    .map(([politico_id, v]) => ({ politico_id, nome: v.nome, count: v.count }))

  return (
    <div style={{ padding: '32px 36px', maxWidth: 960 }}>
      <AdminPageHeader
        title="Analytics"
        subtitle="Eventos registrados em analytics_eventos"
      />

      {/* KPI cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        <KpiCard label="Total de eventos" value={totalEventos.toLocaleString('pt-BR')} />
        <KpiCard label="Buscas" value={totalBuscas.toLocaleString('pt-BR')} />
        <KpiCard label="Visualizações de perfil" value={totalViews.toLocaleString('pt-BR')} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
        {/* Top searches */}
        <div>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--ink-3)',
              marginBottom: 12,
            }}
          >
            TOP BUSCAS
          </h2>
          {topSearches.length === 0 ? (
            <div
              style={{
                background: 'var(--panel)',
                borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: '20px',
                color: 'var(--ink-3)',
                fontSize: 14,
              }}
            >
              Nenhuma busca registrada.
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
              {topSearches.map((item, idx) => (
                <div
                  key={item.query}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderTop: idx > 0 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        width: 22,
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                        textAlign: 'right',
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.query}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--brand)',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top politician views */}
        <div>
          <h2
            style={{
              fontSize: 13,
              fontWeight: 600,
              letterSpacing: '0.06em',
              color: 'var(--ink-3)',
              marginBottom: 12,
            }}
          >
            PERFIS MAIS VISITADOS
          </h2>
          {topViews.length === 0 ? (
            <div
              style={{
                background: 'var(--panel)',
                borderRadius: 10,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                padding: '20px',
                color: 'var(--ink-3)',
                fontSize: 14,
              }}
            >
              Nenhuma visualização registrada.
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
              {topViews.map((item, idx) => (
                <div
                  key={item.politico_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '9px 14px',
                    borderTop: idx > 0 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                    <span
                      style={{
                        width: 22,
                        fontSize: 11,
                        color: 'var(--ink-3)',
                        fontFamily: 'var(--font-mono)',
                        flexShrink: 0,
                        textAlign: 'right',
                      }}
                    >
                      {idx + 1}.
                    </span>
                    <span
                      style={{
                        fontSize: 13.5,
                        color: 'var(--ink)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.nome}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--brand)',
                      flexShrink: 0,
                      marginLeft: 8,
                    }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
