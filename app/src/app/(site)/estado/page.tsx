import type { Metadata } from 'next'
import Link from 'next/link'
import { ESTADOS, type Regiao } from '@/lib/estados-config'

export const metadata: Metadata = {
  title: 'Estados — Inteligência Política Estadual | Meus Políticos',
  description: 'Explore governança, economia, emendas e bancadas de todos os 27 estados brasileiros.',
}

export const revalidate = 86400

const REGIOES: Regiao[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

const REGIAO_CONFIG: Record<Regiao, { emoji: string; descricao: string }> = {
  Norte:          { emoji: '🌿', descricao: '9 estados · Maior região em área' },
  Nordeste:       { emoji: '☀️', descricao: '9 estados · Região mais populosa do interior' },
  'Centro-Oeste': { emoji: '🌾', descricao: '4 estados · Coração do agronegócio' },
  Sudeste:        { emoji: '🏙️', descricao: '4 estados · Maior PIB do país' },
  Sul:            { emoji: '🍃', descricao: '3 estados · Melhor IDH médio' },
}

export default function EstadosIndexPage() {
  const estadosPorRegiao = REGIOES.map((regiao) => ({
    regiao,
    estados: Object.values(ESTADOS).filter((e) => e.regiao === regiao),
  }))

  return (
    <>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)',
        padding: '64px 24px 56px',
      }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            fontSize: 12, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)',
            fontFamily: 'var(--font-mono)', marginBottom: 16, textTransform: 'uppercase',
          }}>
            🇧🇷 27 estados · 5 regiões
          </div>
          <h1 style={{
            fontSize: 'clamp(32px, 5vw, 52px)', fontWeight: 800,
            color: '#fff', margin: '0 0 16px',
            fontFamily: 'var(--font-display)', lineHeight: 1.1,
          }}>
            Inteligência Política Estadual
          </h1>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7, margin: '0 auto', maxWidth: 600 }}>
            Governança, economia, emendas, bancadas federais e estaduais de cada
            unidade da federação — tudo em um painel.
          </p>
        </div>
      </section>

      {/* Regiões */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 72px' }}>
        {estadosPorRegiao.map(({ regiao, estados }) => {
          const cfg = REGIAO_CONFIG[regiao]
          return (
            <div key={regiao} style={{ marginBottom: 52 }}>
              {/* Cabeçalho da região */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 20, paddingBottom: 12, borderBottom: '1px solid var(--line-soft)' }}>
                <span style={{ fontSize: 22 }}>{cfg.emoji}</span>
                <div>
                  <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                    {regiao}
                  </h2>
                  <p style={{ margin: 0, fontSize: 12.5, color: 'var(--mute)' }}>{cfg.descricao}</p>
                </div>
              </div>

              {/* Grid de estados */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 14,
              }}>
                {estados.map((estado) => (
                  <Link
                    key={estado.sigla}
                    href={`/estado/${estado.sigla.toLowerCase()}`}
                    style={{ textDecoration: 'none' }}
                  >
                    <div style={{
                      background: 'var(--panel)',
                      border: `1px solid var(--line-soft)`,
                      borderRadius: 14,
                      padding: '20px 18px',
                      cursor: 'pointer',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      {/* Accent line top */}
                      <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0,
                        height: 3, background: `linear-gradient(90deg, ${estado.cor}, ${estado.corSub})`,
                        borderRadius: '14px 14px 0 0',
                      }} />

                      {/* Sigla */}
                      <div style={{
                        fontSize: 24, fontWeight: 800, color: estado.cor,
                        fontFamily: 'var(--font-mono)', marginBottom: 6, marginTop: 4,
                      }}>
                        {estado.sigla}
                      </div>

                      {/* Nome */}
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, marginBottom: 8 }}>
                        {estado.nome}
                      </div>

                      {/* Meta */}
                      <div style={{ fontSize: 11, color: 'var(--mute)', lineHeight: 1.6, fontFamily: 'var(--font-mono)' }}>
                        <div>🏙️ {estado.capital}</div>
                        <div>🏘️ {estado.municipios.toLocaleString('pt-BR')} municípios</div>
                        <div>🏛️ {estado.depu_federais} dep. federais</div>
                      </div>

                      {/* Arrow */}
                      <div style={{
                        position: 'absolute', bottom: 14, right: 16,
                        fontSize: 14, color: estado.cor, opacity: 0.6,
                      }}>
                        →
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )
        })}

        {/* Info bottom */}
        <div style={{
          marginTop: 16,
          padding: '20px 28px',
          background: 'var(--panel)',
          border: '1px solid var(--line-soft)',
          borderRadius: 14,
          display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: 22 }}>📊</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
              Dados atualizados pelo ETL
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
              PIB e população: IBGE · Pacto Federativo: STN · Bancadas: Câmara e Senado · Governadores: TSE 2022
            </p>
          </div>
          <Link href="/como-funciona" style={{ fontSize: 13, color: 'var(--brand)', textDecoration: 'none', whiteSpace: 'nowrap' }}>
            Como funciona →
          </Link>
        </div>
      </div>
    </>
  )
}
