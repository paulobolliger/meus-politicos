'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useCallback, useRef, useState, useTransition } from 'react'
import Link from 'next/link'

type PoliticoCompar = {
  id: string
  slug: string
  nome_eleitoral: string
  nome: string
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partido_sigla: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  total_emendas_ano: number | null
  total_emendas_historico: number | null
  mandato_inicio: string | null
  mandato_fim: string | null
}

type SearchResult = {
  slug: string
  nome_eleitoral: string
  cargo: string | null
  uf: string | null
  partido_sigla: string | null
  foto_url: string | null
}

function initials(nome: string) {
  return nome
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
}

function fmt(val: number | null): string {
  if (val === null || val === undefined) return '—'
  if (val >= 1_000_000_000) return `R$ ${(val / 1_000_000_000).toFixed(1)}bi`
  if (val >= 1_000_000) return `R$ ${(val / 1_000_000).toFixed(1)}mi`
  if (val >= 1_000) return `R$ ${(val / 1_000).toFixed(0)} mil`
  return `R$ ${val.toFixed(0)}`
}

function Gauge({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ height: 6, background: 'var(--line-soft)', borderRadius: 99 }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 0.3s ease' }} />
      </div>
      <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
        {pct}% do maior
      </div>
    </div>
  )
}

function PresencaRing({ value }: { value: number | null }) {
  if (value === null) return <span style={{ color: 'var(--mute)', fontSize: 13 }}>—</span>
  const color = value >= 80 ? 'var(--pos)' : value >= 60 ? 'var(--warn)' : 'var(--neg)'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <svg width={36} height={36} viewBox="0 0 36 36">
        <circle cx={18} cy={18} r={14} fill="none" stroke="var(--line-soft)" strokeWidth={4} />
        <circle
          cx={18} cy={18} r={14}
          fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${(value / 100) * 88} 88`}
          strokeLinecap="round"
          transform="rotate(-90 18 18)"
        />
      </svg>
      <span style={{ fontSize: 18, fontWeight: 700, color, fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
        {value.toFixed(0)}%
      </span>
    </div>
  )
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Dep. Federal',
  senador: 'Senador',
  presidente: 'Presidente',
  governador: 'Governador',
  deputado_estadual: 'Dep. Estadual',
  vereador: 'Vereador',
}

type MetricRow = {
  key: keyof PoliticoCompar
  label: string
  render: (p: PoliticoCompar) => React.ReactNode
  getVal: (p: PoliticoCompar) => number | null
  higherIsBetter: boolean
  gaugeColor: string
}

const METRIC_ROWS: MetricRow[] = [
  {
    key: 'presenca_pct_atual',
    label: 'Presença',
    render: (p) => <PresencaRing value={p.presenca_pct_atual} />,
    getVal: (p) => p.presenca_pct_atual,
    higherIsBetter: true,
    gaugeColor: 'var(--pos)',
  },
  {
    key: 'gasto_total_ano',
    label: 'Gastos CEAP (ano)',
    render: (p) => (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: p.gasto_total_ano !== null ? 'var(--ink)' : 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(p.gasto_total_ano)}
      </div>
    ),
    getVal: (p) => p.gasto_total_ano,
    higherIsBetter: false,
    gaugeColor: 'var(--neg)',
  },
  {
    key: 'total_emendas_ano',
    label: 'Emendas (ano)',
    render: (p) => (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 700, color: p.total_emendas_ano ? 'var(--brand)' : 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(p.total_emendas_ano)}
      </div>
    ),
    getVal: (p) => p.total_emendas_ano,
    higherIsBetter: true,
    gaugeColor: 'var(--brand)',
  },
  {
    key: 'total_emendas_historico',
    label: 'Emendas (histórico)',
    render: (p) => (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
        {fmt(p.total_emendas_historico)}
      </div>
    ),
    getVal: (p) => p.total_emendas_historico,
    higherIsBetter: true,
    gaugeColor: 'var(--accent)',
  },
  {
    key: 'total_votacoes',
    label: 'Votações',
    render: (p) => (
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 600, color: p.total_votacoes !== null ? 'var(--ink)' : 'var(--mute)', fontVariantNumeric: 'tabular-nums' }}>
        {p.total_votacoes !== null ? p.total_votacoes.toLocaleString('pt-BR') : '—'}
      </div>
    ),
    getVal: (p) => p.total_votacoes,
    higherIsBetter: true,
    gaugeColor: 'var(--info)',
  },
]

export function CompararClient({
  politicosIniciais,
  slugsIniciais,
}: {
  politicosIniciais: PoliticoCompar[]
  slugsIniciais: string[]
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  // Derived state from props (server controls actual data)
  const politicos = politicosIniciais
  const slugs = slugsIniciais

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const navigate = useCallback((newSlugs: string[]) => {
    const qs = newSlugs.length > 0 ? `?slugs=${newSlugs.join(',')}` : ''
    startTransition(() => {
      router.push(`${pathname}${qs}`, { scroll: false })
    })
  }, [router, pathname])

  const handleSearch = useCallback(async (q: string) => {
    setQuery(q)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (!q.trim()) { setResults([]); return }

    debounceRef.current = setTimeout(async () => {
      setLoadingSearch(true)
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(q)}&limite=8`)
        if (!res.ok) return
        const json = await res.json()
        const items: SearchResult[] = (json.items ?? []).map((p: Record<string, unknown>) => ({
          slug: p.slug as string,
          nome_eleitoral: (p.nome_eleitoral ?? p.nome) as string,
          cargo: (p.cargo ?? null) as string | null,
          uf: (p.uf ?? null) as string | null,
          partido_sigla: (p.partido_sigla ?? null) as string | null,
          foto_url: (p.foto_url ?? null) as string | null,
        }))
        setResults(items.filter((r) => !slugs.includes(r.slug)))
      } catch {
        // silently ignore
      } finally {
        setLoadingSearch(false)
      }
    }, 280)
  }, [slugs])

  const addPolitico = useCallback((result: SearchResult) => {
    if (slugs.includes(result.slug) || slugs.length >= 5) return
    navigate([...slugs, result.slug])
    setQuery('')
    setResults([])
  }, [slugs, navigate])

  const removePolitico = useCallback((slug: string) => {
    navigate(slugs.filter((s) => s !== slug))
  }, [slugs, navigate])

  // Max values for gauges
  const maxVals: Record<string, number> = {}
  for (const row of METRIC_ROWS) {
    const vals = politicos.map((p) => row.getVal(p) ?? 0)
    maxVals[row.key as string] = Math.max(...vals, 1)
  }

  const canAdd = slugs.length < 5

  return (
    <div style={{ opacity: isPending ? 0.7 : 1, transition: 'opacity 0.15s ease' }}>
      {/* Search + selected chips row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
        <div style={{ flex: '1 1 280px', position: 'relative', maxWidth: 380 }}>
          <input
            type="text"
            placeholder={canAdd ? 'Adicionar parlamentar...' : 'Limite de 5 atingido'}
            disabled={!canAdd}
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            style={{
              width: '100%',
              height: 40,
              padding: '0 36px 0 12px',
              border: '1px solid var(--line)',
              borderRadius: 8,
              fontSize: 14,
              background: 'var(--panel)',
              color: 'var(--ink)',
              outline: 'none',
              boxSizing: 'border-box',
              opacity: canAdd ? 1 : 0.5,
            }}
          />
          {loadingSearch && (
            <div style={{
              position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
              width: 14, height: 14, borderRadius: '50%',
              border: '2px solid var(--brand)',
              borderTopColor: 'transparent',
              animation: 'spin 0.6s linear infinite',
              pointerEvents: 'none',
            }} />
          )}

          {/* Dropdown */}
          {results.length > 0 && (
            <div style={{
              position: 'absolute', top: 44, left: 0, right: 0, zIndex: 50,
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 8, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', overflow: 'hidden',
            }}>
              {results.map((r) => (
                <button key={r.slug} onClick={() => addPolitico(r)}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 12px', background: 'none', border: 'none',
                    borderBottom: '1px solid var(--line-soft)', cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%',
                    background: 'var(--brand-soft)', display: 'flex', alignItems: 'center',
                    justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)',
                    flexShrink: 0, overflow: 'hidden',
                  }}>
                    {r.foto_url
                      ? <img src={r.foto_url} alt="" style={{ width: 32, height: 32, objectFit: 'cover' }} />
                      : initials(r.nome_eleitoral)}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{r.nome_eleitoral}</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                      {[r.cargo ? (CARGO_LABEL[r.cargo] ?? r.cargo) : null, r.uf, r.partido_sigla].filter(Boolean).join(' · ')}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chips */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
          {politicos.map((p) => (
            <div key={p.slug} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              height: 32, padding: '0 8px 0 6px',
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 999, fontSize: 13, color: 'var(--ink-2)',
              boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: 'var(--brand-soft)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, fontWeight: 700, color: 'var(--brand)', flexShrink: 0,
              }}>
                {p.foto_url
                  ? <img src={p.foto_url} alt="" style={{ width: 20, height: 20, objectFit: 'cover' }} />
                  : initials(p.nome_eleitoral)}
              </div>
              <span style={{ fontWeight: 500, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {p.nome_eleitoral}
              </span>
              <button onClick={() => removePolitico(p.slug)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  width: 14, height: 14, borderRadius: '50%',
                  background: 'var(--line)', border: 'none', cursor: 'pointer',
                  fontSize: 9, color: 'var(--ink-3)', padding: 0, lineHeight: 1,
                }}
                aria-label={`Remover ${p.nome_eleitoral}`}
              >✕</button>
            </div>
          ))}
          {slugs.length > 0 && (
            <span style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
              {slugs.length}/5
            </span>
          )}
        </div>
      </div>

      {/* Empty state */}
      {politicos.length === 0 && (
        <div style={{ textAlign: 'center', padding: '80px 0' }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>⚖️</div>
          <p style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 600, margin: '0 0 6px' }}>
            Busque parlamentares acima para comparar
          </p>
          <p style={{ fontSize: 13, color: 'var(--mute)', margin: 0 }}>
            Até 5 parlamentares lado a lado
          </p>
        </div>
      )}

      {/* Comparison grid */}
      {politicos.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ minWidth: Math.max(600, 190 * politicos.length + 190) }}>

            {/* Header cards */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `190px repeat(${politicos.length}, 1fr)`,
              gap: 10,
              marginBottom: 4,
            }}>
              <div />
              {politicos.map((p) => (
                <div key={p.slug} style={{
                  background: 'var(--panel)',
                  borderRadius: '10px 10px 0 0',
                  padding: '16px 12px',
                  textAlign: 'center',
                  borderTop: '3px solid var(--brand)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: '50%',
                    margin: '0 auto 10px', overflow: 'hidden',
                    background: 'var(--brand-soft)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, fontWeight: 700, color: 'var(--brand)',
                  }}>
                    {p.foto_url
                      ? <img src={p.foto_url} alt="" style={{ width: 52, height: 52, objectFit: 'cover' }} />
                      : initials(p.nome_eleitoral)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
                    <Link href={`/politicos/${p.slug}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                      {p.nome_eleitoral}
                    </Link>
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--ink-3)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                    {[p.cargo ? (CARGO_LABEL[p.cargo] ?? p.cargo) : null, p.uf].filter(Boolean).join(' · ')}
                  </div>
                  {p.partido_sigla && (
                    <div style={{
                      display: 'inline-block', marginTop: 6,
                      fontSize: 10, padding: '1px 6px', borderRadius: 4,
                      background: 'var(--bg-2)', color: 'var(--ink-3)',
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                    }}>
                      {p.partido_sigla}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Metric rows */}
            {METRIC_ROWS.map((row, ri) => (
              <div key={row.key as string} style={{
                display: 'grid',
                gridTemplateColumns: `190px repeat(${politicos.length}, 1fr)`,
                gap: 10,
                marginBottom: 3,
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center',
                  padding: '14px 16px',
                  background: ri % 2 === 0 ? 'var(--bg-2)' : 'var(--bg)',
                  borderRadius: 6,
                  fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
                  fontFamily: 'var(--font-mono)', letterSpacing: '0.04em',
                }}>
                  {row.label.toUpperCase()}
                </div>
                {politicos.map((p) => {
                  const val = row.getVal(p)
                  const max = maxVals[row.key as string] ?? 1
                  const gaugeVal = val !== null
                    ? (row.higherIsBetter ? val : max - val)
                    : 0
                  return (
                    <div key={p.slug} style={{
                      padding: '14px 14px 10px',
                      background: ri % 2 === 0 ? 'var(--panel)' : 'var(--bg-2)',
                      borderRadius: 6,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                    }}>
                      {row.render(p)}
                      {val !== null && (
                        <div style={{ marginTop: 8 }}>
                          <Gauge value={gaugeVal} max={max} color={row.gaugeColor} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}

            {/* Perfil links */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: `190px repeat(${politicos.length}, 1fr)`,
              gap: 10,
              marginTop: 12,
            }}>
              <div />
              {politicos.map((p) => (
                <div key={p.slug} style={{ textAlign: 'center', padding: '10px 12px' }}>
                  <Link href={`/politicos/${p.slug}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      height: 34, padding: '0 14px', borderRadius: 8,
                      background: 'var(--brand)', color: '#fff',
                      textDecoration: 'none', fontSize: 12, fontWeight: 600,
                    }}>
                    Ver perfil →
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Share link */}
      {politicos.length >= 2 && (
        <div style={{ marginTop: 28, padding: '14px 18px', background: 'var(--bg-2)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
            Comparando <strong>{politicos.length} parlamentares</strong> — compartilhe a URL para preservar esta comparação.
          </span>
          <button
            onClick={() => { if (typeof navigator !== 'undefined') navigator.clipboard.writeText(window.location.href).catch(() => {}) }}
            style={{
              height: 32, padding: '0 14px', borderRadius: 6,
              background: 'var(--panel)', border: '1px solid var(--line)',
              fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', cursor: 'pointer',
            }}
          >
            Copiar link
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: translateY(-50%) rotate(360deg); } }`}</style>
    </div>
  )
}
