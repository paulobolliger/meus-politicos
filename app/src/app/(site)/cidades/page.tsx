import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Emendas por Município | Meus Políticos',
  description: 'Veja quais municípios mais receberam emendas parlamentares per capita. Dados do Portal da Transparência.',
}

type Faixa = 'ate_20k' | '20k_50k' | '50k_100k' | '100k_500k' | 'acima_500k'
type Ordenacao = 'per_capita' | 'total'

const FAIXA_LABEL: Record<Faixa, string> = {
  ate_20k:      'Até 20 mil hab.',
  '20k_50k':    '20 mil – 50 mil',
  '50k_100k':   '50 mil – 100 mil',
  '100k_500k':  '100 mil – 500 mil',
  acima_500k:   'Acima de 500 mil',
}

const FAIXAS: Faixa[] = ['ate_20k', '20k_50k', '50k_100k', '100k_500k', 'acima_500k']

type MunicipioRow = {
  codigo_ibge: string
  nome: string
  uf: string
  populacao: number | null
  faixa_populacional: string | null
  total_emendas: number
  per_capita: number
  qtd_parlamentares: number
  qtd_emendas: number
}

function fmt(val: number): string {
  if (val >= 1_000_000_000) return `R$ ${(val / 1_000_000_000).toFixed(1)}bi`
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}mi`
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)}mil`
  return `R$ ${val.toFixed(0)}`
}

