'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

export function CookieBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const showBanner = window.setTimeout(() => {
      const accepted = localStorage.getItem('mp-cookies-accepted')
      if (!accepted) setVisible(true)
    }, 0)
    return () => window.clearTimeout(showBanner)
  }, [])

  function accept() {
    localStorage.setItem('mp-cookies-accepted', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 200,
          padding: '16px 24px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            maxWidth: 900,
            width: '100%',
            background: 'rgba(30, 41, 59, 0.95)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            boxShadow: '0 12px 40px rgba(0,0,0,0.35)',
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
            pointerEvents: 'auto',
            animation: 'cookieSlideUp 0.4s ease-out',
          }}
        >
          <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.55, flex: 1, margin: 0, minWidth: 220 }}>
            Utilizamos cookies para melhorar sua experiência, conforme nossa{' '}
            <Link href="/privacidade" style={{ color: 'var(--brand)', fontWeight: 600 }}>
              Política de Privacidade
            </Link>
            .
          </p>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link
              href="/privacidade"
              style={{
                height: 40,
                padding: '0 18px',
                borderRadius: 8,
                border: '1px solid var(--line-strong)',
                display: 'inline-flex',
                alignItems: 'center',
                fontSize: 13,
                fontWeight: 600,
                color: 'var(--ink-2)',
                textDecoration: 'none',
              }}
            >
              Configurar
            </Link>
            <button
              onClick={accept}
              style={{
                height: 40,
                padding: '0 24px',
                borderRadius: 8,
                background: 'var(--brand)',
                border: 'none',
                cursor: 'pointer',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              Aceitar
            </button>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes cookieSlideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  )
}
