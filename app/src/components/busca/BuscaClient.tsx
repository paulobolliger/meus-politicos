'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import type { BuscaResponse } from '@/types/busca'
import { CardPolitico } from '@/components/busca/CardPolitico'
import { track } from '@/lib/analytics'

const UF_VISIBLE_COUNT = 9
const PARTIDO_VISIBLE_COUNT = 6

export function BuscaClient() {
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
  const [ufExpanded, setUfExpanded] = useState(false)
  const [partidoExpanded, setPartidoExpanded] = useState(false)

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

        // Track search events (fire-and-forget)
        if (qParam || cargo || uf || partido) {
          track('busca', {
            q: qParam || undefined,
            cargo: cargo || undefined,
            uf: uf || undefined,
            partido: partido || undefined,
            total: json.total,
          })
        }
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
  const porPagina = data?.porPagina ?? 20

  const firstItem = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const lastItem = total === 0 ? 0 : Math.min(pagina * porPagina, total)

  const orderButtons = [
    ['relevancia', 'RELEVÂNCIA'],
    ['presenca', 'PRESENÇA'],
    ['gastos', 'GASTOS'],
    ['votacoes', 'VOTAÇÕES'],
  ] as const

  // Dynamic UF list from API chips
  const allUfs = data?.chips.ufs ?? []
  const visibleUfs = ufExpanded ? allUfs : allUfs.slice(0, UF_VISIBLE_COUNT)
  const hiddenUfCount = allUfs.length - UF_VISIBLE_COUNT

  // Dynamic partido list from API chips
  const allPartidos = data?.chips.partidos ?? []
  const visiblePartidos = partidoExpanded ? allPartidos : allPartidos.slice(0, PARTIDO_VISIBLE_COUNT)
  const hiddenPartidoCount = allPartidos.length - PARTIDO_VISIBLE_COUNT

  // Cargo chips from API
  const cargosChips = data?.chips.cargos ?? []

  const chipStyle = (active: boolean): React.CSSProperties => ({
    border: `1px solid ${active ? 'transparent' : '#e2e8f0'}`,
    background: active ? '#1e3a8a' : '#f8fafc',
    color: active ? '#ffffff' : '#475569',
    padding: '5px 14px',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    borderRadius: 20,
    transition: 'all 0.12s ease',
    whiteSpace: 'nowrap' as const,
  })

  const expandBtnStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    color: '#2952cc',
    fontSize: 13,
    fontWeight: 500,
    cursor: 'pointer',
    padding: '5px 4px',
    borderRadius: 20,
  }

  return (
    <div style={{ background: '#f8fafc', minHeight: '100%' }}>
      {/* Search header */}
      <section style={{ background: '#ffffff', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 20px' }}>
          <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16, fontWeight: 500 }}>
            {totalIndexados > 0 ? `${totalIndexados} representantes indexados` : 'Buscando representantes...'}
          </p>

          <form onSubmit={onSubmit} style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                border: '1.5px solid #e2e8f0',
                background: '#f8fafc',
                padding: '0 16px',
                borderRadius: 12,
                minHeight: 52,
                transition: 'border-color 0.15s',
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Nome, partido ou estado..."
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  height: 48,
                  color: '#1e293b',
                  fontSize: 15,
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                border: 'none',
                background: '#1e3a8a',
                color: '#ffffff',
                padding: '0 24px',
                minHeight: 52,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                borderRadius: 12,
                whiteSpace: 'nowrap',
              }}
            >
              Buscar
            </button>
          </form>

          {/* Filters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* CARGO */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginRight: 2, minWidth: 46 }}>Cargo</span>
              <button type="button" onClick={() => navigateWith({ cargo: null })} style={chipStyle(cargo === '')}>
                Todos {totalIndexados > 0 ? `(${totalIndexados})` : ''}
              </button>
              {cargosChips.length > 0
                ? cargosChips.map((c) => (
                  <button key={c.id} type="button" onClick={() => navigateWith({ cargo: c.id })} style={chipStyle(cargo === c.id)}>
                    {c.label}{c.total != null ? ` (${c.total})` : ''}
                  </button>
                ))
                : [['deputado_federal', 'Dep. Federal'], ['senador', 'Senador']].map(([id, label]) => (
                  <button key={id} type="button" onClick={() => navigateWith({ cargo: id })} style={chipStyle(cargo === id)}>
                    {label}
                  </button>
                ))
              }
            </div>

            {/* UF */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginRight: 2, minWidth: 46 }}>UF</span>
              <button type="button" onClick={() => navigateWith({ uf: null })} style={chipStyle(uf === '')}>Todos</button>
              {visibleUfs.map((item) => (
                <button key={item} type="button" onClick={() => navigateWith({ uf: item })} style={chipStyle(uf === item)}>{item}</button>
              ))}
              {!ufExpanded && hiddenUfCount > 0 && (
                <button type="button" style={expandBtnStyle} onClick={() => setUfExpanded(true)}>+ {hiddenUfCount} estados</button>
              )}
              {ufExpanded && (
                <button type="button" style={expandBtnStyle} onClick={() => setUfExpanded(false)}>− menos</button>
              )}
            </div>

            {/* PARTIDO */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', marginRight: 2, minWidth: 46 }}>Partido</span>
              <button type="button" onClick={() => navigateWith({ partido: null })} style={chipStyle(partido === '')}>Todos</button>
              {visiblePartidos.map((item) => (
                <button key={item} type="button" onClick={() => navigateWith({ partido: item })} style={chipStyle(partido === item)}>{item}</button>
              ))}
              {!partidoExpanded && hiddenPartidoCount > 0 && (
                <button type="button" style={expandBtnStyle} onClick={() => setPartidoExpanded(true)}>+ {hiddenPartidoCount} partidos</button>
              )}
              {partidoExpanded && (
                <button type="button" style={expandBtnStyle} onClick={() => setPartidoExpanded(false)}>− menos</button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 40px' }}>
        {/* Results meta + sort */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
          <p style={{ fontSize: 14, color: '#64748b' }}>
            {loading ? 'Buscando...' : `${total} resultado${total !== 1 ? 's' : ''}`}
          </p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {orderButtons.map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => navigateWith({ ordem: id })}
                style={{
                  border: `1px solid ${ordem === id ? 'transparent' : '#e2e8f0'}`,
                  background: ordem === id ? '#1e3a8a' : '#ffffff',
                  color: ordem === id ? '#ffffff' : '#475569',
                  padding: '6px 14px',
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: 'pointer',
                  borderRadius: 20,
                }}
              >
                {label.charAt(0) + label.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#ffffff', borderRadius: 12, height: 160, border: '1px solid #e2e8f0', opacity: 0.5 }} className="busca-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 12, padding: '20px 24px', color: '#be123c', fontSize: 14 }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '40px 24px', textAlign: 'center', color: '#94a3b8' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 4 }}>Nenhum resultado encontrado</p>
            <p style={{ fontSize: 13 }}>Tente mudar os filtros ou buscar por outro nome.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))', gap: 16 }}>
            {items.map((item) => (
              <CardPolitico key={item.id} politico={item} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && total > 0 && (
          <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
            <p style={{ fontSize: 13, color: '#94a3b8' }}>
              Mostrando {firstItem}–{lastItem} de {total}
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {Array.from({ length: totalPaginas }, (_, i) => i + 1)
                .slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 5)
                .map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => navigateWith({ pagina: String(p) })}
                    style={{
                      border: `1px solid ${p === pagina ? 'transparent' : '#e2e8f0'}`,
                      background: p === pagina ? '#1e3a8a' : '#ffffff',
                      color: p === pagina ? '#ffffff' : '#475569',
                      minWidth: 36,
                      height: 36,
                      fontSize: 13,
                      fontWeight: 500,
                      cursor: 'pointer',
                      borderRadius: 8,
                    }}
                  >
                    {p}
                  </button>
                ))}
            </div>
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes busca-pulse { 0%,100%{opacity:.5} 50%{opacity:.3} }
        .busca-skeleton { animation: busca-pulse 1.5s ease-in-out infinite; }
      ` }} />
    </div>
  )
}
