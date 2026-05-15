import Link from 'next/link'
import type { ReactNode } from 'react'

type AuthShellProps = {
  leftLabel: string
  leftHeadline: string
  leftSub: string
  children: ReactNode
}

export function AuthShell({ leftLabel, leftHeadline, leftSub, children }: AuthShellProps) {
  return (
    <div className="lg:grid lg:grid-cols-2" style={{ minHeight: '100vh' }}>
      {/* Coluna esquerda — desktop only */}
      <div
        className="hidden lg:flex"
        style={{
          background: 'var(--ink)',
          padding: '60px 48px',
          flexDirection: 'column',
          justifyContent: 'space-between',
          minHeight: '100vh',
        }}
      >
        <Link href="/">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logos_meus-politicos_branco_semfundo.png"
            alt="Meus Políticos"
            style={{ height: 32, width: 'auto' }}
          />
        </Link>

        <div>
          <div className="label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>
            {leftLabel}
          </div>
          <h1
            style={{
              fontSize: 40,
              fontWeight: 700,
              color: 'white',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
            }}
          >
            {leftHeadline}
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            {leftSub}
          </p>
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          MEUS POLÍTICOS · NORO GURU · MIT
        </div>
      </div>

      {/* Coluna direita — formulário */}
      <div
        style={{
          background: 'var(--bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 24px',
          minHeight: '100vh',
        }}
      >
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo mobile */}
          <div className="lg:hidden" style={{ marginBottom: 32 }}>
            <Link href="/">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logos_meus-politicos_colorido_semfundo.png"
                alt="Meus Políticos"
                style={{ height: 28, width: 'auto' }}
              />
            </Link>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

