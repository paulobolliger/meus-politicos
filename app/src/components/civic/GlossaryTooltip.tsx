'use client'

import { useState, useEffect } from 'react'

interface GlossaryTooltipProps {
  term: string
  children: React.ReactNode
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const [active, setActive] = useState(false)
  const [definition, setDefinition] = useState<{ termo: string; definicao_simples: string } | null>(null)
  const [loading, setLoading] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  const slug = term.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  useEffect(() => {
    fetch('/api/flags')
      .then((res) => res.json())
      .then((data) => setFlags(data))
      .catch(() => {})
  }, [])

  const isEnabled = flags['glossario_tooltips'] === true

  function loadDefinition() {
    if (!isEnabled || definition || loading) return
    setLoading(true)
    void fetch(`/api/glossario/${slug}`)
      .then((res) => {
        if (!res.ok) throw new Error()
        return res.json()
      })
      .then((data) => {
        setDefinition(data)
      })
      .catch(() => {
        // Fallback
      })
      .finally(() => {
        setLoading(false)
      })
  }

  if (!isEnabled) {
    return <>{children}</>
  }

  return (
    <span
      onMouseEnter={() => {
        setActive(true)
        loadDefinition()
      }}
      onMouseLeave={() => setActive(false)}
      onClick={() => {
        window.location.href = `/glossario/${slug}`
      }}
      style={{
        position: 'relative',
        display: 'inline-block',
        borderBottom: '1px dotted var(--brand-2)',
        cursor: 'help',
      }}
    >
      {children}

      {active && (definition || loading) && (
        <span
          style={{
            position: 'absolute',
            bottom: '125%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            background: 'rgba(30, 41, 59, 0.95)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            padding: '12px 14px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.35)',
            zIndex: 9999,
            pointerEvents: 'none',
            backdropFilter: 'blur(8px)',
            color: 'var(--ink)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            textAlign: 'left',
          }}
        >
          {loading ? (
            <span style={{ fontSize: 11, color: 'var(--mute)' }}>Buscando termo no glossário...</span>
          ) : (
            <>
              <strong style={{ fontSize: 13, color: 'var(--brand-2)' }}>{definition?.termo}</strong>
              <span style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4 }}>
                {definition?.definicao_simples}
              </span>
              <span style={{ fontSize: 10, color: 'var(--mute)', textAlign: 'right', marginTop: 2 }}>
                Clique para ver definição completa →
              </span>
            </>
          )}
        </span>
      )}
    </span>
  )
}
