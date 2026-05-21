import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageHeader } from '@/components/admin/AdminCard'
import { PoliticoEditorSection } from '@/components/admin/PoliticoEditorSection'
import { MatchEmendaButton } from '@/components/admin/MatchEmendaButton'

export const metadata = { title: 'Qualidade de Dados — Admin' }

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return '0'
  return n.toLocaleString('pt-BR')
}

function fmtBRL(cents: number | null): string {
  if (!cents) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export default async function DadosQualidadePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const supabase = await createClient()
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const params = await searchParams
  const busca = params.busca ?? ''

  // Section 1: incomplete politicians
  const { count: semFoto } = await adminClient
    .from('politicos')
    .select('*', { count: 'exact', head: true })
    .is('foto_url', null) as { count: number | null }

  const { count: semSiafi } = await db
    .from('politicos')
    .select('*', { count: 'exact', head: true })
    .is('codigo_siafi', null) as { count: number | null }

  // Section 2: orphan emendas
  // The emendas table may have nome_parlamentar, valor_pago, valor_empenhado from a newer migration
  type EmendaOrfã = { nome_parlamentar: string | null; valor_pago: number | null; valor_empenhado: number | null }
  const { data: orphanEmendas } = await db
    .from('emendas')
    .select('nome_parlamentar, valor_pago, valor_empenhado')
    .is('politico_id', null)
    .limit(100) as { data: EmendaOrfã[] | null }

  // Group orphan emendas by nome_parlamentar
  const orphanMap = new Map<string, { count: number; total: number }>()
  for (const e of orphanEmendas ?? []) {
    const key = e.nome_parlamentar ?? '(sem nome)'
    const entry = orphanMap.get(key) ?? { count: 0, total: 0 }
    entry.count++
    entry.total += (e.valor_pago ?? e.valor_empenhado ?? 0)
    orphanMap.set(key, entry)
  }
  const orphanRows = Array.from(orphanMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 20)

  // Section 3: politician editor search
  type PoliticoEditorRow = {
    id: string
    nome_civil: string | null
    nome_eleitoral: string | null
    foto_url: string | null
    codigo_siafi: string | null
    email: string | null
  }
  const politicosResults: { data: PoliticoEditorRow[] } =
    busca.length >= 2
      ? await db
          .from('politicos')
          .select('id, nome_civil, nome_eleitoral, foto_url, codigo_siafi, email')
          .or(
            `nome_civil.ilike.%${busca}%,nome_eleitoral.ilike.%${busca}%`
          )
          .limit(20)
      : { data: [] }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000 }}>
      <AdminPageHeader
        title="Qualidade de Dados"
        subtitle="Inconsistências, dados faltantes e editor inline"
      />

      {/* Section 1: Incomplete politicians */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        1 — POLÍTICOS INCOMPLETOS
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { label: 'Sem foto', value: semFoto, icon: '📷' },
          { label: 'Sem código SIAFI', value: semSiafi, icon: '🔢' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: 'var(--panel)',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: (item.value ?? 0) > 0 ? 'var(--warn)' : 'var(--pos)',
                  lineHeight: 1,
                }}
              >
                {fmtNum(item.value)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Orphan emendas */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        2 — EMENDAS SEM POLÍTICO VINCULADO
      </h2>

      {orphanRows.length === 0 ? (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '20px 24px',
            color: 'var(--pos)',
            fontSize: 14,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✓</span> Nenhuma emenda órfã encontrada.
        </div>
      ) : (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            marginBottom: 32,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                {['Parlamentar', 'Emendas', 'Total', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: 12,
                      color: 'var(--ink-3)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orphanRows.map(([nome, data]) => (
                <tr key={nome} style={{ borderTop: '1px solid var(--line)' }}>
                  <td
                    style={{
                      padding: '9px 14px',
                      fontWeight: 500,
                      color: 'var(--ink)',
                    }}
                  >
                    {nome}
                  </td>
                  <td
                    style={{
                      padding: '9px 14px',
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                    }}
                  >
                    {data.count}
                  </td>
                  <td
                    style={{
                      padding: '9px 14px',
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                    }}
                  >
                    {fmtBRL(data.total)}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <MatchEmendaButton nomeParlamentar={nome} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 3: Politician editor */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        3 — EDITOR DE POLÍTICOS
      </h2>

      <PoliticoEditorSection
        busca={busca}
        results={politicosResults.data ?? []}
      />
    </div>
  )
}
