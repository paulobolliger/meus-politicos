'use client'

import { useState, useEffect } from 'react'

const ANCHORS = [
  { id: 'visao-geral',  label: 'Visão Geral' },
  { id: 'legislativa',  label: 'Assembleia Legislativa' },
  { id: 'economia',     label: 'Economia' },
  { id: 'timeline',     label: 'Timeline' },
]

export function EstadoAnchorNav({ cor }: { cor: string }) {
  const [active, setActive] = useState('visao-geral')

  useEffect(() => {
    const onScroll = () => {
      let cur = 'visao-geral'
      for (const a of ANCHORS) {
        const el = document.getElementById(a.id)
        if (el && window.scrollY >= el.offsetTop - 140) cur = a.id
      }
      setActive(cur)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  function goTo(id: string) {
    const el = document.getElementById(id)
    if (!el) return
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 120, behavior: 'smooth' })
  }

  return (
    <nav style={{
      position: 'sticky', top: 64, zIndex: 40,
      background: '#1E293B', borderBottom: '1px solid #334155',
      width: '100%', maxWidth: '100%', overflow: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: 1280, margin: '0 auto', padding: '0 clamp(16px, 4vw, 32px)',
        display: 'flex', gap: 32, overflowX: 'auto',
        boxSizing: 'border-box',
        scrollbarWidth: 'none', msOverflowStyle: 'none' as never,
      }}>
        {ANCHORS.map(a => (
          <button key={a.id} onClick={() => goTo(a.id)} style={{
            height: 56, padding: '0 4px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 14, fontWeight: active === a.id ? 700 : 400,
            color: active === a.id ? cor : '#94A3B8',
            borderBottom: active === a.id ? `2px solid ${cor}` : '2px solid transparent',
            whiteSpace: 'nowrap', transition: 'all 0.15s',
            fontFamily: 'var(--font-sans)',
          }}>
            {a.label}
          </button>
        ))}
      </div>
    </nav>
  )
}
