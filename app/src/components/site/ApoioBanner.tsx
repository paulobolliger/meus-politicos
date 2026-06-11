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
      className="apoio-card"
      style={{
        background: 'rgba(30, 41, 59, 0.95)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
        padding: '20px 24px 20px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'auto',
      }}
    >
      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateY(40px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @media (min-width: 640px) {
          @keyframes slideInRight {
            from { opacity: 0; transform: translateX(40px) scale(0.95); }
            to   { opacity: 1; transform: translateX(0) scale(1); }
          }
        }
        .apoio-card {
          position: fixed;
          bottom: 16px;
          right: 16px;
          left: 16px;
          z-index: 80;
          max-width: calc(100% - 32px);
          animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }
        @media (min-width: 640px) {
          .apoio-card {
            left: auto;
            right: 24px;
            bottom: 24px;
            max-width: 360px;
          }
        }
        .apoio-card-action:hover {
          filter: brightness(1.15);
        }
        .apoio-card-btn:hover {
          background: var(--line) !important;
          color: var(--ink) !important;
        }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 18 }}>❤️</span>
        <strong style={{ fontSize: 14, color: 'var(--ink)', fontWeight: 700 }}>Apoie a Transparência</strong>
      </div>

      {/* Texto */}
      <p style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5, margin: 0 }}>
        Meus Políticos é independente, neutro e sem paywall. Ajude a manter o monitoramento cívico livre e acessível para todos.
      </p>

      {/* Botões */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
        <Link
          href="/apoio"
          className="apoio-card-action"
          style={{
            background: 'var(--brand)',
            color: '#ffffff',
            padding: '8px 18px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 700,
            textDecoration: 'none',
            textAlign: 'center',
            flex: 1,
            boxShadow: '0 4px 12px rgba(139,92,246,0.25)',
            transition: 'filter 0.15s ease',
          }}
        >
          Apoiar agora →
        </Link>
        <button
          onClick={dismiss}
          className="apoio-card-btn"
          style={{
            background: 'none',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink-3)',
            padding: '8px 14px',
            borderRadius: 8,
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          Mais tarde
        </button>
      </div>

      {/* Fechar Cruz */}
      <button
        onClick={dismiss}
        aria-label="Fechar aviso"
        style={{
          position: 'absolute',
          right: 12,
          top: 12,
          background: 'none',
          border: 'none',
          color: 'var(--ink-3)',
          fontSize: 16,
          cursor: 'pointer',
          padding: 4,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
