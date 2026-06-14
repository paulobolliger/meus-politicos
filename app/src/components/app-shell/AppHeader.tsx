import Link from 'next/link'
import Image from 'next/image'
import { SystemBar } from '@/components/civic'

export function AppHeader() {
  return (
    <>
      <SystemBar />
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            height: 68,
            gap: 32,
          }}
        >
          <Link href="/">
            <Image
              src="/logos_meus-politicos_colorido_semfundo.png"
              alt="Meus Politicos"
              height={28}
              width={140}
              priority
              style={{ width: 'auto', height: 28, objectFit: 'contain' }}
            />
          </Link>
          <nav style={{ display: 'flex', gap: 4, marginLeft: 24 }}>
            {[
              { label: 'Inicio', href: '/' },
              { label: 'Buscar', href: '/busca' },
              { label: 'Estados', href: '/estado' },
              { label: 'Meus politicos', href: '/meus-politicos' },
              { label: 'Metodologia', href: '/metodologia' },
              { label: 'Fontes', href: '/fontes' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  padding: '8px 12px',
                  fontSize: 13.5,
                  fontWeight: 500,
                  color: 'var(--ink-3)',
                  textDecoration: 'none',
                  borderBottom: '2px solid transparent',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: 'var(--ink-3)',
              letterSpacing: '0.04em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: 'var(--pos)',
                display: 'inline-block',
              }}
            />
            513 deputados monitorados
          </span>
          <Link
            href="/"
            style={{
              fontSize: 12,
              color: 'var(--ink-3)',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            &larr; site publico
          </Link>
          <Link
            href="/login"
            style={{
              height: 32,
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'transparent',
              border: '1px solid var(--line-strong)',
              fontSize: 12,
              color: 'var(--ink-2)',
              fontWeight: 500,
              textDecoration: 'none',
            }}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            style={{
              height: 32,
              padding: '0 12px',
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--brand)',
              color: 'white',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </>
  )
}
