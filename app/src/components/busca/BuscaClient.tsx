'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

import type { BuscaResponse } from '@/types/busca'
import { CardPolitico } from '@/components/busca/CardPolitico'
import { track } from '@/lib/analytics'

const UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const selectStyle: React.CSSProperties = {
  height: 44,
  padding: '0 14px',
  background: 'var(--panel)',
  border: '1px solid var(--line-strong)',
  borderRadius: 8,
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '4px 10px',
    borderRadius: 8,
    border: active ? '1px solid var(--brand)' : '1px solid rgba(255, 255, 255, 0.08)',
    background: active ? 'var(--brand-soft)' : 'rgba(255,255,255,0.03)',
    color: active ? 'var(--brand)' : 'var(--ink-2)',
    fontSize: 11.5,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }
}

export function BuscaClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const qParam    = (searchParams.get('q')       ?? '').trim()
  const cargo     = (searchParams.get('cargo')    ?? '').trim()
  const uf        = (searchParams.get('uf')       ?? '').trim().toUpperCase()
  const partido   = (searchParams.get('partido')  ?? '').trim().toUpperCase()
  const ordem     = (searchParams.get('ordem')    ?? 'relevancia').trim()
  const pagina    = Math.max(1, Number.parseInt(searchParams.get('pagina') ?? '1', 10) || 1)

  const [queryInput, setQueryInput] = useState(qParam)
  const [data,    setData]    = useState<BuscaResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState<string | null>(null)

  const navigateWith = useCallback((updates: Record<string, string | null>, options?: { replace?: boolean }) => {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key); else params.set(key, value)
    })
    if (['cargo', 'uf', 'partido', 'q', 'ordem'].some((k) => k in updates)) params.set('pagina', '1')
    const next = params.toString()
    const url = next ? `/busca?${next}` : '/busca'
    if (options?.replace) {
      router.replace(url)
    } else {
      router.push(url)
    }
  }, [router, searchParams])

  useEffect(() => {
    const syncInput = window.setTimeout(() => setQueryInput(qParam), 0)
    return () => window.clearTimeout(syncInput)
  }, [qParam])

  // Debounced search on text input
  useEffect(() => {
    if (queryInput === qParam) return
    const timer = setTimeout(() => {
      navigateWith({ q: queryInput || null }, { replace: true })
    }, 350)
    return () => clearTimeout(timer)
  }, [navigateWith, queryInput, qParam])

  const queryString = useMemo(() => searchParams.toString(), [searchParams])

  useEffect(() => {
    let active = true
    async function run() {
      setLoading(true); setError(null)
      try {
        const res = await fetch(`/api/busca?${queryString}`, { cache: 'no-store' })
        if (!res.ok) throw new Error()
        const json = (await res.json()) as BuscaResponse
        if (!active) return
        setData(json)
        if (qParam || cargo || uf || partido) {
          track('busca', { q: qParam || undefined, cargo: cargo || undefined, uf: uf || undefined, partido: partido || undefined, total: json.total })
        }
      } catch {
        if (!active) return
        setError('Não foi possível carregar os resultados.')
      } finally {
        if (!active) return
        setLoading(false)
      }
    }
    run()
    return () => { active = false }
  }, [cargo, partido, qParam, queryString, uf])

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigateWith({ q: queryInput || null })
  }

  const items          = data?.items ?? []
  const total          = data?.total ?? 0
  const totalPaginas   = data?.totalPaginas ?? 1
  const totalIndexados = data?.totalIndexados ?? 0
  const porPagina      = data?.porPagina ?? 15
  const firstItem      = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const lastItem       = total === 0 ? 0 : Math.min(pagina * porPagina, total)

  const allPartidos = data?.chips.partidos ?? []
  const cargosChips = data?.chips.cargos   ?? []

  // Páginas visíveis na paginação
  const paginaVizinhas = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 5)

  return (
    <div style={{ background: '#090d16', minHeight: '100vh', color: '#CBD5E1', position: 'relative', overflow: 'hidden' }}>
      
      {/* Ambient background glow */}
      <div style={{
        position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: '100vw', height: '600px',
        background: 'radial-gradient(circle at 50% -150px, rgba(139, 92, 246, 0.12) 0%, rgba(9, 13, 22, 0) 70%)',
        pointerEvents: 'none', zIndex: 0
      }} />

      {/* ── Cabeçalho ── */}
      <section style={{ padding: '40px 24px 24px', maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.025em', color: '#F8FAFC' }}>
          Buscar Políticos
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: '#94A3B8', maxWidth: 620, lineHeight: 1.6 }}>
          {totalIndexados > 0
            ? `${totalIndexados.toLocaleString('pt-BR')} representantes indexados — pressença, gastos e votações em dados abertos.`
            : 'Encontre parlamentares, fiscalize gastos e acompanhe votações.'}
        </p>
      </section>

      {/* ── Filtros sticky ── */}
      <section style={{
        position: 'sticky', top: 100, zIndex: 40,
        background: 'rgba(15, 23, 42, 0.75)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '16px 24px',
        boxShadow: '0 4px 30px rgba(0, 0, 0, 0.2)',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2.5 items-center w-full">

            {/* Busca texto */}
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94A3B8" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Nome do parlamentar..."
                className="busca-input transition-all duration-150"
                style={{
                  ...selectStyle,
                  width: '100%', paddingLeft: 42, boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Cargo */}
            <select value={cargo} onChange={(e) => navigateWith({ cargo: e.target.value || null })} className="busca-input transition-all duration-150" style={selectStyle}>
              <option value="">Cargo: Todos</option>
              {cargosChips.length > 0
                ? cargosChips.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}{c.total != null ? ` (${c.total})` : ''}</option>
                ))
                : [['deputado_federal','Deputado Federal'],['senador','Senador']].map(([id, label]) => (
                  <option key={id} value={id}>{label}</option>
                ))
              }
            </select>

            {/* UF */}
            <select value={uf} onChange={(e) => navigateWith({ uf: e.target.value || null })} className="busca-input transition-all duration-150" style={selectStyle}>
              <option value="">UF: Brasil</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>

            {/* Partido */}
            <select value={partido} onChange={(e) => navigateWith({ partido: e.target.value || null })} className="busca-input transition-all duration-150" style={selectStyle}>
              <option value="">Partido: Todos</option>
              {allPartidos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Ordenação */}
            <select value={ordem} onChange={(e) => navigateWith({ ordem: e.target.value })} className="busca-input transition-all duration-150" style={selectStyle}>
              <option value="relevancia">Relevância</option>
              <option value="presenca">Presença</option>
              <option value="gastos">Maior gasto</option>
              <option value="votacoes">Votações</option>
            </select>

          </form>

          {/* Chips de Filtro Rápido */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="mono" style={{ color: 'var(--ink-3)', fontSize: 9.5, letterSpacing: '0.08em', fontWeight: 600 }}>FILTRAR POR:</span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
              <button type="button" onClick={() => navigateWith({ cargo: cargo === 'deputado_federal' ? null : 'deputado_federal' })} style={chipStyle(cargo === 'deputado_federal')}>
                Federal
              </button>
              <button type="button" onClick={() => navigateWith({ cargo: cargo === 'senador' ? null : 'senador' })} style={chipStyle(cargo === 'senador')}>
                Senador
              </button>
              
              <span style={{ color: 'rgba(255,255,255,0.08)', margin: '0 4px' }}>|</span>
              
              {['SP', 'RJ', 'MG', 'BA', 'PE'].map((u) => (
                <button key={u} type="button" onClick={() => navigateWith({ uf: uf === u ? null : u })} style={chipStyle(uf === u)}>
                  {u}
                </button>
              ))}
              
              <span style={{ color: 'rgba(255,255,255,0.08)', margin: '0 4px' }}>|</span>
              
              {['PL', 'PT', 'PSD', 'MDB', 'UNIÃO'].map((p) => (
                <button key={p} type="button" onClick={() => navigateWith({ partido: partido === p ? null : p })} style={chipStyle(partido === p)}>
                  {p}
                </button>
              ))}

              {(qParam || cargo || uf || partido) && (
                <button
                  type="button"
                  onClick={() => {
                    setQueryInput('')
                    router.push('/busca')
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--neg)',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                    padding: '4px 8px',
                    marginLeft: 'auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4
                  }}
                  className="hover:underline"
                >
                  ✕ Limpar Filtros
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Resultados ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px', position: 'relative', zIndex: 1 }}>

        {/* Contador */}
        {!loading && (
          <p style={{ margin: '0 0 20px', fontSize: 13, color: '#94A3B8' }}>
            {total === 0 ? 'Nenhum resultado' : `${firstItem}–${lastItem} de ${total.toLocaleString('pt-BR')} resultados`}
          </p>
        )}

        {/* Grid / estados */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: '#1E293B', borderRadius: 16, height: 340, border: '1px solid #334155', opacity: 0.5 }} className="busca-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: 'var(--neg-soft)', border: '1px solid var(--neg)', borderRadius: 12, padding: '20px 24px', color: 'var(--neg)', fontSize: 14 }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: '#1E293B', border: '1px solid #334155', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: '#F8FAFC', margin: '0 0 6px' }}>Nenhum resultado encontrado</p>
            <p style={{ fontSize: 13, color: '#94A3B8', margin: 0 }}>Tente mudar os filtros ou buscar por outro nome.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {items.map((item) => <CardPolitico key={item.id} politico={item} />)}
          </div>
        )}

        {/* ── Paginação ── */}
        {!loading && total > 0 && (
          <div style={{ marginTop: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>

            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => navigateWith({ pagina: String(pagina - 1) })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0 20px', height: 40, borderRadius: 10,
                border: '1px solid var(--line-strong)',
                background: 'var(--panel)', color: 'var(--ink-2)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: pagina <= 1 ? 0.4 : 1,
              }}
            >
              ← Anterior
            </button>

            <div style={{ display: 'flex', gap: 6 }}>
              {paginaVizinhas[0] > 1 && (
                <>
                  <button type="button" onClick={() => navigateWith({ pagina: '1' })} style={pageBtn(1 === pagina)}>1</button>
                  {paginaVizinhas[0] > 2 && <span style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-3)', fontSize: 14 }}>…</span>}
                </>
              )}

              {paginaVizinhas.map((p) => (
                <button key={p} type="button" onClick={() => navigateWith({ pagina: String(p) })} style={pageBtn(p === pagina)}>
                  {p}
                </button>
              ))}

              {paginaVizinhas[paginaVizinhas.length - 1] < totalPaginas && (
                <>
                  {paginaVizinhas[paginaVizinhas.length - 1] < totalPaginas - 1 && (
                    <span style={{ display: 'flex', alignItems: 'center', color: 'var(--ink-3)', fontSize: 14 }}>…</span>
                  )}
                  <button type="button" onClick={() => navigateWith({ pagina: String(totalPaginas) })} style={pageBtn(totalPaginas === pagina)}>{totalPaginas}</button>
                </>
              )}
            </div>

            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => navigateWith({ pagina: String(pagina + 1) })}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '0 20px', height: 40, borderRadius: 10,
                border: '1px solid var(--line-strong)',
                background: 'var(--panel)', color: 'var(--ink-2)',
                fontSize: 14, fontWeight: 600, cursor: 'pointer',
                opacity: pagina >= totalPaginas ? 0.4 : 1,
              }}
            >
              Próxima →
            </button>

          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes busca-pulse { 0%,100%{opacity:.5} 50%{opacity:.3} }
        .busca-skeleton { animation: busca-pulse 1.5s ease-in-out infinite; }
        .busca-input { transition: all 0.15s ease-in-out; }
        .busca-input:hover { border-color: rgba(255, 255, 255, 0.25) !important; }
        .busca-input:focus { border-color: var(--brand) !important; box-shadow: 0 0 0 3px var(--brand-soft) !important; }
      ` }} />
    </div>
  )
}

function pageBtn(active: boolean): React.CSSProperties {
  return {
    width: 40, height: 40,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
    border: active ? '1px solid var(--brand)' : '1px solid var(--line)',
    background: active ? 'var(--brand)' : 'var(--panel)',
    color: active ? '#ffffff' : 'var(--ink-2)',
    fontSize: 14, fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  }
}
