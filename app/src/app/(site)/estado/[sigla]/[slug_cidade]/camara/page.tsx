import { getPgPool } from '@/lib/db/pool'
import { getEstado } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import CamaraClient from './CamaraClient'

export const revalidate = 86400

// ─── Static params ──────────────────────────────────────────────────────────
export function generateStaticParams() {
  return [
    { sigla: 'sp', slug_cidade: 'sao-paulo-sp' },
    { sigla: 'rj', slug_cidade: 'rio-de-janeiro-rj' },
    { sigla: 'ac', slug_cidade: 'rio-branco-ac' },
  ]
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string; slug_cidade: string }> }
): Promise<Metadata> {
  const { sigla, slug_cidade } = await params
  const pool = getPgPool()
  const res = await pool.query<{ nome: string; uf: string }>(
    `SELECT nome, uf FROM municipios WHERE slug = $1 AND UPPER(uf) = $2 LIMIT 1`,
    [slug_cidade, sigla.toUpperCase()]
  )
  const city = res.rows[0]
  if (!city) return { title: 'Câmara Municipal não encontrada' }
  return {
    title: `Câmara Municipal de ${city.nome} (${city.uf}) — Vereadores | Meus Políticos`,
    description: `Acompanhe os vereadores em exercício, composição partidária e presença dos parlamentares de ${city.nome} (${city.uf}).`,
  }
}

// ─── Hemiciclo dot computation ────────────────────────────────────────────────
type HemiDot = { cx: number; cy: number; color: string; sigla: string }

function computeHemicicloDots(
  partidos: Array<{ sigla: string; qtd: number; cor: string }>,
  total: number
): HemiDot[] {
  const rowConfigs =
    total <= 20 ? [{ r: 90, f: 1 }]
    : total <= 40 ? [{ r: 65, f: 0.38 }, { r: 105, f: 0.62 }]
    : total <= 70 ? [{ r: 52, f: 0.27 }, { r: 82, f: 0.36 }, { r: 113, f: 0.37 }]
    : [{ r: 48, f: 0.21 }, { r: 76, f: 0.26 }, { r: 104, f: 0.28 }, { r: 132, f: 0.25 }]

  const rows: { r: number; count: number }[] = []
  let assigned = 0
  rowConfigs.forEach((rc, i) => {
    const cnt = i < rowConfigs.length - 1 ? Math.round(total * rc.f) : total - assigned
    rows.push({ r: rc.r, count: Math.max(cnt, 0) })
    assigned += cnt
  })

  const seats: { sigla: string; color: string }[] = []
  partidos.forEach((p) => {
    for (let i = 0; i < p.qtd; i++) seats.push({ sigla: p.sigla, color: p.cor })
  })

  const CX = 200, CY = 196
  const coords: { cx: number; cy: number; angle: number }[] = []
  let idx = 0

  for (const row of rows) {
    const n = Math.min(row.count, seats.length - idx)
    for (let i = 0; i < n; i++) {
      const angle = Math.PI - (n === 1 ? Math.PI / 2 : (i / (n - 1)) * Math.PI)
      coords.push({
        cx: Number((CX + row.r * Math.cos(angle)).toFixed(1)),
        cy: Number((CY - row.r * Math.sin(angle)).toFixed(1)),
        angle,
      })
      idx++
    }
  }

  coords.sort((a, b) => b.angle - a.angle)

  return coords.map((c, i) => ({
    cx: c.cx,
    cy: c.cy,
    color: seats[i]?.color ?? '#94a3b8',
    sigla: seats[i]?.sigla ?? 'Outros',
  }))
}

const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#f59e0b', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', PSOL: '#ec4899', REDE: '#10b981',
}

type Vereador = {
  id: string
  slug: string
  nome_eleitoral: string
  foto_url: string | null
  sexo: string | null
  partido: string | null
  mandato_inicio: Date | null
  mandato_fim: Date | null
}

