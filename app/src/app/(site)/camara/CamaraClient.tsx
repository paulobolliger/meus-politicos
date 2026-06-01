'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import type {
  CamaraStats, DestaqueDeputado, PartidoHemiciclo, ProposicaoRecente,
} from './page'

// ─── Helpers ──────────────────────────────────────────────────────────────────
function fmtMoeda(n: number): string {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1).replace('.', ',')}B`
  if (n >= 1_000_000)     return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000)         return `R$ ${(n / 1_000).toFixed(0)}k`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

function hashColor(str: string): string {
  const palette = [
    '#2563eb','#dc2626','#f97316','#16a34a','#7c3aed',
    '#0891b2','#d97706','#be185d','#059669','#475569',
  ]
  let h = 0
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffffffff
  return palette[Math.abs(h) % palette.length]
}

function partidoCor(sigla: string, cor: string | null): string {
  if (cor) return cor
  // Cores canônicas dos maiores partidos
  const map: Record<string, string> = {
    PL: '#1d4ed8', PT: '#dc2626', 'UNIÃO': '#f97316', PP: '#60a5fa',
    PSD: '#7c3aed', REPUBLICANOS: '#16a34a', MDB: '#65a30d',
    PODE: '#d97706', PSDB: '#3b82f6', PDT: '#e11d48',
    PSB: '#f59e0b', AVANTE: '#06b6d4', NOVO: '#ff6b35', PSOL: '#7c3aed',
  }
  return map[sigla] ?? hashColor(sigla)
}

// ─── Hemiciclo SVG ────────────────────────────────────────────────────────────
function Hemiciclo({ partidos }: { partidos: PartidoHemiciclo[] }) {
  // Montar array de cores na ordem proporcional dos partidos
  const colorArray = useMemo(() => {
    const arr: string[] = []
    for (const p of partidos) {
      const cor = partidoCor(p.sigla, p.cor)
      for (let i = 0; i < p.total; i++) arr.push(cor)
    }
    return arr
  }, [partidos])

  // Gerar posições dos pontos no hemiciclo
  const dots = useMemo(() => {
    const rows = 12
    const baseRadius = 130
    const result: { x: number; y: number; color: string }[] = []
    let idx = 0

    for (let row = 0; row < rows; row++) {
      const radius = baseRadius + row * 13
      const dotsInRow = Math.floor(Math.PI * radius / 17)

      for (let i = 0; i < dotsInRow; i++) {
        if (idx >= 513) break
        const angle = (i / Math.max(dotsInRow - 1, 1)) * Math.PI
        const x = Math.cos(angle + Math.PI) * radius
        const y = Math.sin(angle + Math.PI) * radius
        result.push({ x, y, color: colorArray[idx] ?? '#94a3b8' })
        idx++
      }
      if (idx >= 513) break
    }
    return result
  }, [colorArray])

  // ViewBox: x ∈ [-300, 300], y ∈ [-290, 10]
  return (
    <svg
      viewBox="-300 -290 600 300"
      style={{ width: '100%', height: '100%' }}
      aria-label="Hemiciclo da Câmara dos Deputados"
    >
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r={4.5} fill={d.color} opacity={0.9} />
      ))}
    </svg>
  )
}

// ─── Glass Card ───────────────────────────────────────────────────────────────
function GlassCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.82)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(226,232,240,0.85)',
      borderRadius: 12,
      padding: '24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Activity type config ─────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; cor: string; icon: string }> = {
  PL:  { label: 'Projeto de Lei',       cor: '#2563eb', icon: '📋' },
  PEC: { label: 'Proposta de Emenda',   cor: '#7c3aed', icon: '⚖️' },
  MPV: { label: 'Medida Provisória',    cor: '#d97706', icon: '⚡' },
  PDL: { label: 'Projeto de Decreto',   cor: '#059669', icon: '📜' },
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function CamaraClient({
  stats, destaques, partidos, proposicoes, ano,
}: {
  stats: CamaraStats
  destaques: DestaqueDeputado[]
  partidos: PartidoHemiciclo[]
  proposicoes: ProposicaoRecente[]
  ano: number
}) {
  const [imgError, setImgError] = useState(false)

  // Legenda: top 5 partidos + "Outros"
  const legendaPartidos = useMemo(() => {
    const top = partidos.slice(0, 5)
    const outros = partidos.slice(5).reduce((s, p) => s + p.total, 0)
    return { top, outros }
  }, [partidos])

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ════════════════════════════════════════════════════════════════════
          HERO — full-bleed, contrabalança paddingTop: 100 do layout
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative',
        height: 614,
        width: '100%',
        overflow: 'hidden',
        marginTop: -100,  // sobe para cobrir o paddingTop do layout
        background: 'linear-gradient(160deg, #071630 0%, #0d2b6b 100%)',
      }}>
        {/* Foto do Congresso */}
        {!imgError && (
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/33/Congresso_Nacional_do_Brasil.jpg/1280px-Congresso_Nacional_do_Brasil.jpg"
            alt="Congresso Nacional do Brasil"
            onError={() => setImgError(true)}
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center 30%',
            }}
          />
        )}
        {/* Overlay escuro */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(7,22,48,0.55)',
          zIndex: 1,
        }} />

        {/* Conteúdo do hero — posicionado na parte inferior */}
        <div style={{
          position: 'absolute', bottom: 56, left: 0, right: 0,
          zIndex: 2,
          maxWidth: 1200, margin: '0 auto', padding: '0 32px',
        }}>
          <div style={{ maxWidth: 640 }}>
            {/* Badge de localização */}
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              background: 'rgba(255,255,255,0.12)',
              backdropFilter: 'blur(8px)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 999,
              padding: '5px 14px',
              marginBottom: 16,
            }}>
              <span style={{ fontSize: 16 }}>📍</span>
              <span style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'rgba(255,255,255,0.9)',
              }}>
                Brasília, DF
              </span>
            </div>

            <h1 style={{
              margin: 0,
              fontSize: 40, fontWeight: 900,
              lineHeight: 1.1, letterSpacing: '-0.02em',
              color: '#ffffff',
            }}>
              Câmara dos Deputados
            </h1>

            <p style={{
              margin: '14px 0 0',
              fontSize: 16, lineHeight: 1.65,
              color: 'rgba(255,255,255,0.78)',
              maxWidth: 520,
            }}>
              O coração da democracia brasileira. Acompanhe em tempo real a
              atividade legislativa, gastos e o desempenho de seus representantes.
            </p>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          KPI CARDS — flutuam sobre o final do hero (margem negativa)
      ════════════════════════════════════════════════════════════════════ */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 32px',
        marginTop: -40,
        position: 'relative', zIndex: 10,
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>

          {/* Membros */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>👥</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#64748b',
              }}>Membros</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#0a0e1a', lineHeight: 1, marginBottom: 6 }}>
              {stats.total || 513}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Deputados Federais ativos nesta legislatura.
            </div>
          </GlassCard>

          {/* CEAP */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>💳</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#64748b',
              }}>CEAP {ano}</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: '#0a0e1a', lineHeight: 1, marginBottom: 6 }}>
              {stats.gastoTotalAno ? fmtMoeda(stats.gastoTotalAno) : '—'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Total gasto em cota parlamentar no exercício de {ano}.
            </div>
          </GlassCard>

          {/* Presença */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>📊</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: '#64748b',
              }}>Presença Média</span>
            </div>
            <div style={{
              fontSize: 40, fontWeight: 900, lineHeight: 1, marginBottom: 6,
              color: stats.presencaMedia != null
                ? stats.presencaMedia >= 80 ? '#046c4e'
                : stats.presencaMedia >= 60 ? '#b45309' : '#b91c1c'
                : '#0a0e1a',
            }}>
              {stats.presencaMedia != null ? `${stats.presencaMedia.toFixed(0)}%` : '—'}
            </div>
            <div style={{ fontSize: 13, color: '#64748b' }}>
              Taxa de presença nas sessões plenárias.
            </div>
          </GlassCard>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          HEMICICLO + ATIVIDADE RECENTE
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 32 }}>

          {/* ── Hemiciclo ─────────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  Composição do Hemiciclo
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                  Distribuição partidária e espectro político atual
                </p>
              </div>
              <Link href="/partidos" style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#1d3a8a', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
              }}>
                VER DETALHES →
              </Link>
            </div>

            {/* SVG container */}
            <div style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(14px)',
              border: '1px solid rgba(226,232,240,0.85)',
              borderRadius: 16,
              padding: '32px 24px 20px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
              aspectRatio: '16/9',
              position: 'relative',
              overflow: 'hidden',
            }}>
              <Hemiciclo partidos={partidos} />

              {/* Label central */}
              <div style={{
                position: 'absolute', bottom: 28, left: '50%',
                transform: 'translateX(-50%)',
                textAlign: 'center', pointerEvents: 'none',
              }}>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>513</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#64748b', marginTop: 4 }}>
                  Assentos Totais
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 16 }}>
              {legendaPartidos.top.map(p => (
                <Link key={p.sigla} href={`/partidos/${p.sigla.toLowerCase()}`} style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  textDecoration: 'none',
                }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: '50%',
                    background: partidoCor(p.sigla, p.cor), flexShrink: 0,
                  }} />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    {p.sigla} <span style={{ color: '#9ca3af' }}>({p.total})</span>
                  </span>
                </Link>
              ))}
              {legendaPartidos.outros > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
                    Outros <span style={{ color: '#9ca3af' }}>({legendaPartidos.outros})</span>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Atividade Recente ──────────────────────────────────────── */}
          <div>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Atividade Recente
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                Projetos e votações em destaque
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {proposicoes.length > 0 ? proposicoes.map((prop, idx) => {
                const cfg = TIPO_CONFIG[prop.tipo] ?? TIPO_CONFIG.PL
                return (
                  <div key={idx} style={{
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(226,232,240,0.85)',
                    borderRadius: 10,
                    borderLeft: `4px solid ${cfg.cor}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                    cursor: 'default',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                        textTransform: 'uppercase', color: cfg.cor,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                        {prop.tipo} {prop.numero}/{prop.ano}
                      </span>
                    </div>
                    <h3 style={{
                      margin: '0 0 8px', fontSize: 13, fontWeight: 600,
                      color: 'var(--ink)', lineHeight: 1.4,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {prop.ementa}
                    </h3>
                    {prop.situacao && (
                      <span style={{
                        display: 'inline-block',
                        padding: '2px 8px', borderRadius: 4,
                        background: '#f1f5f9', color: '#64748b',
                        fontSize: 11, fontWeight: 500,
                      }}>
                        {prop.situacao}
                      </span>
                    )}
                  </div>
                )
              }) : (
                /* Fallback se não houver proposições */
                [
                  { label: 'PROJETO DE LEI', cor: '#2563eb', icon: '📋', title: 'Plenário Ulysses Guimarães', sub: 'Sessão Deliberativa Ordinária em tramitação' },
                  { label: 'VOTAÇÃO CONCLUÍDA', cor: '#16a34a', icon: '✅', title: 'Votações nominais da semana', sub: 'Ver painel de votações' },
                  { label: 'DADOS ABERTOS', cor: '#d97706', icon: '🔓', title: 'API Dados Abertos da Câmara', sub: 'dadosabertos.camara.leg.br' },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '14px 16px',
                    background: 'rgba(255,255,255,0.82)',
                    backdropFilter: 'blur(14px)',
                    border: '1px solid rgba(226,232,240,0.85)',
                    borderRadius: 10,
                    borderLeft: `4px solid ${item.cor}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: item.cor }}>
                      {item.icon} {item.label}
                    </span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                      {item.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{item.sub}</p>
                  </div>
                ))
              )}
            </div>

            <Link href="/proposicoes" style={{
              display: 'block', marginTop: 12,
              padding: '12px', borderRadius: 10,
              border: '1px solid rgba(226,232,240,0.85)',
              background: 'rgba(255,255,255,0.5)',
              textAlign: 'center',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: '#64748b',
              textDecoration: 'none',
              transition: 'background 0.15s',
            }}>
              VER TODAS AS ATIVIDADES
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          DEPUTADOS EM DESTAQUE
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: '#eff4ff', padding: '56px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

          {/* Header da seção */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Deputados em Destaque
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#64748b' }}>
                Maiores gastos em cota parlamentar (CEAP) em {ano}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/busca?cargo=deputado_federal" style={{
                padding: '10px 20px', borderRadius: 8,
                background: '#131b2e', color: '#fff',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
              }}>
                Ver Todos
              </Link>
            </div>
          </div>

          {/* Grid de cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {destaques.map(dep => (
              <DestaqueCard key={dep.id} dep={dep} />
            ))}
          </div>

        </div>
      </section>

    </div>
  )
}

// ─── Destaque Card ────────────────────────────────────────────────────────────
function DestaqueCard({ dep }: { dep: DestaqueDeputado }) {
  const [hover, setHover] = useState(false)
  const [imgErr, setImgErr] = useState(false)
  const nome = dep.nome_eleitoral ?? '—'
  const cor = partidoCor(dep.partido_sigla ?? '', dep.partido_cor)

  return (
    <Link href={`/politicos/${dep.slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          background: '#ffffff',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: hover
            ? '0 16px 40px rgba(0,0,0,0.16)'
            : '0 2px 8px rgba(0,0,0,0.07)',
          border: '1px solid rgba(226,232,240,0.5)',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      >
        {/* Foto — proporção quadrada, grayscale → color */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '3/4', overflow: 'hidden' }}>
          {dep.foto_url && !imgErr ? (
            <img
              src={dep.foto_url}
              alt={nome}
              onError={() => setImgErr(true)}
              style={{
                width: '100%', height: '100%',
                objectFit: 'cover', objectPosition: 'top',
                filter: hover ? 'grayscale(0%) brightness(1.03)' : 'grayscale(80%)',
                transform: hover ? 'scale(1.04)' : 'scale(1.08)',
                transition: 'all 0.5s ease',
                display: 'block',
              }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: cor,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, color: '#fff', fontWeight: 800,
            }}>
              {nome.split(' ').map(p => p[0]).slice(0, 2).join('')}
            </div>
          )}

          {/* Badge UF */}
          {dep.uf && (
            <div style={{
              position: 'absolute', top: 10, right: 10,
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px', borderRadius: 4,
              fontSize: 10, fontWeight: 700, color: '#374151',
            }}>
              {dep.uf}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ padding: '14px 16px 16px' }}>
          {dep.partido_sigla && (
            <span style={{
              display: 'block',
              fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
              textTransform: 'uppercase', color: cor,
              marginBottom: 4,
            }}>
              {dep.partido_sigla}
            </span>
          )}
          <h3 style={{
            margin: '0 0 12px', fontSize: 14, fontWeight: 700,
            color: 'var(--ink)', lineHeight: 1.3,
          }}>
            {nome}
          </h3>

          {/* Métricas */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
            paddingTop: 12, borderTop: '1px solid #f1f5f9',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>
                CEAP
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#b91c1c' }}>
                {dep.gasto_total_ano ? fmtMoeda(dep.gasto_total_ano) : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>
                Presença
              </div>
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: dep.presenca_pct_atual != null
                  ? dep.presenca_pct_atual >= 80 ? '#046c4e'
                  : dep.presenca_pct_atual >= 60 ? '#b45309' : '#b91c1c'
                  : '#374151',
              }}>
                {dep.presenca_pct_atual != null ? `${dep.presenca_pct_atual.toFixed(0)}%` : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 2 }}>
                UF
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#374151' }}>
                {dep.uf ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
