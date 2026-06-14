'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState, useEffect, useTransition } from 'react'

type Props = {
  defaultQ?: string
  defaultCategoria?: string
  defaultLetra?: string
  letrasDisponiveis: string[]
}

const CATS = {
  legislativo:   { label: 'Legislativo',   color: '#6366f1' }, // indigo
  eleitoral:     { label: 'Eleitoral',     color: '#10b981' }, // emerald
  financeiro:    { label: 'Financeiro',    color: '#f59e0b' }, // amber
  institucional: { label: 'Institucional', color: '#f43f5e' }, // rose
} as const

const TODAS_LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

export function GlossarioFiltros({
  defaultQ = '',
  defaultCategoria = '',
  defaultLetra = '',
  letrasDisponiveis,
}: Props) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [q, setQ] = useState(defaultQ)

  const navegar = useCallback((novoQ: string, novaCat: string, novaLetra: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (novoQ.trim()) params.set('q', novoQ.trim()); else params.delete('q')
    if (novaCat)      params.set('categoria', novaCat); else params.delete('categoria')
    if (novaLetra)    params.set('letra', novaLetra); else params.delete('letra')

    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }, [pathname, router, searchParams])

  useEffect(() => {
    const syncQuery = window.setTimeout(() => setQ(defaultQ), 0)
    return () => window.clearTimeout(syncQuery)
  }, [defaultQ])

  // Debounced search
  useEffect(() => {
    const currentQ = searchParams.get('q') || ''
    if (q === currentQ) return

    const timer = setTimeout(() => {
      navegar(q, defaultCategoria, defaultLetra)
    }, 300)

    return () => clearTimeout(timer)
  }, [defaultCategoria, defaultLetra, navegar, q, searchParams])

  function clearAll() {
    setQ('')
    startTransition(() => router.push(pathname))
  }

  const hasActiveFilters = defaultQ || defaultCategoria || defaultLetra

  return (
    <div className="flex flex-col gap-6 mb-8">
      {/* Estilos específicos locais baseados em utilitários CSS */}
      <style dangerouslySetInnerHTML={{ __html: `
        .glossario-input-container {
          transition: border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .glossario-input-container:focus-within {
          border-color: #6366f1 !important;
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2) !important;
        }
        .glossario-nav-scroll::-webkit-scrollbar {
          display: none;
        }
        .glossario-nav-scroll {
          scrollbar-width: none;
        }
      ` }} />

      {/* Linha da Busca + Botão de Limpar */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <form onSubmit={(e) => { e.preventDefault(); navegar(q, defaultCategoria, defaultLetra) }} className="relative w-full max-w-md">
          <div className="glossario-input-container flex items-center bg-slate-900 border border-slate-800 rounded-xl h-11 overflow-hidden shadow-inner">
            <span className="pl-4 pr-2 text-slate-500 flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </span>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar termo no glossário..."
              className="flex-1 bg-transparent border-0 outline-none h-full text-sm text-slate-200 placeholder-slate-500 font-sans"
            />
            {q && (
              <button
                type="button"
                onClick={() => setQ('')}
                className="px-3 h-full bg-transparent border-0 text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
                aria-label="Limpar termo"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </form>

        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-mono font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-wider bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all duration-200"
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Navegação A-Z */}
      <div className="glossario-nav-scroll flex items-center gap-1 bg-slate-950 border border-slate-900 rounded-xl p-1.5 overflow-x-auto select-none">
        <button
          onClick={() => navegar(q, defaultCategoria, '')}
          className={`flex items-center justify-center min-w-[48px] h-9 rounded-lg font-mono text-[11px] font-bold transition-all duration-200 cursor-pointer ${
            !defaultLetra
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          ALL
        </button>

        {TODAS_LETRAS.map((letra) => {
          const disponivel = letrasDisponiveis.includes(letra)
          const ativa = defaultLetra === letra

          return (
            <button
              key={letra}
              disabled={!disponivel && !ativa}
              onClick={() => navegar(q, defaultCategoria, letra)}
              className={`flex items-center justify-center min-w-[36px] h-9 rounded-lg font-mono text-xs font-bold transition-all duration-200 cursor-pointer ${
                ativa
                  ? 'bg-indigo-600 text-white shadow-md'
                  : disponivel
                  ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-900/60'
                  : 'text-slate-700 cursor-not-allowed opacity-40'
              }`}
            >
              {letra}
            </button>
          )
        })}
      </div>

      {/* Categorias */}
      <div className="flex flex-wrap items-center gap-2.5">
        <span className="text-[10px] font-mono font-extrabold tracking-wider text-slate-500 uppercase mr-1.5">
          Categoria:
        </span>
        
        <button
          onClick={() => navegar(q, '', defaultLetra)}
          className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
            !defaultCategoria
              ? 'bg-slate-200 text-slate-950 border-slate-200 shadow-sm font-bold'
              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
          }`}
        >
          Todos
        </button>

        {Object.entries(CATS).map(([cat, { label, color }]) => {
          const ativa = defaultCategoria === cat
          return (
            <button
              key={cat}
              onClick={() => navegar(q, cat, defaultLetra)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                ativa
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-md font-bold'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              {label}
            </button>
          )
        })}

        {isPending && (
          <span className="text-xs text-slate-500 font-mono italic animate-pulse ml-2 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
            Buscando verbetes...
          </span>
        )}
      </div>
    </div>
  )
}
