'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useTransition, useState, useEffect } from 'react'

type Props = {
  defaultQ?: string
  defaultTipo?: string
}

const TIPOS = ['PL', 'PEC', 'PLP', 'PDL', 'MPV'] as const

export function ProjetosSearchForm({ defaultQ = '', defaultTipo = '' }: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const [q, setQ] = useState(defaultQ)

  const navegar = useCallback((novoQ: string, novoTipo: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('pagina')
    if (novoQ.trim()) params.set('q', novoQ.trim()); else params.delete('q')
    if (novoTipo)     params.set('tipo', novoTipo);  else params.delete('tipo')
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }, [pathname, router, searchParams, startTransition])

  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    if (defaultQ !== currentQ) {
      const syncTimer = setTimeout(() => setQ(defaultQ), 0)
      return () => clearTimeout(syncTimer)
    }
    if (q === currentQ) return

    const timer = setTimeout(() => {
      navegar(q, defaultTipo)
    }, 350)
    return () => clearTimeout(timer)
  }, [defaultQ, defaultTipo, navegar, q, searchParams])

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    navegar(q, defaultTipo)
  }

  function toggleTipo(t: string) {
    navegar(q, defaultTipo === t ? '' : t)
  }

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 32,
    padding: '0 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.05em',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.15s',
    flexShrink: 0,
  }

  return (
    <div style={{
      display: 'flex',
      flexWrap: 'wrap',
      gap: 24,
      alignItems: 'flex-end',
      justifyContent: 'space-between',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        .search-input-container {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .search-input-container:focus-within {
          border-color: var(--brand-2) !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25) !important;
        }
        .chip-btn {
          background: rgba(255, 255, 255, 0.06);
          color: var(--ink-2);
          border: 1px solid var(--line);
        }
        .chip-btn:hover {
          background: rgba(255, 255, 255, 0.12);
          color: var(--ink);
          border-color: var(--line-strong);
        }
        .chip-btn.active {
          background: var(--brand) !important;
          color: white !important;
          border-color: var(--brand) !important;
          box-shadow: 0 0 12px rgba(139, 92, 246, 0.35);
        }
        .clear-filters-btn {
          color: var(--brand);
          transition: color 0.15s;
        }
        .clear-filters-btn:hover {
          color: white;
        }
      ` }} />

      {/* Pesquisar Projetos */}
      <div style={{ flex: '1 1 260px', minWidth: 0, maxWidth: 400 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          Pesquisar Projetos
        </div>
        <form onSubmit={onSubmit}>
          <div
            className="search-input-container"
            style={{
              display: 'flex', alignItems: 'center',
              background: 'rgba(30, 41, 59, 0.7)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              height: 48,
              overflow: 'hidden',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
            }}
          >
            <div style={{ paddingLeft: 14, paddingRight: 8, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              type="text"
              placeholder="Ex: Reforma tributária, Educação..."
              autoComplete="off"
              style={{
                flex: 1, border: 'none', outline: 'none',
                background: 'transparent', height: '100%',
                fontSize: 14, color: 'var(--ink)',
                fontFamily: 'var(--font-sans)',
              }}
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                style={{
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  padding: '0 12px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  color: 'var(--ink-3)',
                }}
                className="hover:text-white transition-colors"
                aria-label="Limpar pesquisa"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
            {/* Submit invisível para Enter funcionar */}
            <button type="submit" style={{ display: 'none' }} />
          </div>
        </form>
      </div>

      {/* Filtrar por Tipo */}
      <div style={{ flex: '0 1 auto' }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <span>Filtrar por Tipo</span>
          {(defaultQ || defaultTipo) && (
            <button
              type="button"
              onClick={() => {
                setQ('')
                navegar('', '')
              }}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: 10,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                padding: '0 2px',
              }}
              className="clear-filters-btn"
            >
              Limpar Filtros
            </button>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            type="button"
            onClick={() => toggleTipo('')}
            className={`chip-btn ${!defaultTipo ? 'active' : ''}`}
            style={chipBase}
          >
            TODOS
          </button>
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTipo(t)}
              className={`chip-btn ${defaultTipo === t ? 'active' : ''}`}
              style={chipBase}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
