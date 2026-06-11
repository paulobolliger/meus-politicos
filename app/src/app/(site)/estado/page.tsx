import type { Metadata } from 'next'
import Link from 'next/link'
import { ESTADOS, type Regiao, type EstadoConfig } from '@/lib/estados-config'
import { CarouselBtn } from '@/components/site/CarouselBtn'
import { EstadoMapWrapper } from '@/components/site/EstadoMapWrapper'
import { getPgPool } from '@/lib/db/pool'

export const metadata: Metadata = {
  title: 'Estados do Brasil | Meus Políticos',
  description: 'Explore dados de transparência, gastos parlamentares e representação de todos os 27 estados brasileiros.',
}

export const revalidate = 86400

// ── Bandeiras (Wikipedia SVG) ─────────────────────────────────────────────────
const BANDEIRAS: Record<string, string> = {
  AC: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Bandeira_do_Acre.svg',
  AL: 'https://upload.wikimedia.org/wikipedia/commons/8/88/Bandeira_de_Alagoas.svg',
  AM: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/Bandeira_do_Amazonas.svg',
  AP: 'https://upload.wikimedia.org/wikipedia/commons/0/0c/Bandeira_do_Amap%C3%A1.svg',
  BA: 'https://upload.wikimedia.org/wikipedia/commons/2/28/Bandeira_da_Bahia.svg',
  CE: 'https://upload.wikimedia.org/wikipedia/commons/2/2e/Bandeira_do_Cear%C3%A1.svg',
  DF: 'https://upload.wikimedia.org/wikipedia/commons/3/3c/Bandeira_do_Distrito_Federal_%28Brasil%29.svg',
  ES: 'https://upload.wikimedia.org/wikipedia/commons/4/43/Bandeira_do_Esp%C3%ADrito_Santo.svg',
  GO: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Flag_of_Goi%C3%A1s.svg',
  MA: 'https://upload.wikimedia.org/wikipedia/commons/4/45/Bandeira_do_Maranh%C3%A3o.svg',
  MG: 'https://upload.wikimedia.org/wikipedia/commons/f/f4/Bandeira_de_Minas_Gerais.svg',
  MS: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Bandeira_de_Mato_Grosso_do_Sul.svg',
  MT: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Bandeira_de_Mato_Grosso.svg',
  PA: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Bandeira_do_Par%C3%A1.svg',
  PB: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Bandeira_da_Para%C3%ADba.svg',
  PE: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Bandeira_de_Pernambuco.svg',
  PI: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Bandeira_do_Piau%C3%AD.svg',
  PR: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Bandeira_do_Paran%C3%A1.svg',
  RJ: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Bandeira_do_estado_do_Rio_de_Janeiro.svg',
  RN: 'https://upload.wikimedia.org/wikipedia/commons/3/30/Bandeira_do_Rio_Grande_do_Norte.svg',
  RO: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Bandeira_de_Rond%C3%B4nia.svg',
  RR: 'https://upload.wikimedia.org/wikipedia/commons/9/98/Bandeira_de_Roraima.svg',
  RS: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Bandeira_do_Rio_Grande_do_Sul.svg',
  SC: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Bandeira_de_Santa_Catarina.svg',
  SE: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Bandeira_de_Sergipe.svg',
  SP: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Bandeira_do_estado_de_S%C3%A3o_Paulo.svg',
  TO: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Bandeira_do_Tocantins.svg',
}

// ── Regiões ───────────────────────────────────────────────────────────────────
type RegiaoItem = {
  id: string
  nome: string
  descricao: string
  cor: string
  estados: EstadoConfig[]
}

const REGIOES_ORDER: Regiao[] = ['Norte', 'Nordeste', 'Centro-Oeste', 'Sudeste', 'Sul']

const REGIAO_META: Record<Regiao, { id: string; cor: string; descricao: string }> = {
  'Norte':          { id: 'norte',        cor: '#009668', descricao: '7 estados · Maior extensão territorial' },
  'Nordeste':       { id: 'nordeste',     cor: '#D97706', descricao: '9 estados · Rico polo cultural e energético' },
  'Centro-Oeste':   { id: 'centro-oeste', cor: '#F59E0B', descricao: '3 estados + DF · Coração político e agronegócio' },
  'Sudeste':        { id: 'sudeste',      cor: '#8B5CF6', descricao: '4 estados · Maior polo econômico e populacional' },
  'Sul':            { id: 'sul',          cor: '#10B981', descricao: '3 estados · Altos índices de desenvolvimento' },
}

function buildRegioes(): RegiaoItem[] {
  return REGIOES_ORDER.map((regiao) => {
    const meta = REGIAO_META[regiao]
    const estados = Object.values(ESTADOS)
      .filter((e) => e.regiao === regiao)
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return { id: meta.id, nome: regiao, descricao: meta.descricao, cor: meta.cor, estados }
  })
}