function fmtPop(val: number | null): string {
  if (!val) return '—'
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`
  if (val >= 1_000) return `${(val / 1_000).toFixed(0)}k`
  return String(val)
}

// Inline bar from 0–100% representing per_capita relative to max
function BarCell({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 100 }}>
      <div style={{ flex: 1, height: 4, background: 'var(--line-soft)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
      </div>
    </div>
  )
}

export default async function CidadesPage({
  searchParams,
}: {
  searchParams: Promise<{ faixa?: string; ord?: string; uf?: string; q?: string }>
}) {
  const params = await searchParams
  const faixaParam = (params.faixa ?? null) as Faixa | null
  const ord: Ordenacao = params.ord === 'total' ? 'total' : 'per_capita'
  const ufParam = params.uf?.toUpperCase() || null
  const busca = params.q?.trim() || null

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('v_emendas_municipio')
    .select('*')
    .gt('total_emendas', 0)

  if (faixaParam) query = query.eq('faixa_populacional', faixaParam)
  if (ufParam)    query = query.eq('uf', ufParam)
  if (busca)      query = query.ilike('nome', `%${busca}%`)

  if (ord === 'per_capita') {
    query = query.order('per_capita', { ascending: false })
  } else {
    query = query.order('total_emendas', { ascending: false })
  }

  query = query.limit(100)

  const { data } = await query
  const rows: MunicipioRow[] = (data as MunicipioRow[]) || []

  const maxPerCapita = rows.reduce((m, r) => Math.max(m, r.per_capita), 0)
  const maxTotal     = rows.reduce((m, r) => Math.max(m, r.total_emendas), 0)
  const barMax       = ord === 'per_capita' ? maxPerCapita : maxTotal

  // UF list for filter (distinct from results + a few common ones)
  const UFS = [
    'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA',
    'MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN',
    'RO','RR','RS','SC','SE','SP','TO',
  ]

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 28,
    padding: '0 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }

  function chipStyle(active: boolean): React.CSSProperties {
    return {
      ...chipBase,
      background: active ? 'var(--ink)' : 'var(--panel)',
      color: active ? 'var(--bg)' : 'var(--ink-2)',
      border: `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
    }
  }

  // Build href helper preserving other params
  function href(overrides: Record<string, string | null>) {
    const p: Record<string, string> = {}
    if (faixaParam && overrides.faixa === undefined) p.faixa = faixaParam
    if (ufParam && overrides.uf === undefined)       p.uf = ufParam
    if (busca && overrides.q === undefined)          p.q = busca
    if (ord !== 'per_capita' && overrides.ord === undefined) p.ord = ord
    for (const [k, v] of Object.entries(overrides)) {
      if (v !== null) p[k] = v
    }
    const qs = new URLSearchParams(p).toString()
    return `/cidades${qs ? `?${qs}` : ''}`
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── Hero ── */}
      <section style={{
        background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)',
        borderBottom: '1px solid var(--line-soft)',
        padding: '48px 24px 32px',
      }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          <div className="label" style={{ marginBottom: 12 }}>EMENDAS PARLAMENTARES · POR MUNICÍPIO</div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(28px, 5vw, 48px)',
            lineHeight: 1.1,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
          }}>
            Quanto chegou à sua cidade?
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 560 }}>
            Ranking dos municípios que mais receberam emendas parlamentares.
            {' '}<strong style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Per capita</strong> revela onde o dinheiro realmente chegou — independente do tamanho da cidade.
          </p>

          {/* Ordenação */}
          <div style={{ display: 'flex', gap: 6, marginTop: 20, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--mute)', marginRight: 4 }}>Ordenar por</span>
            <Link href={href({ ord: 'per_capita' })} style={chipStyle(ord === 'per_capita')}>
              Per capita
            </Link>
            <Link href={href({ ord: 'total' })} style={chipStyle(ord === 'total')}>
              Total recebido
            </Link>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 24px 80px' }}>

        {/* Filters row */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>

          {/* Faixa popuacional */}
          <div>
            <div style={{ fontSize: 11, color: 'var(--mute)', marginBottom: 6, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
              PORTE
            </div>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <Link href={href({ faixa: null })} style={chipStyle(!faixaParam)}>Todos</Link>
              {FAIXAS.map((f) => (
                <Link key={f} href={href({ faixa: faixaParam === f ? null : f })} style={chipStyle(faixaParam === f)}>
                  {FAIXA_LABEL[f]}
                </Link>
              ))}
            </div>
          </div>

        </div>

        {/* UF quick filters */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 24, paddingBottom: 20, borderBottom: '1px solid var(--line-soft)' }}>
          <Link href={href({ uf: null })} style={chipStyle(!ufParam)}>Brasil</Link>
          {UFS.map((uf) => (
            <Link key={uf} href={href({ uf: ufParam === uf ? null : uf })}
              style={{
                ...chipBase,
                height: 24,
                fontSize: 11,
                padding: '0 8px',
                background: ufParam === uf ? 'var(--brand)' : 'var(--panel)',
                color: ufParam === uf ? '#fff' : 'var(--ink-3)',
                border: `1px solid ${ufParam === uf ? 'var(--brand)' : 'var(--line)'}`,
                fontFamily: 'var(--font-mono)',
              }}>
              {uf}
            </Link>
          ))}
        </div>

        {/* Empty state */}
        {rows.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🏘️</div>
            <p style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>Nenhum município encontrado.</p>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>
              Execute o ETL de emendas e o script IBGE para popular os dados:{' '}
              <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4 }}>
                python etl/ibge/collect_municipios.py
              </code>
            </p>
          </div>
        )}

        {/* Results table — desktop */}
        {rows.length > 0 && (
          <>
            {/* Summary */}
            <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink-3)' }}>
              {rows.length === 100
                ? 'Top 100 municípios'
                : `${rows.length} município${rows.length !== 1 ? 's' : ''}`}
              {faixaParam ? ` · ${FAIXA_LABEL[faixaParam]}` : ''}
              {ufParam ? ` · ${ufParam}` : ''}
            </div>

            {/* Desktop table */}
            <div style={{
              display: 'none',
              background: 'var(--panel)',
              borderRadius: 10,
              boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.04)',
              overflow: 'hidden',
            }}
              className="desktop-table"
            >
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}>#</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}>MUNICÍPIO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}>POPULAÇÃO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}>TOTAL RECEBIDO</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}>PER CAPITA</th>
                    <th style={{ padding: '12px 16px', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}></th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.07em', color: 'var(--mute)', fontWeight: 600 }}>PARLAMENTARES</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={row.codigo_ibge} style={{
                      borderBottom: i < rows.length - 1 ? '1px solid var(--line-soft)' : 'none',
                    }}>
                      <td style={{ padding: '12px 16px', color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                        {i + 1}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', fontSize: 13.5 }}>{row.nome}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>
                          {row.uf}
                          {row.faixa_populacional ? ` · ${FAIXA_LABEL[row.faixa_populacional as Faixa] ?? row.faixa_populacional}` : ''}
                        </div>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12, fontVariantNumeric: 'tabular-nums' }}>
                        {fmtPop(row.populacao)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(row.total_emendas)}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontSize: 13, fontVariantNumeric: 'tabular-nums' }}>
                        {row.per_capita > 0 ? `R$ ${row.per_capita.toFixed(2)}/hab` : '—'}
                      </td>
                      <td style={{ padding: '12px 16px', minWidth: 120 }}>
                        <BarCell
                          value={ord === 'per_capita' ? row.per_capita : row.total_emendas}
                          max={barMax}
                          color="var(--brand)"
                        />
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 12 }}>
                        {row.qtd_parlamentares}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="mobile-cards">
              {rows.map((row, i) => (
                <div key={row.codigo_ibge} style={{
                  background: 'var(--panel)',
                  borderRadius: 10,
                  padding: '14px 16px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 6px rgba(0,0,0,0.03)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', minWidth: 20 }}>
                          #{i + 1}
                        </span>
                        <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{row.nome}</span>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginLeft: 'auto', flexShrink: 0 }}>
                          {row.uf}
                        </span>
                      </div>
                      <div style={{ paddingLeft: 28 }}>
                        <BarCell
                          value={ord === 'per_capita' ? row.per_capita : row.total_emendas}
                          max={barMax}
                          color="var(--brand)"
                        />
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16, marginTop: 10, paddingLeft: 28 }}>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 2 }}>PER CAPITA</div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                        {row.per_capita > 0 ? `R$ ${row.per_capita.toFixed(2)}` : '—'}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 2 }}>TOTAL</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                        {fmt(row.total_emendas)}
                      </div>
                    </div>
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em', marginBottom: 2 }}>POPULAÇÃO</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
                        {fmtPop(row.populacao)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Nota metodológica */}
            <div style={{ marginTop: 32, padding: '14px 18px', background: 'var(--bg-2)', borderRadius: 8, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--ink-2)' }}>Nota:</strong> Dados de emendas do Portal da Transparência do Governo Federal.
              Per capita calculado com base na população do Censo 2022 (IBGE).
              Municípios sem dados de população são excluídos do cálculo per capita.
              {' '}<Link href="/metodologia" style={{ color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>Ver metodologia completa →</Link>
            </div>
          </>
        )}
      </div>

      <style>{`
        @media (min-width: 768px) {
          .desktop-table { display: block !important; }
          .mobile-cards  { display: none !important; }
        }
      `}</style>
    </div>
  )
}
