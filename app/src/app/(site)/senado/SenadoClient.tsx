'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type {
  SenadoStats, DestaqueSenador, PartidoHemiciclo, ProposicaoRecente,
  PresidenteStats, PartidoStats, ConsolidadoKPIs,
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

  // Gerar posições dos pontos no hemiciclo (81 assentos para o Senado)
  const dots = useMemo(() => {
    const rows = 5
    const baseRadius = 140
    const coords: { x: number; y: number; angle: number }[] = []
    let idx = 0

    for (let row = 0; row < rows; row++) {
      const radius = baseRadius + row * 18
      const dotsInRow = Math.floor(Math.PI * radius / 22)

      for (let i = 0; i < dotsInRow; i++) {
        if (idx >= 81) break
        const angle = (i / Math.max(dotsInRow - 1, 1)) * Math.PI
        const x = Math.cos(angle + Math.PI) * radius
        const y = Math.sin(angle + Math.PI) * radius
        coords.push({ x, y, angle })
        idx++
      }
      if (idx >= 81) break
    }

    // Ordenar por ângulo para agrupar em fatias verticais (esquerda para a direita)
    coords.sort((a, b) => a.angle - b.angle)

    return coords.map((c, i) => ({
      x: c.x.toFixed(4),
      y: c.y.toFixed(4),
      color: colorArray[i] ?? '#94a3b8'
    }))
  }, [colorArray])

  // ViewBox: x ∈ [-300, 300], y ∈ [-290, 10]
  return (
    <svg
      viewBox="-300 -290 600 300"
      style={{ width: '100%', height: '100%' }}
      aria-label="Hemiciclo do Senado Federal"
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
      background: 'rgba(30, 41, 59, 0.7)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid var(--line)',
      borderRadius: 12,
      padding: '24px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
      ...style,
    }}>
      {children}
    </div>
  )
}