export default async function CamaraPage(
  { params }: { params: Promise<{ sigla: string; slug_cidade: string }> }
) {
  const { sigla, slug_cidade } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPgPool()

  // Fetch city info
  const cityRes = await pool.query<{ id: string; nome: string; uf: string }>(
    `SELECT id, nome, uf FROM municipios WHERE slug = $1 AND UPPER(uf) = $2 LIMIT 1`,
    [slug_cidade, siglaUp]
  )
  const city = cityRes.rows[0]
  if (!city) notFound()

  // Fetch all vereadores
  const vResult = await pool.query<Vereador>(
    `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, p.sexo,
            pt.sigla AS partido, p.mandato_inicio, p.mandato_fim
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.municipio_id = $1 AND p.cargo = 'vereador' AND p.removido_em IS NULL
     ORDER BY pt.sigla, p.nome_eleitoral`,
    [city.id]
  )
  const vereadores = vResult.rows

  // Fetch party stats
  const partResult = await pool.query<{ partido: string; total: string }>(
    `SELECT pt.sigla AS partido, COUNT(*) AS total
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.municipio_id = $1 AND p.cargo = 'vereador' AND p.removido_em IS NULL
     GROUP BY pt.sigla
     ORDER BY COUNT(*) DESC`,
    [city.id]
  )
  const partyStats = partResult.rows

  const camaraPartidos = partyStats.map((p) => ({
    sigla: p.partido ?? 'Outros',
    qtd: Number(p.total),
    cor: PARTIDO_COR[p.partido ?? ''] ?? '#94a3b8',
  }))

  const totalCadeiras = vereadores.length
  const dots = camaraPartidos.length > 0 ? computeHemicicloDots(camaraPartidos, totalCadeiras) : []

  // Gender stats
  const feminino = vereadores.filter((v) => v.sexo === 'F').length
  const masculino = vereadores.filter((v) => v.sexo === 'M').length

  const cor = cfg.cor

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 72px' }}>
      
      {/* Breadcrumb */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--ink-3)', marginBottom: 28, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Início', href: '/' },
          { label: 'Estados', href: '/estado' },
          { label: cfg.nome, href: `/estado/${sigla}` },
          { label: city.nome, href: `/estado/${sigla}/${slug_cidade}` },
        ].map(b => (
          <span key={b.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href={b.href} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-link">{b.label}</Link>
            <span>/</span>
          </span>
        ))}
        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Câmara Municipal</span>
      </nav>

      {/* Header Banner */}
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 16, padding: '36px 40px', marginBottom: 32,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 6, background: cor }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
          Poder Legislativo Municipal
        </span>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800, margin: '8px 0 16px',
          color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)'
        }}>
          Câmara Municipal de {city.nome}
        </h1>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span style={{
            background: 'var(--bg)', border: '1px solid var(--line)',
            color: 'var(--ink-2)', padding: '6px 14px', borderRadius: 999,
            fontSize: 13, fontWeight: 600
          }}>
            👥 {totalCadeiras} Vereadores Titulares
          </span>
          <span style={{
            background: 'var(--bg)', border: '1px solid var(--line)',
            color: 'var(--ink-2)', padding: '6px 14px', borderRadius: 999,
            fontSize: 13, fontWeight: 600
          }}>
            🗳️ {camaraPartidos.length} Partidos Representados
          </span>
        </div>
      </div>

      {/* Bento Grid: Hemiciclo + Composition stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24, marginBottom: 48, alignItems: 'stretch' }}>
        
        {/* Hemiciclo SVG Card */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 14, padding: '28px 32px'
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px', fontFamily: 'var(--font-display)' }}>
            Composição do Hemiciclo
          </h2>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '0 0 24px' }}>
            Distribuição espacial das {totalCadeiras} cadeiras na Câmara Municipal (Leg. 2025–2028)
          </p>

          {dots.length > 0 ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                <svg viewBox="0 0 400 200" style={{ width: '100%', maxWidth: 440 }}>
                  <path d="M 50 196 Q 200 10 350 196" fill="none" stroke="var(--line)" strokeWidth="1" strokeDasharray="4,4" />
                  {dots.map((dot, i) => (
                    <circle
                      key={i}
                      cx={dot.cx}
                      cy={dot.cy}
                      r={totalCadeiras > 40 ? 5 : 6}
                      fill={dot.color}
                      style={{ transition: 'r 0.15s', cursor: 'pointer' }}
                    >
                      <title>{dot.sigla}</title>
                    </circle>
                  ))}
                  <text x="200" y="190" textAnchor="middle" fontSize="18" fontWeight="800" fill="var(--ink)" fontFamily="var(--font-mono)">
                    {totalCadeiras}
                  </text>
                  <text x="200" y="200" textAnchor="middle" fontSize="8" fill="var(--ink-3)" fontFamily="var(--font-mono)">
                    CADEIRAS
                  </text>
                </svg>
              </div>

              {/* Legenda de partidos */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', marginTop: 12 }}>
                {camaraPartidos.map((p) => (
                  <div key={p.sigla} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 2, background: p.cor }} />
                    <span style={{ fontSize: 12, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
                      {p.sigla} <span style={{ color: 'var(--ink-3)' }}>{p.qtd}</span>
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--ink-3)' }}>
              Composição indisponível.
            </div>
          )}
        </div>

        {/* Right stats sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          {/* Party representation bars */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '24px 28px', flex: 1
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>
              Bancadas Partidárias
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {camaraPartidos.slice(0, 5).map((p) => {
                const pct = Math.round((p.qtd / totalCadeiras) * 100)
                return (
                  <div key={p.sigla}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                      <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', fontWeight: 600 }}>{p.sigla}</span>
                      <span style={{ color: 'var(--ink-3)' }}>{p.qtd} {p.qtd === 1 ? 'assento' : 'assentos'} · {pct}%</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: p.cor, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
              {camaraPartidos.length > 5 && (
                <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right', margin: 0 }}>
                  +{camaraPartidos.length - 5} outros partidos na câmara
                </p>
              )}
            </div>
          </div>

          {/* Gender breakdown */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '20px 24px'
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
              REPRESENTAÇÃO DE GÊNERO
            </span>
            <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 10, gap: 1 }}>
              <div style={{ width: `${(feminino / totalCadeiras) * 100}%`, background: '#ec4899', minWidth: feminino > 0 ? 2 : 0 }} />
              <div style={{ flex: 1, background: '#6366F1' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', display: 'inline-block' }} />
                <span style={{ color: 'var(--ink-2)' }}>Mulheres <strong>{feminino}</strong></span>
                <span style={{ color: 'var(--ink-3)' }}>({Math.round((feminino / totalCadeiras) * 100)}%)</span>
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
                <span style={{ color: 'var(--ink-2)' }}>Homens <strong>{masculino}</strong></span>
                <span style={{ color: 'var(--ink-3)' }}>({Math.round((masculino / totalCadeiras) * 100)}%)</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Search and filter client-side list of vereadores */}
      <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '0 0 20px', fontFamily: 'var(--font-display)' }}>
        Vereadores da Cidade
      </h2>
      
      <CamaraClient
        vereadores={vereadores}
        sigla={sigla}
        slugCidade={slug_cidade}
        cor={cor}
        partidos={camaraPartidos}
      />
    </div>
  )
}
