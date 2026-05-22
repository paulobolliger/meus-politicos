import Link from 'next/link'
import Image from 'next/image'

const COLUNAS = [
  {
    titulo: 'Plataforma',
    links: [
      { label: 'Buscar Políticos', href: '/busca' },
      { label: 'Meu Estado', href: '/meu-estado' },
      { label: 'Projetos de Lei', href: '/projetos' },
      { label: 'Emendas por Cidade', href: '/cidades' },
      { label: 'Candidatos 2026', href: '/candidatos-2026' },
    ],
  },
  {
    titulo: 'Transparência',
    links: [
      { label: 'Metodologia', href: '/metodologia' },
      { label: 'Fontes de Dados', href: '/fontes' },
      { label: 'Manifesto', href: '/manifesto' },
      { label: 'Como funciona', href: '/como-funciona' },
    ],
  },
  {
    titulo: 'Institucional',
    links: [
      { label: 'Sobre Nós', href: '/sobre' },
      { label: 'Privacidade', href: '/privacidade' },
      { label: 'Termos de Uso', href: '/termos' },
      { label: 'Glossário', href: '/glossario' },
    ],
  },
  {
    titulo: 'Acesso',
    links: [
      { label: 'Entrar', href: '/login' },
      { label: 'Criar conta', href: '/cadastro' },
      { label: 'App Analítico →', href: 'https://app.meuspoliticos.com.br' },
      { label: 'Documentação da API', href: '/api-docs' },
    ],
  },
]

export function SiteFooter() {
  return (
    <footer style={{ borderTop: '1px solid var(--line)', background: 'var(--bg-2)', marginTop: 64 }}>

      {/* Corpo principal */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '48px 32px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr', gap: 40 }}>

          {/* Coluna do logo */}
          <div>
            <Link href="/" style={{ display: 'inline-block' }}>
              <Image
                src="/logos_meus-politicos_colorido_semfundo.png"
                alt="Meus Políticos"
                height={28}
                width={140}
                style={{ objectFit: 'contain' }}
              />
            </Link>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.65, marginTop: 16, maxWidth: 260 }}>
              Transparência para decidir melhor. Transformando dados públicos em poder para o cidadão.
            </p>
          </div>

          {/* Colunas de links */}
          {COLUNAS.map((col) => (
            <div key={col.titulo}>
              <div className="label" style={{ marginBottom: 16 }}>{col.titulo}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 11 }}>
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{ fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none', lineHeight: 1.4 }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid var(--line)', padding: '14px 0' }}>
        <div
          style={{
            maxWidth: 1320,
            margin: '0 auto',
            padding: '0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ fontSize: 11.5, color: 'var(--ink-3)' }}>
            © 2026 Meus Políticos · Projeto independente de tecnologia cívica · Sem afiliação partidária
          </span>

          {/* Ícones sociais */}
          <div style={{ display: 'flex', gap: 8 }}>
            {[
              {
                href: 'https://x.com/meuspoliticos',
                title: 'X / Twitter',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                ),
              },
              {
                href: 'mailto:contato@meuspoliticos.com.br',
                title: 'E-mail',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                ),
              },
              {
                href: '/rss.xml',
                title: 'RSS',
                icon: (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 11a9 9 0 0 1 9 9" />
                    <path d="M4 4a16 16 0 0 1 16 16" />
                    <circle cx="5" cy="19" r="1" fill="currentColor" />
                  </svg>
                ),
              },
            ].map((s) => (
              <a
                key={s.href}
                href={s.href}
                title={s.title}
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 6,
                  border: '1px solid var(--line)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--ink-3)',
                  textDecoration: 'none',
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>

          <span className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em' }}>
            meuspoliticos.com.br
          </span>
        </div>
      </div>

      {/* Responsividade */}
      <style>{`
        @media (max-width: 900px) {
          .site-footer-grid { grid-template-columns: 1fr 1fr !important; }
        }
        @media (max-width: 600px) {
          .site-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </footer>
  )
}
