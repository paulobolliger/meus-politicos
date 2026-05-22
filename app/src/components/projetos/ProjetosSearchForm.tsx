'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useRef, useTransition } from 'react'

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
  const inputRef = useRef<HTMLInputElement>(null)

  function navegar(novoQ: string, novoTipo: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('pagina')
    if (novoQ.trim()) params.set('q', novoQ.trim()); else params.delete('q')
    if (novoTipo)     params.set('tipo', novoTipo);  else params.delete('tipo')
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    navegar(inputRef.current?.value ?? defaultQ, defaultTipo)
  }

  function toggleTipo(t: string) {
    navegar(inputRef.current?.value ?? defaultQ, defaultTipo === t ? '' : t)
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
    border: 'none',
    transition: 'background 0.15s, color 0.15s',
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
      {/* Pesquisar Projetos */}
      <div style={{ flex: '1 1 260px', minWidth: 220, maxWidth: 400 }}>
        <div style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase', marginBottom: 6,
        }}>
          Pesquisar Projetos
        </div>
        <form onSubmit={onSubmit}>
          <div style={{
            display: 'flex', alignItems: 'center',
            background: 'white',
            border: '1px solid var(--line-strong)',
            borderRadius: 10,
            height: 48,
            overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ paddingLeft: 14, paddingRight: 8, display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <input
              ref={inputRef}
              defaultValue={defaultQ}
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
        }}>
          Filtrar por Tipo
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          <button
            type="button"
            onClick={() => toggleTipo('')}
            style={{
              ...chipBase,
              background: !defaultTipo ? 'var(--ink)' : '#e5eeff',
              color:      !defaultTipo ? 'white'      : 'var(--ink-2)',
            }}
          >
            TODOS
          </button>
          {TIPOS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggleTipo(t)}
              style={{
                ...chipBase,
                background: defaultTipo === t ? 'var(--ink)' : '#e5eeff',
                color:      defaultTipo === t ? 'white'      : 'var(--ink-2)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
