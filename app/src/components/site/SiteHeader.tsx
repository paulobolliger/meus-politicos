import Link from 'next/link'
import Image from 'next/image'

export function SiteHeader() {
  return (
    <>
      {/* Faixa preta - indicador site publico */}
      <div
        style={{
          background: '#0a0e1a',
          color: 'white',
          fontSize: 12,
          padding: '8px 0',
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
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: 999,
                background: '#4ade80',
                display: 'inline-block',
              }}
            />
            <span style={{ opacity: 0.85 }}>
              Voce esta no <strong>site publico</strong>. Para analise profunda,{' '}
              <a href="https://app.meuspoliticos.com.br" style={{ color: '#7dd3fc', marginLeft: 4 }}>
                acesse app.meuspoliticos.com.br -&gt;
              </a>
            </span>
          </span>
          <span className="mono" style={{ fontSize: 10, opacity: 0.55, letterSpacing: '0.08em' }}>
            DADOS PUBLICOS · FONTES OFICIAIS
          </span>
        </div>
      </div>

      {/* Nav principal */}
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            height: 72,
            gap: 32,
          }}
        >
          <Link href="/">
            <Image
              src="/logos_meus-politicos_colorido_semfundo.png"
              alt="Meus Politicos"
              height={32}
              width={160}
              style={{ height: 32, width: 'auto' }}
            />
          </Link>
          <nav style={{ display: 'flex', gap: 28, marginLeft: 32 }}>
            {[
              { label: 'Pesquisar', href: '/busca' },
              { label: 'Meu estado', href: '/meu-estado' },
              { label: 'Como funciona', href: '/como-funciona' },
              { label: 'Manifesto', href: '/manifesto' },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: 'var(--ink-3)',
                  textDecoration: 'none',
                }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div style={{ flex: 1 }} />
          <Link
            href="/login"
            style={{
              padding: '0 14px',
              height: 38,
              display: 'inline-flex',
              alignItems: 'center',
              background: 'transparent',
              border: '1px solid var(--line-strong)',
              fontSize: 13,
              color: 'var(--ink-2)',
              fontWeight: 500,
              textDecoration: 'none',
              borderRadius: 2,
            }}
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            style={{
              padding: '0 16px',
              height: 38,
              display: 'inline-flex',
              alignItems: 'center',
              background: 'var(--brand)',
              border: 'none',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 2,
            }}
          >
            Criar conta
          </Link>
        </div>
      </div>
    </>
  )
}
