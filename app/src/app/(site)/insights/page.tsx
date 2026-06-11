import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getPgPool } from '@/lib/db/pool'
import { isFeatureActive } from '@/lib/flags'
import { Panel, PanelHeader } from '@/components/civic'

export const metadata: Metadata = {
  title: 'Insights & Rankings | Meus Políticos',
  description: 'Acompanhe em tempo real os rankings de gastos com cota parlamentar (CEAP) e a assiduidade de senadores e deputados federais.',
}

export const revalidate = 60 // Cache for 60 seconds

const CARGO_LABELS: Record<string, string> = {
  deputado_federal: 'Dep. Federal',
  senador: 'Senador',
  prefeito: 'Prefeito',
  vereador: 'Vereador',
}

interface PoliticoRankRow {
  nome: string
  nome_eleitoral: string | null
  slug: string
  foto_url: string | null
  cargo: string
  uf: string
  partido_sigla: string | null
  gasto_total_ano?: number
  presenca_pct_atual?: number
}

export default async function InsightsPage() {
  const active = await isFeatureActive('insights_rankings')
  if (!active) {
    redirect('/busca')
  }

  const pool = getPgPool()
  let spenders: PoliticoRankRow[] = []
  let present: PoliticoRankRow[] = []
  let errorMsg = ''

  try {
    const resSpenders = await pool.query<PoliticoRankRow>(`
      SELECT p.nome, p.nome_eleitoral, p.slug, p.foto_url, p.cargo, p.uf, p.gasto_total_ano, pt.sigla AS partido_sigla
      FROM politicos p
      LEFT JOIN partidos pt ON pt.id = p.partido_id
      WHERE p.gasto_total_ano IS NOT NULL AND p.gasto_total_ano > 0 AND p.cargo IN ('deputado_federal', 'senador')
      ORDER BY p.gasto_total_ano DESC
      LIMIT 15
    `)
    spenders = resSpenders.rows

    const resPresent = await pool.query<PoliticoRankRow>(`
      SELECT p.nome, p.nome_eleitoral, p.slug, p.foto_url, p.cargo, p.uf, p.presenca_pct_atual, pt.sigla AS partido_sigla
      FROM politicos p
      LEFT JOIN partidos pt ON pt.id = p.partido_id
      WHERE p.presenca_pct_atual IS NOT NULL AND p.presenca_pct_atual > 0 AND p.cargo IN ('deputado_federal', 'senador')
      ORDER BY p.presenca_pct_atual DESC
      LIMIT 15
    `)
    present = resPresent.rows
  } catch (err) {
    console.error('[InsightsPage] Erro ao buscar rankings:', err)
    errorMsg = 'Não foi possível carregar os dados de rankings no momento. Tente novamente mais tarde.'
  }

  function fmtMoeda(val: number) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(val)
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--ink)' }}>
      {/* Hero Header */}
      <section style={{
        backgroundImage: [
          'radial-gradient(#334155 0.5px, transparent 0.5px)',
          'radial-gradient(#334155 0.5px, var(--bg) 0.5px)',
        ].join(','),
        backgroundSize: '20px 20px',
        backgroundPosition: '0 0, 10px 10px',
        borderBottom: '1px solid var(--line)',
        padding: '56px 0 48px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: 13, color: 'var(--ink-3)' }}>
            <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }} className="hover:text-[var(--brand)]">
              Início
            </Link>
            <span style={{ color: 'var(--mute)' }}>/</span>
            <span style={{ color: 'var(--ink)', fontWeight: 600 }}>Insights & Rankings</span>
          </nav>

          <h1 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(32px, 5vw, 46px)',
            fontWeight: 800,
            lineHeight: 1.1,
            letterSpacing: '-0.025em',
            color: 'var(--ink)',
          }}>
            Estatísticas & <span style={{ color: 'var(--brand-2)' }}>Rankings Cívicos</span>
          </h1>

          <p style={{
            margin: 0,
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--ink-3)',
            maxWidth: 620,
          }}>
            Análise agregada de transparência baseada em fontes oficiais. Veja quais deputados federais e senadores possuem maior volume de despesas com CEAP e quem possui maior assiduidade.
          </p>
        </div>
      </section>

      {/* Grid de Rankings */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 80px' }}>
        {errorMsg ? (
          <div style={{ padding: '24px 32px', background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, textAlign: 'center', color: 'var(--neg)' }}>
            {errorMsg}
          </div>
        ) : (
          <div className="rankings-grid" style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))',
            gap: 32,
          }}>
            {/* Bloco 1: Maiores Gastos */}
            <div>
              <Panel>
                <PanelHeader 
                  title="Maiores Gastos de Cota (CEAP/CEAPS)" 
                  sub={`Total acumulado no ano legislativo de ${new Date().getFullYear()}`}
                  source="Câmara / Senado"
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {spenders.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Nenhum registro encontrado.</div>
                  ) : (
                    spenders.map((p, idx) => {
                      const labelCargo = CARGO_LABELS[p.cargo] || p.cargo
                      return (
                        <Link
                          key={p.slug}
                          href={`/politicos/${p.slug}`}
                          className="ranking-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '14px 20px',
                            borderBottom: idx < spenders.length - 1 ? '1px solid var(--line-soft)' : 'none',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* Posição */}
                          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--mute)', width: 24, textAlign: 'center' }}>
                            {idx + 1}
                          </span>

                          {/* Foto */}
                          <div style={{
                            width: 40,
                            height: 48,
                            borderRadius: 6,
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#090d16',
                            border: '1px solid var(--line)',
                            flexShrink: 0,
                          }}>
                            {p.foto_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.foto_url}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
                            ) : (
                              <div style={{
                                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)',
                              }}>
                                {p.nome_eleitoral?.slice(0, 2).toUpperCase() || 'P'}
                              </div>
                            )}
                          </div>

                          {/* Informações */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.nome_eleitoral || p.nome}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                              <span style={{ fontWeight: 700, color: 'var(--brand-2)' }}>{p.partido_sigla || '–'}</span> · {p.uf} · {labelCargo}
                            </div>
                          </div>

                          {/* Valor */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--accent-gold)' }}>
                              {fmtMoeda(p.gasto_total_ano || 0)}
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>CEAP no ano</div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </Panel>
            </div>

            {/* Bloco 2: Maior Assiduidade */}
            <div>
              <Panel>
                <PanelHeader 
                  title="Maior Assiduidade em Plenário" 
                  sub="Percentual de presença em sessões deliberativas oficiais"
                  source="Câmara / Senado"
                />
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {present.length === 0 ? (
                    <div style={{ padding: 40, textAlign: 'center', color: 'var(--mute)' }}>Nenhum registro encontrado.</div>
                  ) : (
                    present.map((p, idx) => {
                      const labelCargo = CARGO_LABELS[p.cargo] || p.cargo
                      return (
                        <Link
                          key={p.slug}
                          href={`/politicos/${p.slug}`}
                          className="ranking-row"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 16,
                            padding: '14px 20px',
                            borderBottom: idx < present.length - 1 ? '1px solid var(--line-soft)' : 'none',
                            textDecoration: 'none',
                            color: 'inherit',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          {/* Posição */}
                          <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--mute)', width: 24, textAlign: 'center' }}>
                            {idx + 1}
                          </span>

                          {/* Foto */}
                          <div style={{
                            width: 40,
                            height: 48,
                            borderRadius: 6,
                            overflow: 'hidden',
                            position: 'relative',
                            background: '#090d16',
                            border: '1px solid var(--line)',
                            flexShrink: 0,
                          }}>
                            {p.foto_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                src={p.foto_url}
                                alt=""
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                loading="lazy"
                              />
                            ) : (
                              <div style={{
                                width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                                justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)',
                              }}>
                                {p.nome_eleitoral?.slice(0, 2).toUpperCase() || 'P'}
                              </div>
                            )}
                          </div>

                          {/* Informações */}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {p.nome_eleitoral || p.nome}
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                              <span style={{ fontWeight: 700, color: 'var(--brand-2)' }}>{p.partido_sigla || '–'}</span> · {p.uf} · {labelCargo}
                            </div>
                          </div>

                          {/* Valor */}
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--pos)' }}>
                              {Number(p.presenca_pct_atual || 0).toFixed(1).replace('.', ',')}%
                            </div>
                            <div style={{ fontSize: 10, color: 'var(--mute)', marginTop: 2 }}>Presenças</div>
                          </div>
                        </Link>
                      )
                    })
                  )}
                </div>
              </Panel>
            </div>
          </div>
        )}
      </section>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 768px) {
          .rankings-grid {
            grid-template-columns: 1fr !important;
          }
        }
        .ranking-row:hover {
          background: rgba(255, 255, 255, 0.03);
        }
      ` }} />
    </main>
  )
}
