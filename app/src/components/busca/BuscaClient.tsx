'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

type PoliticoBusca = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  mandato_inicio: string | null
  partidos: { sigla: string | null } | null
}

type BuscaResponse = {
  items: PoliticoBusca[]
  total: number
  totalPaginas: number
  pagina: number
  porPagina: number
  elapsedMs: number
  totalIndexados: number
  chips: {
    cargos: Array<{ id: string; label: string; total: number | null }>
    ufs: string[]
    partidos: string[]
  }
}

type Props = {
  variant: 'site' | 'app'
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Dep. Federal',
  senador: 'Senador',
  governador: 'Governador',
  prefeito: 'Prefeito',
  deputado_estadual: 'Dep. Estadual',
  vereador: 'Vereador',
}

function makeAvatarColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const palette = ['#1d3a8a', '#2952cc', '#0a7d58', '#c2410c', '#7c3aed', '#1f2937', '#be185d']
  return palette[Math.abs(hash) % palette.length]
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function presenceColor(value: number | null) {
  if (value == null) return 'var(--ink-3)'
  if (value >= 90) return 'var(--pos)'
  if (value >= 80) return 'var(--ink)'
  return 'var(--warn)'
}

function formatMoneyPerMonth(gastoAnual: number | null) {
  if (gastoAnual == null) return '–'
  return `R$ ${(gastoAnual / 12 / 1000).toFixed(1)}k`
}

function filterLabel(value: string, fallback = 'todos') {
  return value || fallback
}

