'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

const STORAGE_KEY = 'apoio-banner-dismissed'
const DISMISS_DAYS = 7
const SHOW_DELAY_MS = 4000

export function ApoioBanner() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(false)

  // Não mostrar em /apoio
  const isApoioPage = pathname === '/apoio'

  useEffect(() => {
    if (isApoioPage) return

    // Verificar se foi dispensado recentemente
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const dismissed = Number(stored)
        const daysSince = (Date.now() - dismissed) / (1000 * 60 * 60 * 24)
        if (daysSince < DISMISS_DAYS) return
      }
    } catch { /* localStorage indisponível */ }

    // Mostrar após delay
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isApoioPage])

  function dismiss() {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  if (isApoioPage || !visible) return null

  return (
    <div
      role="banner"
      style={{
        position: 'sticky',
        top: 100,          /* cola logo abaixo do header fixo */
        zIndex: 90,
        width: '100%',
        background: 'linear-gradient(90deg, #1d3a8a 0%, #1e40af 100%)',
        color: '#fff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: '10px 20px',
        boxShadow: '0 4px 16px rgba(29,58,138,0.25)',
        animation: 'slideDown 0.4s ease',
      }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <span style={{ fontSize: 16 }}>❤️</span>

      <span style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>
        Meus Políticos é independente e sem paywall. Ajude a manter a transparência viva.
      </span>

      <Link
        href="/apoio"
        style={{
          background: '#fff',
          color: '#1d3a8a',
          padding: '6px 16px',
          borderRadius: 20,
          fontSize: 13,
          fontWeight: 700,
          textDecoration: 'none',
          flexShrink: 0,
          whiteSpace: 'nowrap',
        }}
      >
        Apoiar →
      </Link>

      {/* Fechar */}
      <button
        onClick={dismiss}
        aria-label="Fechar banner"
        style={{
          position: 'absolute',
          right: 16,
          top: '50%',
          transform: 'translateY(-50%)',
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          fontSize: 18,
          cursor: 'pointer',
          lineHeight: 1,
          padding: '4px 6px',
        }}
      >
        ✕
      </button>
    </div>
  )
}
