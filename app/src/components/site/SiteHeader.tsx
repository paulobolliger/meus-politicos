'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        zIndex: 100,
        borderBottom: '1px solid rgba(195,198,214,0.3)',
        transition: 'box-shadow 0.2s ease',
        boxShadow: scrolled ? '0 4px 20px -2px rgba(0,0,0,0.08)' : 'none',
      }}
    >
      {/* Faixa superior — status + aviso */}
      <div style={{ background: '#0a0e1a', color: 'white', fontSize: 12, padding: '7px 0' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: '#4ade80', display: 'inline-block', flexShrink: 0, animation: 'pulse 2s infinite' }} />
            <span className="mono" style={{ fontSize: 10, color: '#4ade80', letterSpacing: '0.1em', fontWeight: 600 }}>
              SISTEMA ONLINE
            </span>
            <span style={{ opacity: 0.5, margin: '0 6px' }}>·</span>
            <span style={{ opacity: 0.8 }}>
              Você está no <strong>site público</strong>. Para análise profunda,{' '}
              <a href="https://app.meuspoliticos.com.br" style={{ color: '#7dd3fc' }}>
                acesse app.meuspoliticos.com.br →
              </a>
            </span>
          </span>
          <span className="mono" style={{ fontSize: 10, opacity: 0.45, letterSpacing: '0.1em' }}>
            DADOS PÚBLICOS · FONTES OFICIAIS
          </span>
        </div>
      </div>

      {/* Nav principal com glass blur */}
      <div
        style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            height: 68,
            gap: 40,
          }}
        >
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>
            <Image
              src="/logos_meus-politicos_colorido_semfundo.png"
              alt="Meus Políticos"
              height={32}
              width={160}
              style={{ objectFit: 'contain' }}
            />
          </Link>

          <nav style={{ display: 'flex', gap: 24, flex: 1 }}>
            {[
              { label: 'Buscar', href: '/busca' },
              { label: 'Meu Estado', href: '/meu-estado' },
              { label: 'Projetos', href: '/projetos' },
              { label: 'Glossário', href: '/glossario' },
              { label: 'Estados', href: '/estado' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)', textDecoration: 'none', whiteSpace: 'nowrap' }}
              >
                {l.label}
              </Link>
            ))}
            <Link
              href="/candidatos-2026"
              style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink-3)', textDecoration: 'none', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              Candidatos 2026
              <span style={{
                padding: '2px 6px',
                borderRadius: 999,
                background: 'rgba(217,119,6,0.1)',
                color: 'var(--accent-gold)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}>
                Novo
              </span>
            </Link>
          </nav>

          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link
              href="/login"
              style={{
                padding: '0 18px',
                height: 38,
                display: 'inline-flex',
                alignItems: 'center',
                border: '1px solid var(--line-strong)',
                color: 'var(--ink-2)',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: 6,
              }}
            >
              Entrar
            </Link>
            <a
              href="https://app.meuspoliticos.com.br"
              style={{
                padding: '0 18px',
                height: 38,
                display: 'inline-flex',
                alignItems: 'center',
                background: 'var(--ink)',
                color: 'white',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                borderRadius: 6,
                whiteSpace: 'nowrap',
              }}
            >
              App →
            </a>
          </div>
        </div>
      </div>
    </header>
  )
}
