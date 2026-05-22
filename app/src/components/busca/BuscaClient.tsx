'use client'

import { useEffect, useMemo, useState } from 'react'
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
  borderRadius: 10,
  fontSize: 14,
  color: 'var(--ink)',
  outline: 'none',
  cursor: 'pointer',
  fontFamily: 'var(--font-sans)',
  whiteSpace: 'nowrap',
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

  useEffect(() => { setQueryInput(qParam) }, [qParam])

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
  }, [queryString])

  function navigateWith(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    Object.entries(updates).forEach(([key, value]) => {
      if (!value) params.delete(key); else params.set(key, value)
    })
    if (['cargo', 'uf', 'partido', 'q', 'ordem'].some((k) => k in updates)) params.set('pagina', '1')
    const next = params.toString()
    router.push(next ? `/busca?${next}` : '/busca')
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    navigateWith({ q: queryInput || null })
  }

  const items          = data?.items ?? []
  const total          = data?.total ?? 0
  const totalPaginas   = data?.totalPaginas ?? 1
  const totalIndexados = data?.totalIndexados ?? 0
  const porPagina      = data?.porPagina ?? 20
  const firstItem      = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const lastItem       = total === 0 ? 0 : Math.min(pagina * porPagina, total)

  const allPartidos = data?.chips.partidos ?? []
  const cargosChips = data?.chips.cargos   ?? []

  // Páginas visíveis na paginação
  const paginaVizinhas = Array.from({ length: totalPaginas }, (_, i) => i + 1)
    .slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 5)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>

      {/* ── Cabeçalho ── */}
      <section style={{ padding: '40px 24px 24px', maxWidth: 1280, margin: '0 auto' }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          Buscar Políticos
        </h1>
        <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3)', maxWidth: 620, lineHeight: 1.6 }}>
          {totalIndexados > 0
            ? `${totalIndexados.toLocaleString('pt-BR')} representantes indexados — pressença, gastos e votações em dados abertos.`
            : 'Encontre parlamentares, fiscalize gastos e acompanhe votações.'}
        </p>
      </section>

      {/* ── Filtros sticky ── */}
      <section style={{
        position: 'sticky', top: 100, zIndex: 40,
        background: 'rgba(244,245,240,0.88)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--line)',
        padding: '14px 24px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '2fr repeat(3, 1fr) 1fr', gap: 10, alignItems: 'center' }}>

            {/* Busca texto */}
            <div style={{ position: 'relative' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                placeholder="Nome do parlamentar..."
                style={{
                  ...selectStyle,
                  width: '100%', paddingLeft: 42, boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Cargo */}
            <select value={cargo} onChange={(e) => navigateWith({ cargo: e.target.value || null })} style={selectStyle}>
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
            <select value={uf} onChange={(e) => navigateWith({ uf: e.target.value || null })} style={selectStyle}>
              <option value="">UF: Brasil</option>
              {UFS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>

            {/* Partido */}
            <select value={partido} onChange={(e) => navigateWith({ partido: e.target.value || null })} style={selectStyle}>
              <option value="">Partido: Todos</option>
              {allPartidos.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>

            {/* Ordenação */}
            <select value={ordem} onChange={(e) => navigateWith({ ordem: e.target.value })} style={selectStyle}>
              <option value="relevancia">Relevância</option>
              <option value="presenca">Presença</option>
              <option value="gastos">Maior gasto</option>
              <option value="votacoes">Votações</option>
            </select>

          </form>
        </div>
      </section>

      {/* ── Resultados ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 24px 60px' }}>

        {/* Contador */}
        {!loading && (
          <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)' }}>
            {total === 0 ? 'Nenhum resultado' : `${firstItem}–${lastItem} de ${total.toLocaleString('pt-BR')} resultados`}
          </p>
        )}

        {/* Grid / estados */}
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 20 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ background: 'var(--panel)', borderRadius: 16, height: 340, border: '1px solid var(--line)', opacity: 0.5 }} className="busca-skeleton" />
            ))}
          </div>
        ) : error ? (
          <div style={{ background: 'var(--neg-soft)', border: '1px solid var(--neg)', borderRadius: 12, padding: '20px 24px', color: 'var(--neg)', fontSize: 14 }}>
            {error}
          </div>
        ) : items.length === 0 ? (
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
            <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink-2)', margin: '0 0 6px' }}>Nenhum resultado encontrado</p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0 }}>Tente mudar os filtros ou buscar por outro nome.</p>
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
      ` }} />
    </div>
  )
}

function pageBtn(active: boolean): React.CSSProperties {
  return {
    width: 40, height: 40,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8,
    border: active ? 'none' : '1px solid var(--line)',
    background: active ? 'var(--ink)' : 'var(--panel)',
    color: active ? 'white' : 'var(--ink-2)',
    fontSize: 14, fontWeight: active ? 700 : 500,
    cursor: 'pointer',
  }
}
