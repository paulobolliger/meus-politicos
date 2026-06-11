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
    <div className="theme-dark auth-shell" style={{ minHeight: '100vh', background: 'var(--bg)', display: 'grid' }}>
      {/* Coluna esquerda — desktop only */}
      <div className="auth-col-left" style={{
        background: 'radial-gradient(circle at 0% 0%, #1e1b4b 0%, #0f172a 100%)',
        padding: '60px 48px',
        flexDirection: 'column',
        justifyContent: 'space-between',
        minHeight: '100vh',
        boxShadow: 'inset -1px 0 0 rgba(255, 255, 255, 0.05)',
      }}>
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
          <h1 style={{ fontSize: 40, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
            {leftHeadline}
          </h1>
          <p style={{ marginTop: 16, fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
            {leftSub}
          </p>
        </div>

        <div className="mono" style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
          © 2026 Meus Políticos
        </div>
      </div>

      {/* Coluna direita — formulário */}
      <div style={{
        background: 'var(--bg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 24px',
        minHeight: '100vh',
      }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          {/* Logo mobile — só aparece quando a coluna esquerda está oculta */}
          <div className="auth-logo-mobile" style={{ marginBottom: 32 }}>
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

      <style>{`
        /* Mobile: coluna única, logo colorido visível */
        .auth-col-left   { display: none; }
        .auth-logo-mobile { display: block; }

        /* Desktop (≥ 1024px): duas colunas, logo branco visível */
        @media (min-width: 1024px) {
          .auth-shell       { grid-template-columns: 1fr 1fr; }
          .auth-col-left    { display: flex; }
          .auth-logo-mobile { display: none; }
        }
      `}</style>
    </div>
  )
}
