import Link from 'next/link'

export function AppFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--bg-2)',
        padding: '16px 0',
      }}
    >
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
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', letterSpacing: '0.06em' }}>
          MEUS POLITICOS · APP · MIT {process.env.NEXT_PUBLIC_APP_VERSION ? `· ${process.env.NEXT_PUBLIC_APP_VERSION}` : ''}
        </span>
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          <Link href="/metodologia" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>
            Metodologia
          </Link>
          <Link href="/fontes" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>
            Fontes
          </Link>
          <a href="/" style={{ fontSize: 12, color: 'var(--brand-2)', textDecoration: 'none' }}>
            &larr; Voltar ao site
          </a>
        </div>
      </div>
    </footer>
  )
}
