import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Eleições | Meus Políticos',
  description: 'Acompanhe candidaturas, propostas de governo, declarações de bens e resultados das eleições no Brasil.',
}

export default function EleicoesPage() {
  const years = [
    {
      ano: 2026,
      tipo: 'Eleições Gerais',
      cargos: 'Presidente, Governadores, Senadores, Deputados Federais e Estaduais',
      status: 'Registros do TSE',
      bg: 'linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%)',
      badge: 'Futura',
      badgeBg: 'var(--brand-soft)',
      badgeColor: 'var(--brand)'
    },
    {
      ano: 2024,
      tipo: 'Eleições Municipais',
      cargos: 'Prefeitos e Vereadores',
      status: 'Histórico',
      bg: 'linear-gradient(135deg, #5b21b6 0%, #0f172a 100%)',
      badge: 'Concluída',
      badgeBg: 'rgba(255, 255, 255, 0.08)',
      badgeColor: 'var(--ink-3)'
    },
    {
      ano: 2022,
      tipo: 'Eleições Gerais',
      cargos: 'Presidente, Governadores, Senadores, Deputados Federais e Estaduais',
      status: 'Histórico',
      bg: 'linear-gradient(135deg, #0369a1 0%, #0f172a 100%)',
      badge: 'Concluída',
      badgeBg: 'rgba(255, 255, 255, 0.08)',
      badgeColor: 'var(--ink-3)'
    }
  ]

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 72px' }}>
      {/* Hero Header */}
      <header style={{ marginBottom: 48, textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          padding: '4px 12px', borderRadius: 999, marginBottom: 18,
          background: 'rgba(41,82,204,0.15)', border: '1px solid rgba(107,140,255,0.25)',
        }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--brand)' }}>
            CENTRAL ELEITORAL
          </span>
        </div>
        <h1 style={{
          fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 800, margin: '0 0 16px',
          color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)'
        }}>
          Histórico e Candidaturas Eleitorais
        </h1>
        <p style={{ margin: '0 auto', fontSize: 16, color: 'var(--ink-3)', maxWidth: 640, lineHeight: 1.6 }}>
          Explore os perfis de candidatos, bens declarados, propostas de governo e estatísticas detalhadas de cada pleito no Brasil.
        </p>
      </header>

      {/* Grid of years */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: 24
      }}>
        {years.map(y => (
          <Link key={y.ano} href={`/eleicao/${y.ano}`} style={{ textDecoration: 'none' }}>
            <div style={{
              background: y.bg,
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '36px 32px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              cursor: 'pointer',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }} className="year-card">
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                  <h2 style={{
                    fontSize: 48, fontWeight: 900, color: 'white', margin: 0,
                    fontFamily: 'var(--font-display)', lineHeight: 1
                  }}>
                    {y.ano}
                  </h2>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                    background: y.badgeBg, color: y.badgeColor, letterSpacing: '0.05em'
                  }}>
                    {y.badge}
                  </span>
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: 'white', margin: '0 0 8px' }}>
                  {y.tipo}
                </h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', margin: '0 0 24px', lineHeight: 1.5 }}>
                  {y.cargos}
                </p>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: 'var(--brand)',
                borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 16
              }}>
                📊 Acessar Painel da Eleição →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