// ─── Activity type config ─────────────────────────────────────────────────────
const TIPO_CONFIG: Record<string, { label: string; cor: string; icon: string }> = {
  PL:  { label: 'Projeto de Lei',       cor: '#8B5CF6', icon: '📋' },
  PEC: { label: 'Proposta de Emenda',   cor: '#A78BFA', icon: '⚖️' },
  MPV: { label: 'Medida Provisória',    cor: '#F59E0B', icon: '⚡' },
  PDL: { label: 'Projeto de Decreto',   cor: '#10B981', icon: '📜' },
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function SenadoClient({
  stats, destaques, partidos, proposicoes, presidente, consolidado, listaPartidos, ano,
}: {
  stats: SenadoStats
  destaques: DestaqueSenador[]
  partidos: PartidoHemiciclo[]
  proposicoes: ProposicaoRecente[]
  presidente: PresidenteStats
  consolidado: ConsolidadoKPIs
  listaPartidos: PartidoStats[]
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
        {/* Foto do Senado */}
        {!imgError && (
          <Image
            src="https://upload.wikimedia.org/wikipedia/commons/4/47/Plen%C3%A1rio_do_Senado_%2843010124995%29.jpg"
            alt="Plenário do Senado Federal"
            fill
            unoptimized
            sizes="100vw"
            loading="eager"
            onError={() => setImgError(true)}
            style={{
              objectFit: 'cover', objectPosition: 'center 45%',
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
              Senado Federal
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>

          {/* Membros */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>👥</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--ink-3)',
              }}>Membros</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: 6 }}>
              {stats.total || 81}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Senadores Federais ativos nesta legislatura.
            </div>
          </GlassCard>

          {/* CEAPS */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>💳</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--ink-3)',
              }}>CEAPS {ano}</span>
            </div>
            <div style={{ fontSize: 40, fontWeight: 900, color: 'var(--ink)', lineHeight: 1, marginBottom: 6 }}>
              {stats.gastoTotalAno ? fmtMoeda(stats.gastoTotalAno) : '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Total gasto em cota parlamentar no exercício de {ano}.
            </div>
          </GlassCard>

          {/* Presença */}
          <GlassCard>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 28, lineHeight: 1 }}>📊</span>
              <span style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase', color: 'var(--ink-3)',
              }}>Presença Média</span>
            </div>
            <div style={{
              fontSize: 40, fontWeight: 900, lineHeight: 1, marginBottom: 6,
              color: stats.presencaMedia != null
                ? stats.presencaMedia >= 80 ? 'var(--pos)'
                : stats.presencaMedia >= 60 ? 'var(--warn)' : 'var(--neg)'
                : 'var(--ink)',
            }}>
              {stats.presencaMedia != null ? `${stats.presencaMedia.toFixed(0)}%` : '—'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
              Taxa de presença nas sessões plenárias.
            </div>
          </GlassCard>

        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════
          MESA DIRETORA (PRESIDENTE) + HISTÓRIA DA CÂMARA
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 32 }} className="lg:grid-cols-3">
          
          {/* Card do Presidente (Davi Alcolumbre) - Ocupa 2 colunas no desktop */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 20,
          }} className="lg:col-span-2">
            <div>
              <div className="label" style={{ marginBottom: 12 }}>Mesa Diretora</div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 16 }}>
                Presidente do Senado
              </h2>
              
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
                <div style={{ position: 'relative', width: 100, height: 133, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--line)', background: 'var(--bg-2)', flexShrink: 0 }}>
                  {presidente.foto_url ? (
                    <Image
                      src={presidente.foto_url}
                      alt={presidente.nome_eleitoral ?? 'Presidente do Senado'}
                      fill
                      sizes="100px"
                      unoptimized
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--ink-3)' }}>
                      HM
                    </div>
                  )}
                </div>
                
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
                    {presidente.nome_eleitoral}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--brand-2)', fontWeight: 600, marginTop: 2 }}>
                    Senador Federal {presidente.uf} · {presidente.partido_sigla}
                  </div>
                  
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, margin: '12px 0 0' }}>
                    Como presidente do Senado Federal, Davi Alcolumbre representa a Casa, define a pauta de votações de projetos em plenário, e conduz as sessões legislativas da Mesa Diretora do Congresso.
                  </p>
                </div>
              </div>
            </div>

            {/* KPIs do Presidente */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
              gap: 16,
              paddingTop: 16,
              borderTop: '1px solid var(--line)',
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 2 }}>
                  Despesas CEAPS
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--accent-gold)' }}>
                  {presidente.gasto_total_ano ? fmtMoeda(presidente.gasto_total_ano) : '—'}
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 2 }}>
                  Presença Média
                </div>
                <div style={{
                  fontSize: 15, fontWeight: 800,
                  color: presidente.presenca_pct_atual != null
                    ? presidente.presenca_pct_atual >= 80 ? 'var(--pos)'
                    : presidente.presenca_pct_atual >= 60 ? 'var(--warn)' : 'var(--neg)'
                    : 'var(--ink)',
                }}>
                  {presidente.presenca_pct_atual != null ? `${presidente.presenca_pct_atual.toFixed(0)}%` : '—'}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link href={`/politicos/${presidente.slug}`} style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  padding: '6px 14px',
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--ink)',
                  textDecoration: 'none',
                  textAlign: 'center',
                }} className="hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-all">
                  Ver Perfil →
                </Link>
              </div>
            </div>
          </div>

          {/* História do Senado */}
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            display: 'flex',
            flexDirection: 'column',
          }}>
            <div className="label" style={{ marginBottom: 12 }}>História</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em', marginBottom: 16 }}>
              Trajetória
            </h2>
            
            <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Criada pela Constituição Imperial de 1824, o Senado Federal representa a soberania do povo brasileiro.
            </p>

            {/* Linha do tempo discreta */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 'auto' }}>
              {[
                { ano: '1826', desc: 'Primeira Sessão Legislativa no Rio de Janeiro.' },
                { ano: '1960', desc: 'Transferência para o Palácio do Congresso em Brasília.' },
                { ano: '1988', desc: 'Promulgação da Constituição Cidadã contemporânea.' }
              ].map((m, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{
                    fontSize: 11, fontWeight: 800, color: 'var(--brand-2)',
                    background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)',
                    borderRadius: 4, padding: '2px 6px', fontFamily: 'var(--font-mono)'
                  }}>
                    {m.ano}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.3 }}>
                    {m.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          HEMICICLO + ATIVIDADE RECENTE
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(360px, 100%), 1fr))', gap: 32 }}>

          {/* ── Hemiciclo ─────────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                  Composição do Hemiciclo
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>
                  Distribuição partidária e espectro político atual
                </p>
              </div>
              <Link href="/partidos" style={{
                fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                textTransform: 'uppercase', color: '#818CF8', textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 4,
              }} className="hover:underline">
                VER DETALHES →
              </Link>
            </div>

            {/* SVG container */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 16,
              padding: '32px 24px 20px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.2)',
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
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--ink)', lineHeight: 1 }}>81</div>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', marginTop: 4 }}>
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
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }} className="hover:underline">
                    {p.sigla} <span style={{ color: 'var(--ink-3)' }}>({p.total})</span>
                  </span>
                </Link>
              ))}
              {legendaPartidos.outros > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#94a3b8', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                    Outros <span style={{ color: 'var(--ink-3)' }}>({legendaPartidos.outros})</span>
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
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>
                Projetos e votações em destaque
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {proposicoes.length > 0 ? proposicoes.map((prop, idx) => {
                const cfg = TIPO_CONFIG[prop.tipo] ?? TIPO_CONFIG.PL
                return (
                  <div key={idx} style={{
                    padding: '14px 16px',
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    borderLeft: `4px solid ${cfg.cor}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                    cursor: 'default',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                        textTransform: 'uppercase', color: cfg.cor,
                      }}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--ink-3)', fontVariantNumeric: 'tabular-nums' }}>
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
                        background: 'var(--bg-2)', color: 'var(--ink-3)',
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
                  { label: 'PROJETO DE LEI', cor: '#8B5CF6', icon: '📋', title: 'Plenário Ulysses Guimarães', sub: 'Sessão Deliberativa Ordinária em tramitação' },
                  { label: 'VOTAÇÃO CONCLUÍDA', cor: '#10B981', icon: '✅', title: 'Votações nominais da semana', sub: 'Ver painel de votações' },
                  { label: 'DADOS ABERTOS', cor: '#F59E0B', icon: '🔓', title: 'API Dados Abertos do Senado', sub: 'dadosabertos.camara.leg.br' },
                ].map((item, idx) => (
                  <div key={idx} style={{
                    padding: '14px 16px',
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 10,
                    borderLeft: `4px solid ${item.cor}`,
                    boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
                  }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: item.cor }}>
                      {item.icon} {item.label}
                    </span>
                    <h3 style={{ margin: '6px 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                      {item.title}
                    </h3>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>{item.sub}</p>
                  </div>
                ))
              )}
            </div>

            <Link href="/projetos" style={{
              display: 'block', marginTop: 12,
              padding: '12px', borderRadius: 10,
              border: '1px solid var(--line)',
              background: 'var(--panel)',
              textAlign: 'center',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              textTransform: 'uppercase', color: 'var(--ink-2)',
              textDecoration: 'none',
              transition: 'all 0.15s',
            }} className="hover:border-[#8B5CF6] hover:text-[#8B5CF6]">
              VER TODAS AS ATIVIDADES
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          PAINEL CONSOLIDADO (6 KPIs) + LISTA DE PARTIDOS
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '56px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 32 }} className="lg:grid-cols-3">
            
            {/* Colunas 1 e 2 - 6 KPIs consolidados */}
            <div className="lg:col-span-2">
              <div className="label" style={{ marginBottom: 12 }}>Dados Consolidados</div>
              <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                O Senado em números
              </h2>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16 }}>
                
                {/* 1. Média Gasto */}
                <Link href="/busca?cargo=senador" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20,
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>💳</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent-gold)' }}>
                        {consolidado.avgGastoAnual ? fmtMoeda(consolidado.avgGastoAnual) : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 4 }}>
                        Cota Média Anual
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Média de gastos da cota CEAPS por senador.
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 2. Maior Gasto Categoria */}
                <Link href="/busca?cargo=senador" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20,
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📢</div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={consolidado.maiorCategoriaGasto ?? ''}>
                        {consolidado.maiorCategoriaGasto ? consolidado.maiorCategoriaGasto.split(' ')[0] + ' ' + (consolidado.maiorCategoriaGasto.split(' ')[1] ?? '') : 'Divulgação'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 4 }}>
                        Maior Categoria de Despesa
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Gastos acumulados com {consolidado.maiorCategoriaGasto ? consolidado.maiorCategoriaGasto.toLowerCase() : 'divulgação parlamentar'}.
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 3. Produção Legislativa */}
                <Link href="/projetos" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20,
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>📝</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--pos)' }}>
                        {consolidado.producaoLegislativa ? consolidado.producaoLegislativa.toLocaleString('pt-BR') : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 4 }}>
                        Proposições Autoradas
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Total de Projetos de Lei, PECs e MPs apresentados na Casa.
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 4. Emendas Destinadas */}
                <Link href="/emendas" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20,
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>💸</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand)' }}>
                        {consolidado.emendasEmpenhadas ? fmtMoeda(consolidado.emendasEmpenhadas) : '—'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 4 }}>
                        Emendas Empenhadas
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Total pago: {consolidado.emendasPagas ? fmtMoeda(consolidado.emendasPagas) : '—'}.
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 5. Pluralidade Partidária */}
                <Link href="/partidos" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20,
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🤝</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--brand-2)' }}>
                        {consolidado.pluralidadePartidos} Partidos
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 4 }}>
                        Pluralidade Partidária
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Representantes de diferentes legendas ativas.
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 6. Representação Federativa */}
                <Link href="/estado" style={{ textDecoration: 'none' }}>
                  <div style={{
                    background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20,
                    height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all 0.2s'
                  }} className="hover:border-[#8B5CF6] hover:shadow-[0_0_20px_rgba(139,92,246,0.1)]">
                    <div style={{ fontSize: 24, marginBottom: 8 }}>🗺️</div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
                        {consolidado.totalUfsRepresentadas} UFs
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, marginTop: 4 }}>
                        Representação Territorial
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                        Todos os estados e o DF com representantes ativos.
                      </div>
                    </div>
                  </div>
                </Link>

              </div>
            </div>

            {/* Coluna 3 - Painel Rolável de Partidos */}
            <div>
              <div className="label" style={{ marginBottom: 12 }}>Partidos</div>
              <h2 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Bancadas & Gastos
              </h2>

              <div style={{ position: 'relative' }}>
                <div style={{
                  maxHeight: 380,
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  paddingRight: 6,
                }} className="custom-scrollbar">
                  {listaPartidos.map((p) => {
                    const cor = partidoCor(p.sigla, p.cor)
                    return (
                      <Link key={p.sigla} href={`/partidos/${p.sigla.toLowerCase()}`} style={{ textDecoration: 'none' }}>
                        <div style={{
                          background: 'var(--panel)',
                          border: '1px solid var(--line)',
                          borderRadius: 10,
                          padding: '12px 16px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          transition: 'all 0.15s',
                          cursor: 'pointer',
                        }} className="hover:border-[#8B5CF6] hover:bg-[#252f48]">
                          {/* Faixa ou círculo do partido */}
                          <div style={{
                            width: 6,
                            height: 38,
                            borderRadius: 3,
                            background: cor,
                            flexShrink: 0
                          }} />
                          
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                              <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--ink)' }}>
                                {p.sigla}
                              </span>
                              <span style={{
                                fontSize: 10,
                                fontWeight: 700,
                                background: 'var(--bg-2)',
                                padding: '2px 8px',
                                borderRadius: 99,
                                color: 'var(--ink-2)',
                              }}>
                                {p.total_senadores} sens
                              </span>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                              <span>Pres.: {p.avg_presenca != null ? `${p.avg_presenca}%` : '—'}</span>
                              <span style={{ color: 'var(--accent-gold)' }}>CEAPS: {p.total_gasto != null ? fmtMoeda(p.total_gasto) : '—'}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
                
                {/* Indicador de scroll */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  marginTop: 12,
                  fontSize: 11,
                  color: 'var(--ink-3)',
                  fontWeight: 600,
                  pointerEvents: 'none',
                }}>
                  <span>Role para ver mais partidos</span>
                  <span style={{ animation: 'bounce 1s infinite', fontSize: 12 }}>↓</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          COMISSÕES DA CÂMARA
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid var(--line)', background: 'var(--panel)', padding: '56px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          
          <div style={{ marginBottom: 32 }}>
            <div className="label" style={{ marginBottom: 12 }}>Órgãos Técnicos</div>
            <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
              Comissões Temáticas
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>
              As comissões debatem, votam pareceres e aprofundam a análise técnica e jurídica de todos os projetos de lei.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 20 }}>
            {[
              {
                icon: '⚖️',
                sigla: 'CCJC',
                nome: 'Constituição, Justiça e de Cidadania',
                desc: 'Comissão mais importante da Casa. Analisa se as proposições legislativas estão em conformidade com a Constituição Federal.'
              },
              {
                icon: '📊',
                sigla: 'CFT',
                nome: 'Finanças e Tributação',
                desc: 'Avalia a compatibilidade orçamentária e financeira de projetos que envolvem despesas públicas e receitas da União.'
              },
              {
                icon: '🩺',
                sigla: 'CSAUDE',
                nome: 'Saúde',
                desc: 'Analisa o Sistema Único de Saúde (SUS), vigilância sanitária, assistência médica e campanhas de saúde pública no país.'
              },
              {
                icon: '🏫',
                sigla: 'CE',
                nome: 'Educação',
                desc: 'Debate políticas educacionais, diretrizes curriculares nacionais, financiamento do ensino público e diretrizes de desenvolvimento.'
              },
              {
                icon: '🛡️',
                sigla: 'CSPCCO',
                nome: 'Segurança Pública e Combate ao Crime Organizado',
                desc: 'Debate políticas de segurança pública, atuação das polícias, sistema penitenciário e combate ao crime organizado.'
              },
              {
                icon: '🚜',
                sigla: 'CAPADR',
                nome: 'Agricultura, Pecuária, Abastecimento e Des. Rural',
                desc: 'Discute a política agrícola, reforma agrária, produção pecuária, abastecimento e desenvolvimento sustentável do campo.'
              }
            ].map((c, idx) => (
              <Link key={idx} href={`/camara/comissoes/${c.sigla.toLowerCase()}`} style={{
                background: 'var(--bg)',
                border: '1px solid var(--line)',
                borderRadius: 12,
                padding: 24,
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                textDecoration: 'none',
                color: 'inherit',
                transition: 'all 0.2s',
                cursor: 'pointer',
              }}
              className="hover-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 24 }}>{c.icon}</span>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand-2)' }}>{c.sigla}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink)' }}>{c.nome}</div>
                  </div>
                </div>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4, margin: 0 }}>
                  {c.desc}
                </p>
              </Link>
            ))}
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
            <Link href="/camara/comissoes" style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 8,
              background: 'var(--bg)',
              border: '1px solid var(--line)',
              color: 'var(--brand-2)',
              fontWeight: 700,
              fontSize: 14,
              textDecoration: 'none',
              transition: 'all 0.2s',
              cursor: 'pointer',
            }}
            className="hover-card">
              Ver todas as Comissões do Senado →
            </Link>
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          DEPUTADOS EM DESTAQUE
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)', padding: '56px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>

          {/* Header da seção */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32 }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.01em' }}>
                Conheça os Senadores
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>
                Amostra aleatória de parlamentares ativos na legislatura atual
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href="/busca?cargo=senador" style={{
                padding: '10px 20px', borderRadius: 8,
                background: '#8B5CF6', color: '#fff',
                fontSize: 13, fontWeight: 700, textDecoration: 'none',
                transition: 'background 0.15s ease',
              }} className="hover:bg-[#7C3AED]">
                Ver Todos
              </Link>
            </div>
          </div>

          {/* Grid de cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))', gap: 16 }}>
            {destaques.map(dep => (
              <DestaqueCard key={dep.id} dep={dep} />
            ))}
          </div>

        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════
          CONTATO E LOCALIZAÇÃO (RODAPÉ CÍVICO)
      ════════════════════════════════════════════════════════════════════ */}
      <section style={{ borderTop: '1px solid var(--line)', background: 'var(--bg)', padding: '48px 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 32 }} className="md:grid-cols-3">
            
            {/* Endereço */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📍</span>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Localização
                </h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0 }}>
                Palácio do Congresso Nacional<br />
                Praça dos Três Poderes<br />
                Brasília - DF, CEP 70160-900
              </p>
            </div>

            {/* Telefones */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>📞</span>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Telefones
                </h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0 }}>
                <strong>Disque-Senado:</strong> 0800-0-619-619 (gratuito)<br />
                <strong>Geral:</strong> (61) 3216-0000<br />
                Horário: Segunda a sexta, das 9h às 19h
              </p>
            </div>

            {/* Atendimento e Transparência */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>🏛️</span>
                <h3 style={{ margin: 0, fontSize: 14, fontWeight: 800, color: 'var(--ink)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Canais Oficiais
                </h3>
              </div>
              <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5, margin: '0 0 12px' }}>
                Para visitas guiadas, audiências públicas ou petições, consulte os canais de transparência do Senado.
              </p>
              <a href="https://www.camara.leg.br" target="_blank" rel="noopener noreferrer" style={{
                fontSize: 12, fontWeight: 700, color: '#818CF8', textDecoration: 'none',
              }} className="hover:underline">
                Portal Oficial do Senado →
              </a>
            </div>

          </div>
        </div>
      </section>

    </div>
  )
}

// ─── Destaque Card ────────────────────────────────────────────────────────────
function DestaqueCard({ dep }: { dep: DestaqueSenador }) {
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
          background: 'var(--bg)',
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: hover
            ? '0 8px 30px rgba(139,92,246,0.18)'
            : '0 2px 8px rgba(0,0,0,0.2)',
          border: hover ? '1px solid #8B5CF6' : '1px solid var(--line)',
          transform: hover ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all 0.3s ease',
          cursor: 'pointer',
        }}
      >
        {/* Foto — proporção quadrada, grayscale → color */}
        <div style={{ position: 'relative', width: '100%', aspectRatio: '1/1', overflow: 'hidden' }}>
          {dep.foto_url && !imgErr ? (
            <Image
              src={dep.foto_url}
              alt={nome}
              onError={() => setImgErr(true)}
              fill
              sizes="(max-width: 640px) 100vw, 25vw"
              unoptimized
              style={{
                objectFit: 'cover', objectPosition: 'top',
                filter: hover ? 'grayscale(0%) brightness(1.03)' : 'grayscale(60%)',
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
              background: 'rgba(15,23,42,0.85)',
              backdropFilter: 'blur(8px)',
              padding: '3px 8px', borderRadius: 4,
              fontSize: 10, fontWeight: 700, color: 'var(--ink)',
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
            paddingTop: 12, borderTop: '1px solid var(--line)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 2 }}>
                CEAPS
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--accent-gold)' }}>
                {dep.gasto_total_ano ? fmtMoeda(dep.gasto_total_ano) : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 2 }}>
                Presença
              </div>
              <div style={{
                fontSize: 13, fontWeight: 800,
                color: dep.presenca_pct_atual != null
                  ? dep.presenca_pct_atual >= 80 ? 'var(--pos)'
                  : dep.presenca_pct_atual >= 60 ? 'var(--warn)' : 'var(--neg)'
                  : 'var(--ink)',
              }}>
                {dep.presenca_pct_atual != null ? `${dep.presenca_pct_atual.toFixed(0)}%` : '—'}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--ink-3)', marginBottom: 2 }}>
                UF
              </div>
              <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--ink)' }}>
                {dep.uf ?? '—'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