function fmtPop(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}mi`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function EstadosPage() {
  const regioes = buildRegioes()
  const pool = getPgPool()

  // Buscar dados de enriquecimento no banco de dados
  const enrichedData: Record<string, {
    populacao: number | null
    idh: number | null
    pacto_tipo: 'doador' | 'receptor' | null
    nome_governador: string | null
    governador_partido: string | null
  }> = {}

  try {
    const { rows } = await pool.query(`
      SELECT 
        e.sigla,
        e.populacao::int AS populacao,
        e.idh::float8 AS idh,
        p.tipo AS pacto_tipo,
        g.nome_governador,
        g.partido_sigla AS governador_partido
      FROM estados_economia e
      LEFT JOIN estados_pacto_federativo p ON p.sigla = e.sigla AND p.ano = (SELECT MAX(ano) FROM estados_pacto_federativo WHERE sigla = e.sigla)
      LEFT JOIN estados_governos g ON g.sigla = e.sigla AND g.is_atual = true
      WHERE e.ano = (SELECT MAX(ano) FROM estados_economia WHERE sigla = e.sigla)
    `)
    
    for (const r of rows) {
      enrichedData[r.sigla.toUpperCase()] = {
        populacao: r.populacao,
        idh: r.idh,
        pacto_tipo: r.pacto_tipo,
        nome_governador: r.nome_governador,
        governador_partido: r.governador_partido,
      }
    }
  } catch (err) {
    console.error('[EstadosPage] Falha ao carregar dados do banco:', err)
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--ink)' }}>

      {/* ── Hero ── */}
      <section style={{
        backgroundImage: [
          'radial-gradient(#334155 0.5px, transparent 0.5px)',
          'radial-gradient(#334155 0.5px, var(--bg) 0.5px)',
        ].join(','),
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        borderBottom: '1px solid var(--line)',
        padding: '48px 0 40px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>
          <div className="estados-hero-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 480px',
            gap: 48,
            alignItems: 'center',
          }}>

            {/* Left */}
            <div>
              {/* Breadcrumb */}
              <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, fontSize: 13, color: 'var(--ink-3)' }}>
                <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }} className="estados-bc">
                  Início
                </Link>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6"/>
                </svg>
                <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Estados</span>
              </nav>

              <h1 style={{
                margin: '0 0 16px',
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 800, lineHeight: 1.1,
                letterSpacing: '-0.025em', color: 'var(--ink)',
              }}>
                Unidades Federativas
              </h1>
              <p style={{
                margin: '0 0 28px',
                fontSize: 16, lineHeight: 1.65,
                color: 'var(--ink-3)', maxWidth: 560,
              }}>
                Acompanhe o desempenho de cada estado brasileiro. Navegue pelo mapa
                ou selecione as regiões abaixo para explorar dados de transparência,
                gastos parlamentares e estatísticas locais.
              </p>

              {/* Region quick-jump */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {regioes.map((r) => (
                  <a key={r.id} href={`#${r.id}`} className="estados-regiao-btn" style={{
                    display: 'inline-block',
                    padding: '7px 16px',
                    borderRadius: 999,
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    fontSize: 13, fontWeight: 600,
                    color: 'var(--ink-2)',
                    textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}>
                    {r.nome === 'Centro-Oeste' ? 'Centro-Oeste' : r.nome}
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Interactive map */}
            <div style={{ display: 'flex', width: '100%', justifyContent: 'center' }}>
              <EstadoMapWrapper />
            </div>
          </div>
        </div>
      </section>

      {/* ── Regiões ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 80px', display: 'flex', flexDirection: 'column', gap: 56 }}>
        {regioes.map((regiao) => (
          <div key={regiao.id} id={regiao.id}>

            {/* Region header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <header style={{ borderLeft: `4px solid ${regiao.cor}`, paddingLeft: 14 }}>
                <h2 style={{
                  margin: '0 0 4px',
                  fontSize: 22, fontWeight: 700,
                  color: 'var(--ink)', letterSpacing: '-0.01em',
                }}>
                  Região {regiao.nome}
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                  {regiao.descricao}
                </p>
              </header>

              {/* Carousel nav arrows */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <CarouselBtn carouselId={`carousel-${regiao.id}`} dir={-1} />
                <CarouselBtn carouselId={`carousel-${regiao.id}`} dir={1} />
              </div>
            </div>

            {/* Carousel */}
            <div
              id={`carousel-${regiao.id}`}
              className="estados-carousel"
              style={{
                display: 'flex',
                overflowX: 'auto',
                gap: 20,
                paddingBottom: 8,
                scrollSnapType: 'x mandatory',
              }}
            >
              {regiao.estados.map((estado) => {
                const info = enrichedData[estado.sigla.toUpperCase()]
                const pactoTipo = info?.pacto_tipo
                const govNome = info?.nome_governador
                const govPartido = info?.governador_partido
                const pop = info?.populacao

                return (
                  <Link
                    key={estado.sigla}
                    href={`/estado/${estado.sigla.toLowerCase()}`}
                    style={{ textDecoration: 'none', flexShrink: 0, scrollSnapAlign: 'start' }}
                  >
                    <div className="estado-card" style={{
                      width: 260,
                      background: 'var(--panel)',
                      border: '1px solid var(--line)',
                      borderRadius: 12,
                      padding: '18px 20px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      transition: 'border-color 0.15s, transform 0.15s, box-shadow 0.15s',
                    }}>

                      {/* Flag + sigla row */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={BANDEIRAS[estado.sigla] ?? ''}
                          alt={`Bandeira ${estado.nome}`}
                          width={52} height={52}
                          style={{ objectFit: 'cover', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.3)' }}
                          loading="lazy"
                        />
                        <span style={{
                          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                          color: regiao.cor, fontFamily: 'var(--font-mono)',
                          background: `${regiao.cor}14`, padding: '3px 8px',
                          borderRadius: 6,
                        }}>
                          {estado.sigla}
                        </span>
                      </div>

                      {/* Name + capital + governor */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
                          <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
                            {estado.nome}
                          </h3>
                          {pactoTipo && (
                            <span style={{
                              fontSize: 9, fontWeight: 700,
                              color: pactoTipo === 'receptor' ? 'var(--pos)' : 'var(--warn)',
                              background: pactoTipo === 'receptor' ? 'var(--pos-soft)' : 'var(--warn-soft)',
                              padding: '2px 6px',
                              borderRadius: 4,
                              textTransform: 'uppercase',
                              whiteSpace: 'nowrap',
                            }}>
                              {pactoTipo === 'receptor' ? 'Receptor 📥' : 'Doador 📤'}
                            </span>
                          )}
                        </div>
                        <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                          Capital: {estado.capital}
                        </p>
                        {govNome && (
                          <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-3)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={`${govNome} (${govPartido})`}>
                            Gov: <strong style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{govNome}</strong> {govPartido ? `(${govPartido})` : ''}
                          </p>
                        )}
                      </div>

                      {/* Stats grid */}
                      <div style={{
                        display: 'grid', gridTemplateColumns: '1fr 1fr',
                        gap: '12px 8px', paddingTop: 14,
                        borderTop: '1px solid var(--line)',
                      }}>
                        <div>
                          <div style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            color: 'var(--mute)', textTransform: 'uppercase',
                            fontFamily: 'var(--font-sans)', marginBottom: 2,
                          }}>
                            {estado.sigla === 'DF' ? "RA's" : 'Municípios'}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                            {estado.municipios.toLocaleString('pt-BR')}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            color: 'var(--mute)', textTransform: 'uppercase',
                            fontFamily: 'var(--font-sans)', marginBottom: 2,
                          }}>
                            População
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                            {fmtPop(pop)}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            color: 'var(--mute)', textTransform: 'uppercase',
                            fontFamily: 'var(--font-sans)', marginBottom: 2,
                          }}>
                            Dep. Federais
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                            {estado.depu_federais}
                          </div>
                        </div>
                        <div>
                          <div style={{
                            fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                            color: 'var(--mute)', textTransform: 'uppercase',
                            fontFamily: 'var(--font-sans)', marginBottom: 2,
                          }}>
                            Dep. Estaduais
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                            {estado.depu_estaduais}
                          </div>
                        </div>
                      </div>

                      {/* CTA */}
                      <div style={{
                        fontSize: 13, fontWeight: 700,
                        color: regiao.cor,
                        paddingTop: 4,
                      }}>
                        Ver detalhes →
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        html { scroll-behavior: smooth; }
        @media (max-width: 960px) {
          .estados-hero-grid { grid-template-columns: 1fr !important; }
        }
        .estados-bc:hover { color: var(--brand) !important; }
        .estados-regiao-btn:hover {
          background: var(--brand-2) !important;
          color: var(--ink) !important;
          border-color: var(--brand-2) !important;
        }
        .estados-carousel { scrollbar-width: none; -ms-overflow-style: none; }
        .estados-carousel::-webkit-scrollbar { display: none; }
        .estado-card:hover {
          border-color: var(--brand) !important;
          transform: translateY(-3px) !important;
          box-shadow: 0 8px 20px rgba(139,92,246,0.15) !important;
        }
      ` }} />
    </div>
  )
}
