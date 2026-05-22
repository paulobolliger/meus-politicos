'use client'

import { useRef } from 'react'

type Props = {
  titulo: string
  icon: React.ReactNode
  badge: string
  children: React.ReactNode
}

export function CarrosselSecao({ titulo, icon, badge, children }: Props) {
  const trackRef = useRef<HTMLDivElement>(null)

  function scrollBy(dir: 'left' | 'right') {
    const el = trackRef.current
    if (!el) return
    // scroll uma "página" (largura visível do container)
    el.scrollBy({ left: dir === 'right' ? el.offsetWidth : -el.offsetWidth, behavior: 'smooth' })
  }

  const btnStyle: React.CSSProperties = {
    width: 32, height: 32,
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%',
    border: '1px solid var(--line-strong)',
    background: 'var(--panel)',
    color: 'var(--ink-2)',
    cursor: 'pointer',
    fontSize: 16,
    lineHeight: 1,
    flexShrink: 0,
  }

  return (
    <div>
      {/* Header com setas */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--line)', paddingBottom: 14, marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {icon}
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.015em', color: 'var(--ink)' }}>
            {titulo}
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" onClick={() => scrollBy('left')} style={btnStyle} aria-label="Anterior">
            ‹
          </button>
          <button type="button" onClick={() => scrollBy('right')} style={btnStyle} aria-label="Próximo">
            ›
          </button>
          <span style={{
            background: 'var(--bg-2)', color: 'var(--ink-3)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.07em',
            padding: '4px 12px', borderRadius: 4,
            fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          }}>
            {badge}
          </span>
        </div>
      </div>

      {/* Track horizontal */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: 20,
          overflowX: 'auto',
          scrollSnapType: 'x mandatory',
          scrollbarWidth: 'none',        // Firefox
          msOverflowStyle: 'none',       // IE/Edge
          paddingBottom: 4,              // evita clip de box-shadow
        }}
      >
        {children}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .carousel-track::-webkit-scrollbar { display: none; }
      `}} />
    </div>
  )
}