export function BuscaClient({ variant }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam = (searchParams.get('q') ?? '').trim()
  const cargo = (searchParams.get('cargo') ?? '').trim()
  const uf = (searchParams.get('uf') ?? '').trim().toUpperCase()
  const partido = (searchParams.get('partido') ?? '').trim().toUpperCase()
  const ordem = (searchParams.get('ordem') ?? 'relevancia').trim()
  const pagina = Math.max(1, Number.parseInt(searchParams.get('pagina') ?? '1', 10) || 1)

  const [queryInput, setQueryInput] = useState(qParam)
  const [data, setData] = useState<BuscaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setQueryInput(qParam)
  }, [qParam])

  const queryString = useMemo(() => searchParams.toString(), [searchParams])

  useEffect(() => {
    let active = true

    async function run() {
      setLoading(true)
      setError(null)

      try {
        const response = await fetch(`/api/busca?${queryString}`, { cache: 'no-store' })
        if (!response.ok) {
          throw new Error('Falha ao buscar resultados')
        }

        const json = (await response.json()) as BuscaResponse
        if (!active) return
        setData(json)
      } catch {
        if (!active) return
        setError('Não foi possível carregar os resultados no momento.')
      } finally {
        if (!active) return
        setLoading(false)
      }
    }

    run()

    return () => {
      active = false
    }
  }, [queryString])

  function navigateWith(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())

    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key)
      else params.set(key, value)
    })

    if (updates.cargo !== undefined || updates.uf !== undefined || updates.partido !== undefined || updates.q !== undefined || updates.ordem !== undefined) {
      params.set('pagina', '1')
    }

    const next = params.toString()
    router.push(next ? `/busca?${next}` : '/busca')
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigateWith({ q: queryInput || null })
  }

  const items = data?.items ?? []
  const total = data?.total ?? 0
  const totalPaginas = data?.totalPaginas ?? 1
  const totalIndexados = data?.totalIndexados ?? 0
  const elapsedMs = data?.elapsedMs ?? 0
  const porPagina = data?.porPagina ?? 20

  const firstItem = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const lastItem = total === 0 ? 0 : Math.min(pagina * porPagina, total)

  const orderButtons = [
    ['relevancia', 'RELEVÂNCIA'],
    ['presenca', 'PRESENÇA'],
    ['gastos', 'GASTOS'],
    ['votacoes', 'VOTAÇÕES'],
  ] as const

  const isApp = variant === 'app'

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <section style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '18px 24px 16px' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 10 }}>
            BUSCA · {totalIndexados} REPRESENTANTES INDEXADOS
          </div>

          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  border: '1px solid var(--ink)',
                  background: 'var(--panel)',
                  padding: '0 12px',
                  minHeight: 52,
                }}
              >
                <span className="mono" style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: 14 }}>›</span>
                <input
                  value={queryInput}
                  onChange={(e) => setQueryInput(e.target.value)}
                  placeholder="Buscar por nome eleitoral"
                  style={{
                    border: 'none',
                    outline: 'none',
                    background: 'transparent',
                    width: '100%',
                    height: 48,
                    color: 'var(--ink)',
                    fontSize: 15,
                    fontFamily: 'var(--font-mono)',
                  }}
                />
              </div>
              <button
                type="submit"
                style={{
                  border: '1px solid var(--ink)',
                  background: 'var(--ink)',
                  color: 'var(--bg)',
                  padding: '0 16px',
                  minHeight: 52,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                Buscar →
              </button>
            </div>

            <div style={{ display: 'grid', gap: 8 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>CARGO:</span>
                {[
                  ['', `Todos ${totalIndexados}`],
                  ['deputado_federal', 'Dep. Federal'],
                  ['senador', 'Senador'],
                ].map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => navigateWith({ cargo: id || null })}
                    style={{
                      border: '1px solid var(--line-strong)',
                      background: cargo === id ? 'var(--ink)' : 'transparent',
                      color: cargo === id ? 'var(--bg)' : 'var(--ink-2)',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>UF:</span>
                {['', 'SP', 'MG', 'RJ', 'BA'].map((item) => (
                  <button
                    key={item || 'todos'}
                    type="button"
                    onClick={() => navigateWith({ uf: item || null })}
                    style={{
                      border: '1px solid var(--line-strong)',
                      background: uf === item ? 'var(--ink)' : 'transparent',
                      color: uf === item ? 'var(--bg)' : 'var(--ink-2)',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item || 'Todos'}
                  </button>
                ))}
                <button type="button" style={{ border: 'none', background: 'transparent', color: 'var(--brand-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + mais
                </button>
              </div>

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>PARTIDO:</span>
                {['', 'PL', 'PT', 'UNIÃO', 'PP', 'PSD'].map((item) => (
                  <button
                    key={item || 'todos'}
                    type="button"
                    onClick={() => navigateWith({ partido: item || null })}
                    style={{
                      border: '1px solid var(--line-strong)',
                      background: partido === item ? 'var(--ink)' : 'transparent',
                      color: partido === item ? 'var(--bg)' : 'var(--ink-2)',
                      padding: '6px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {item || 'Todos'}
                  </button>
                ))}
                <button type="button" style={{ border: 'none', background: 'transparent', color: 'var(--brand-2)', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  + mais
                </button>
              </div>
            </div>
          </form>
        </div>
      </section>

      <section style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.06em', color: 'var(--ink-3)' }}>
            {total} RESULTADOS · FILTROS: cargo:{filterLabel(cargo)} · uf:{filterLabel(uf)} · partido:{filterLabel(partido)} · EXECUTADO EM {elapsedMs}ms
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {orderButtons.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateWith({ ordem: id })}
                style={{
                  border: '1px solid var(--line-strong)',
                  background: ordem === id ? 'var(--ink)' : 'transparent',
                  color: ordem === id ? 'var(--bg)' : 'var(--ink-2)',
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.04em',
                  cursor: 'pointer',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 24px 24px' }}>
        <div style={{ border: '1px solid var(--line)', background: 'var(--panel)', borderRadius: 0, overflow: 'hidden' }}>
          <div className="busca-table-header" style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', padding: '10px 12px' }}>
            <div
              className="mono"
              style={{
                display: 'grid',
                gridTemplateColumns: isApp
                  ? '60px 1.4fr 0.6fr 0.8fr 0.8fr 0.6fr 0.5fr 0.5fr 80px'
                  : '60px 1.4fr 0.6fr 0.8fr 0.8fr 0.6fr 80px',
                gap: 10,
                fontSize: 10,
                letterSpacing: '0.12em',
                color: 'var(--ink-3)',
                fontWeight: 600,
                textTransform: 'uppercase',
                alignItems: 'center',
              }}
            >
              <span>avatar</span>
              <span>político</span>
              <span>cargo</span>
              <span>presença</span>
              <span>gasto/mês</span>
              <span>votações</span>
              {isApp ? <span>LES</span> : null}
              {isApp ? <span>coerência</span> : null}
              <span>ações</span>
            </div>
          </div>

          {loading ? (
            <div className="mono" style={{ padding: 20, fontSize: 12, color: 'var(--ink-3)' }}>
              Carregando resultados...
            </div>
          ) : error ? (
            <div className="mono" style={{ padding: 20, fontSize: 12, color: 'var(--neg)' }}>
              {error}
            </div>
          ) : items.length === 0 ? (
            <div className="mono" style={{ padding: 20, fontSize: 12, color: 'var(--ink-3)' }}>
              Nenhum resultado encontrado para os filtros atuais.
            </div>
          ) : (
            <>
              <div className="busca-table-desktop">
                {items.map((item) => {
                  const nomeExibicao = item.nome_eleitoral || item.nome
                  const avatarBg = makeAvatarColor(nomeExibicao)
                  const presenca = item.presenca_pct_atual
                  const presencaPct = presenca == null ? 0 : Math.max(0, Math.min(100, Math.round(presenca)))

                  return (
                    <div
                      key={item.id}
                      onClick={() => router.push(`/politicos/${item.slug}`)}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: isApp
                          ? '60px 1.4fr 0.6fr 0.8fr 0.8fr 0.6fr 0.5fr 0.5fr 80px'
                          : '60px 1.4fr 0.6fr 0.8fr 0.8fr 0.6fr 80px',
                        gap: 10,
                        alignItems: 'center',
                        padding: '11px 12px',
                        borderBottom: '1px solid var(--line)',
                        cursor: 'pointer',
                      }}
                      className="busca-row"
                    >
                      <div
                        className="mono"
                        style={{
                          width: 44,
                          height: 44,
                          background: avatarBg,
                          color: '#fff',
                          fontSize: 15,
                          fontWeight: 700,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {initials(nomeExibicao)}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {nomeExibicao}
                        </div>
                        <div className="mono" style={{ marginTop: 3, fontSize: 11.5, color: 'var(--brand-2)', display: 'flex', gap: 6 }}>
                          <span>{item.partidos?.sigla ?? '—'}</span>
                          <span style={{ color: 'var(--ink-3)' }}>· {item.uf ?? '—'}</span>
                        </div>
                      </div>

                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-2)' }}>
                        {CARGO_LABEL[item.cargo] ?? item.cargo.replaceAll('_', ' ')}
                      </div>

                      <div>
                        <div className="mono" style={{ fontSize: 12, color: presenceColor(presenca), fontWeight: 700 }}>
                          {presenca == null ? '–' : `${presencaPct}%`}
                        </div>
                        <div style={{ marginTop: 6, height: 3, background: 'var(--bg-2)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${presencaPct}%`, background: presenceColor(presenca) }} />
                        </div>
                      </div>

                      <div className="mono tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                        {formatMoneyPerMonth(item.gasto_total_ano)}
                      </div>

                      <div className="mono tnum" style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>
                        {item.total_votacoes == null ? '–' : item.total_votacoes}
                      </div>

                      {isApp ? (
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          em breve
                        </div>
                      ) : null}

                      {isApp ? (
                        <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                          em breve
                        </div>
                      ) : null}

                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                          }}
                          style={{
                            border: '1px solid var(--line-strong)',
                            background: 'transparent',
                            color: 'var(--ink)',
                            width: 26,
                            height: 26,
                            fontSize: 14,
                            cursor: 'pointer',
                          }}
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            router.push(`/politicos/${item.slug}`)
                          }}
                          style={{
                            border: '1px solid var(--line-strong)',
                            background: 'transparent',
                            color: 'var(--ink)',
                            height: 26,
                            padding: '0 8px',
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Abrir →
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="busca-table-mobile" style={{ padding: 10 }}>
                {items.map((item) => {
                  const nomeExibicao = item.nome_eleitoral || item.nome
                  const avatarBg = makeAvatarColor(nomeExibicao)

                  return (
                    <article
                      key={`m-${item.id}`}
                      onClick={() => router.push(`/politicos/${item.slug}`)}
                      style={{
                        border: '1px solid var(--line)',
                        background: 'var(--panel)',
                        padding: 12,
                        display: 'grid',
                        gap: 8,
                        marginBottom: 10,
                        cursor: 'pointer',
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        <div
                          className="mono"
                          style={{
                            width: 44,
                            height: 44,
                            background: avatarBg,
                            color: '#fff',
                            fontSize: 15,
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {initials(nomeExibicao)}
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{nomeExibicao}</div>
                          <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                            {(item.partidos?.sigla ?? '—') + ' · ' + (item.uf ?? '—')}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>PRESENÇA</div>
                        <div className="mono tnum" style={{ fontSize: 11.5, textAlign: 'right' }}>
                          {item.presenca_pct_atual == null ? '–' : `${Math.round(item.presenca_pct_atual)}%`}
                        </div>
                        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>GASTO/MÊS</div>
                        <div className="mono tnum" style={{ fontSize: 11.5, textAlign: 'right' }}>{formatMoneyPerMonth(item.gasto_total_ano)}</div>
                        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>VOTAÇÕES</div>
                        <div className="mono tnum" style={{ fontSize: 11.5, textAlign: 'right' }}>{item.total_votacoes ?? '–'}</div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/politicos/${item.slug}`)
                        }}
                        style={{
                          border: '1px solid var(--line-strong)',
                          background: 'transparent',
                          color: 'var(--ink)',
                          minHeight: 34,
                          padding: '0 10px',
                          fontSize: 11,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        Abrir →
                      </button>
                    </article>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
            MOSTRANDO {firstItem}–{lastItem} DE {total}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 5)
              .map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => navigateWith({ pagina: String(p) })}
                  style={{
                    border: '1px solid var(--line-strong)',
                    background: p === pagina ? 'var(--ink)' : 'transparent',
                    color: p === pagina ? 'var(--bg)' : 'var(--ink-2)',
                    minWidth: 34,
                    height: 30,
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {p}
                </button>
              ))}
          </div>
        </div>
      </section>

      <style jsx>{`
        .busca-row:hover {
          background: var(--bg-2);
        }

        .busca-table-mobile {
          display: none;
        }

        @media (max-width: 920px) {
          .busca-table-header,
          .busca-table-desktop {
            display: none;
          }

          .busca-table-mobile {
            display: block;
          }
        }
      `}</style>
    </main>
  )
}
