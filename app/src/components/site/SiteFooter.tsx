import Link from 'next/link'
import Image from 'next/image'

export function SiteFooter() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--line)',
        background: 'var(--bg-2)',
        padding: '40px 0 32px',
        marginTop: 64,
      }}
    >
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <Image
              src="/logos_meus-politicos_colorido_semfundo.png"
              alt="Meus Politicos"
              height={28}
              width={140}
              style={{ height: 28, width: 'auto' }}
            />
            <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6, marginTop: 14, maxWidth: 280 }}>
              Plataforma independente de transparencia civica. Dados publicos organizados - sem opiniao, sem ranking,
              sem editorial.
            </p>
            <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', marginTop: 16, letterSpacing: '0.1em' }}>
              MIT - NORO GURU - CAMPINAS/SP
            </div>
          </div>
          {[
            {
              h: 'Plataforma',
              l: [
                { label: 'Buscar politicos', href: '/busca' },
                { label: 'Meu estado', href: '/meu-estado' },
                { label: 'Meus politicos', href: '/meus-politicos' },
              ],
            },
            {
              h: 'Transparencia',
              l: [
                { label: 'Metodologia', href: '/metodologia' },
                { label: 'Fontes oficiais', href: '/fontes' },
                { label: 'Manifesto', href: '/manifesto' },
                { label: 'Como funciona', href: '/como-funciona' },
              ],
            },
            {
              h: 'Institucional',
              l: [
                { label: 'Sobre', href: '/sobre' },
                { label: 'Privacidade', href: '/privacidade' },
                { label: 'Termos', href: '/termos' },
              ],
            },
            {
              h: 'App Analitico',
              l: [
                { label: 'app.meuspoliticos.com.br ->', href: 'https://app.meuspoliticos.com.br' },
                { label: 'Documentacao da API', href: '/api-docs' },
              ],
            },
          ].map((col) => (
            <div key={col.h}>
              <div className="label" style={{ marginBottom: 14 }}>
                {col.h}
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {col.l.map((x) => (
                  <li key={x.href}>
                    <Link href={x.href} style={{ fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none' }}>
                      {x.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 36,
            paddingTop: 20,
            borderTop: '1px solid var(--line)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 11.5,
            color: 'var(--ink-3)',
          }}
        >
          <span>transparencia · dados · cidadania</span>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.06em' }}>
            meuspoliticos.com.br
          </span>
        </div>
      </div>
    </footer>
  )
}
