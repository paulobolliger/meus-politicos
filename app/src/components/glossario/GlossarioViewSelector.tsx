'use client'

import { useState } from 'react'
import Link from 'next/link'

type TermoRow = {
  slug: string
  termo: string
  definicao_simples: string
  categoria: string
}

type Props = {
  porLetra: Record<string, TermoRow[]>
  letras: string[]
}

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  legislativo:   { label: 'Legislativo',   color: '#818cf8', bg: 'rgba(99, 102, 241, 0.12)' }, // indigo
  eleitoral:     { label: 'Eleitoral',     color: '#34d399', bg: 'rgba(16, 185, 129, 0.12)' }, // emerald
  financeiro:    { label: 'Financeiro',    color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.12)' }, // amber
  institucional: { label: 'Institucional', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.12)' }, // rose
}

export function GlossarioViewSelector({ porLetra, letras }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  return (
    <div className="space-y-6">
      {/* Visualização Toggle Bar */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3.5 mb-6">
        <span className="text-[10px] text-slate-500 font-mono font-bold tracking-wider uppercase">
          Layout de Exibição
        </span>

        {/* Toggle buttons */}
        <div className="flex bg-slate-950/80 rounded-lg p-1 border border-slate-800">
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all duration-200 font-sans ${
              viewMode === 'grid'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 bg-transparent border border-transparent'
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
            </svg>
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[10px] font-bold cursor-pointer transition-all duration-200 font-sans ${
              viewMode === 'list'
                ? 'bg-slate-900 text-white border border-slate-800'
                : 'text-slate-400 hover:text-slate-200 bg-transparent border border-transparent'
            }`}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
            </svg>
            Lista Detalhes
          </button>
        </div>
      </div>

      {/* Grid or List views */}
      <div className="flex flex-col gap-12">
        {letras.map((letra) => (
          <div key={letra} id={`letra-${letra}`} className="border-t border-slate-800/80 pt-8">
            {/* Letra header */}
            <h2 className="text-4xl font-black text-indigo-500/70 mb-6 font-mono">
              {letra}
            </h2>

            {viewMode === 'grid' ? (
              /* Grid 3 colunas */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(porLetra[letra] || []).map((t) => {
                  const cat = CATS[t.categoria]
                  return (
                    <Link
                      key={t.slug}
                      href={`/glossario/${t.slug}`}
                      className="group flex flex-col justify-between p-5 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-indigo-500/5"
                    >
                      <div>
                        {/* Dot + Termo + Category Badge */}
                        <div className="flex flex-wrap items-center gap-2 mb-3">
                          <span
                            className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                            style={{ background: cat?.color ?? '#64748b' }}
                          />
                          <h3 className="text-slate-200 font-bold group-hover:text-indigo-400 transition-colors text-[15px] leading-tight">
                            {t.termo}
                          </h3>
                          {cat && (
                            <span
                              className="text-[9px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border"
                              style={{ color: cat.color, background: cat.bg, borderColor: `${cat.color}15` }}
                            >
                              {cat.label}
                            </span>
                          )}
                        </div>

                        {/* Descrição curta */}
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-2 mb-4">
                          {t.definicao_simples}
                        </p>
                      </div>

                      {/* Ver detalhes link */}
                      <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                        Ver detalhes completos
                        <span className="transition-transform duration-200 group-hover:translate-x-1">→</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              /* Lista de Detalhes Horizontal */
              <div className="flex flex-col gap-3">
                {(porLetra[letra] || []).map((t) => {
                  const cat = CATS[t.categoria]
                  return (
                    <Link
                      key={t.slug}
                      href={`/glossario/${t.slug}`}
                      className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 hover:border-indigo-500/30 rounded-xl transition-all duration-300 hover:shadow-md hover:shadow-indigo-500/2"
                    >
                      {/* Left: Dot + Termo + Category Badge */}
                      <div className="flex flex-wrap items-center gap-2.5 sm:w-1/4 min-w-[200px]">
                        <span
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: cat?.color ?? '#64748b' }}
                        />
                        <h3 className="text-slate-200 font-bold group-hover:text-indigo-400 transition-colors text-[14px] leading-tight">
                          {t.termo}
                        </h3>
                        {cat && (
                          <span
                            className="text-[9px] font-bold font-mono tracking-wider uppercase px-2 py-0.5 rounded-full border"
                            style={{ color: cat.color, background: cat.bg, borderColor: `${cat.color}15` }}
                          >
                            {cat.label}
                          </span>
                        )}
                      </div>

                      {/* Middle: Full definition */}
                      <div className="flex-1 text-xs text-slate-400 leading-relaxed pr-2">
                        {t.definicao_simples}
                      </div>

                      {/* Right: details link */}
                      <div className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition-colors flex-shrink-0">
                        Ver verbete
                        <span className="transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
