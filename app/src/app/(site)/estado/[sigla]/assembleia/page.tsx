import { Pool } from 'pg'
import { getEstado, ESTADOS } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export const revalidate = 86400

// ─── Pool singleton ──────────────────────────────────────────────────────────
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5, idleTimeoutMillis: 30_000,
  })
  return _pool
}

// ─── Bandeiras ───────────────────────────────────────────────────────────────
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

// ─── Partido cores ────────────────────────────────────────────────────────────
const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#f59e0b', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', PC: '#dc2626',
  'PC DO B': '#dc2626', PSOL: '#ec4899', REDE: '#10b981',
  PMB: '#10b981', DC: '#64748b', AGIR: '#0891b2',
}

// ─── Nomes das ALEs por sigla ─────────────────────────────────────────────────
const ALE_NOME: Record<string, string> = {
  AC: 'Assembleia Legislativa do Acre', AL: 'Assembleia Legislativa de Alagoas',
  AM: 'Assembleia Legislativa do Amazonas', AP: 'Assembleia Legislativa do Amapá',
  BA: 'Assembleia Legislativa da Bahia', CE: 'Assembleia Legislativa do Ceará',
  DF: 'Câmara Legislativa do Distrito Federal',
  ES: 'Assembleia Legislativa do Espírito Santo',
  GO: 'Assembleia Legislativa de Goiás',
  MA: 'Assembleia Legislativa do Maranhão',
  MG: 'Assembleia Legislativa de Minas Gerais',
  MS: 'Assembleia Legislativa do Mato Grosso do Sul',
  MT: 'Assembleia Legislativa de Mato Grosso',
  PA: 'Assembleia Legislativa do Pará',
  PB: 'Assembleia Legislativa da Paraíba',
  PE: 'Assembleia Legislativa de Pernambuco',
  PI: 'Assembleia Legislativa do Piauí',
  PR: 'Assembleia Legislativa do Paraná',
  RJ: 'Assembleia Legislativa do Rio de Janeiro',
  RN: 'Assembleia Legislativa do Rio Grande do Norte',
  RO: 'Assembleia Legislativa de Rondônia',
  RR: 'Assembleia Legislativa de Roraima',
  RS: 'Assembleia Legislativa do Rio Grande do Sul',
  SC: 'Assembleia Legislativa de Santa Catarina',
  SE: 'Assembleia Legislativa de Sergipe',
  SP: 'Assembleia Legislativa do Estado de São Paulo',
  TO: 'Assembleia Legislativa do Tocantins',
}

// ─── Hemiciclo dot computation ────────────────────────────────────────────────
type HemiDot = { cx: number; cy: number; color: string; sigla: string }

function computeHemicicloDots(
  partidos: Array<{ sigla: string; qtd: number; cor: string }>,
  total: number
): HemiDot[] {
  // Row configs: [{ r, fraction }] inner→outer
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

  // Flatten seats in party order (left party first = outermost arc left)
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

  // Ordenar por ângulo decrescente (do mais à esquerda: Math.PI ao mais à direita: 0)
  coords.sort((a, b) => b.angle - a.angle)

  return coords.map((c, i) => ({
    cx: c.cx,
    cy: c.cy,
    color: seats[i]?.color ?? '#94a3b8',
    sigla: seats[i]?.sigla ?? 'Outros',
  }))
}

// ─── Static params ────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string }> }
): Promise<Metadata> {
  const { sigla } = await params
  const cfg = getEstado(sigla)
  if (!cfg) return { title: 'Assembleia não encontrada' }
  const aleName = ALE_NOME[sigla.toUpperCase()] ?? `Assembleia Legislativa de ${cfg.nome}`
  return {
    title: `${aleName} | Meus Políticos`,
    description: `Composição, deputados e dados da ${aleName}. Transparência política em tempo real.`,
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DeputadoRow = {
  id: string
  slug: string
  nome_eleitoral: string
  foto_url: string | null
  sexo: string | null
  partido: string | null
  mandato_inicio: string | null
  mandato_fim: string | null
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function AssembleiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ sigla: string }>
  searchParams: Promise<{ partido?: string }>
}) {
  const { sigla } = await params
  const { partido: partidoFiltro } = await searchParams
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPool()
  const aleName = ALE_NOME[siglaUp] ?? `Assembleia Legislativa de ${cfg.nome}`
  const bandeira = BANDEIRAS[siglaUp]
  const cor = cfg.cor

  // ─── Fetch all deputados estaduais ────────────────────────────────────────
  const [deputadosResult, partidos27Result] = await Promise.all([
    pool.query<DeputadoRow>(
      `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, p.sexo,
              pt.sigla AS partido, p.mandato_inicio, p.mandato_fim
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_estadual' AND p.uf = $1 AND p.removido_em IS NULL
       ORDER BY pt.sigla, p.nome_eleitoral`,
      [siglaUp]
    ),
    // Lista de partidos únicos para o filtro
    pool.query<{ partido: string; total: string }>(
      `SELECT pt.sigla AS partido, COUNT(*) AS total
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_estadual' AND p.uf = $1 AND p.removido_em IS NULL
       GROUP BY pt.sigla ORDER BY COUNT(*) DESC`,
      [siglaUp]
    ),
  ])

  const todosDeputados = deputadosResult.rows
  const partidoStats = partidos27Result.rows

  // ─── Composição por partido ───────────────────────────────────────────────
  const alePartidos = partidoStats.map((p) => ({
    sigla: p.partido ?? 'Outros',
    qtd: Number(p.total),
    cor: PARTIDO_COR[p.partido ?? ''] ?? '#94a3b8',
  }))
  const total = todosDeputados.length || cfg.depu_estaduais

  // ─── Hemiciclo dots ───────────────────────────────────────────────────────
  const dots = alePartidos.length > 0 ? computeHemicicloDots(alePartidos, total) : []

  // ─── Gênero breakdown ─────────────────────────────────────────────────────
  const feminino = todosDeputados.filter((d) => d.sexo === 'F').length
  const masculino = todosDeputados.filter((d) => d.sexo === 'M').length

  // ─── Filtro por partido ───────────────────────────────────────────────────
  const deputadosFiltrados = partidoFiltro
    ? todosDeputados.filter((d) => d.partido === partidoFiltro)
    : todosDeputados

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dep-card { transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s; }
        .dep-card:hover { border-color: var(--brand); box-shadow: 0 8px 24px rgba(0,0,0,0.20); transform: translateY(-2px); }
        .dep-avatar { transition: transform 0.3s; }
        .dep-card:hover .dep-avatar { transform: scale(1.05); }
        .hemi-dot { transition: r 0.15s; cursor: pointer; }
        .hemi-dot:hover { filter: drop-shadow(0 0 4px currentColor); }
        .partido-bar-fill { transition: width 0.6s ease; }
        .filter-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .filter-btn:hover { background: var(--line); color: var(--ink); }
      ` }} />

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <section style={{ padding: '12px 32px 0', maxWidth: 1280, margin: '0 auto' }}>
        <div style={{
          position: 'relative', height: 360,
          borderRadius: 16, overflow: 'hidden',
          background: `linear-gradient(135deg, ${cor} 0%, ${cor}cc 40%, #0F172A 100%)`,
        }}>
          {/* Bandeira como marca d'água */}
          {bandeira && (
            <img src={bandeira} alt="" aria-hidden style={{
              position: 'absolute', right: -60, top: -40,
              height: '130%', opacity: 0.1,
              pointerEvents: 'none',
            }} />
          )}

          {/* Overlay gradiente bottom */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
          }} />

          {/* Conteúdo */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
            padding: '40px 48px',
          }}>
            {/* Breadcrumb */}
            <div style={{ marginBottom: 12, fontSize: 12, color: 'rgba(255,255,255,0.6)', display: 'flex', gap: 6 }}>
              <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Início</Link>
              <span>/</span>
              <Link href="/estado" style={{ color: 'inherit', textDecoration: 'none' }}>Estados</Link>
              <span>/</span>
              <Link href={`/estado/${sigla}`} style={{ color: 'inherit', textDecoration: 'none' }}>{cfg.nome}</Link>
              <span>/</span>
              <span style={{ color: 'rgba(255,255,255,0.9)' }}>Assembleia</span>
            </div>

            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.2em',
              color: 'rgba(255,255,255,0.7)', marginBottom: 8,
            }}>
              ESTADO DE {cfg.nome.toUpperCase()}
            </span>
            <h1 style={{
              color: 'white', margin: '0 0 20px',
              fontSize: 'clamp(26px, 3.5vw, 48px)',
              fontWeight: 800, lineHeight: 1.1,
              fontFamily: 'var(--font-display)',
              letterSpacing: '-0.02em',
              maxWidth: 700,
            }}>
              {aleName}
            </h1>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white', padding: '6px 14px', borderRadius: 999,
                fontSize: 13, fontWeight: 600,
              }}>
                🏛️ {total} Deputados Estaduais
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'white', padding: '6px 14px', borderRadius: 999,
                fontSize: 13, fontWeight: 600,
              }}>
                🗳️ {alePartidos.length} Partidos · Leg. 2023–2026
              </span>
            </div>
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px' }}>

        {/* ── KPI GRID ──────────────────────────────────────────────── */}
        <section style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: 20, marginTop: 40,
        }}>
          {/* Card 1: Total deputados */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', margin: '0 0 6px' }}>
                DEPUTADOS ATUAIS
              </p>
              <h3 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {total} <span style={{ fontSize: 14, fontWeight: 400, color: 'var(--ink-3)' }}>Titulares</span>
              </h3>
            </div>
            <div style={{
              background: 'var(--bg)', padding: 12, borderRadius: '50%',
              width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              👥
            </div>
          </div>

          {/* Card 2: Partidos e gênero */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', margin: '0 0 6px' }}>
                COMPOSIÇÃO
              </p>
              <h3 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                {alePartidos.length} Partidos
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>
                {feminino} mulheres · {masculino} homens
              </p>
            </div>
            <div style={{
              background: 'var(--bg)', padding: 12, borderRadius: '50%',
              width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              🏛️
            </div>
          </div>

          {/* Card 3: Mandato */}
          <div style={{
            background: 'var(--panel)', border: `1px solid var(--line)`,
            borderLeft: `4px solid ${cor}`,
            borderRadius: 14, padding: '20px 24px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', margin: '0 0 6px' }}>
                LEGISLATURA
              </p>
              <h3 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1 }}>
                2023–2026
              </h3>
              <p style={{ margin: 0, fontSize: 12, color: cor, fontWeight: 600 }}>
                Em exercício
              </p>
            </div>
            <div style={{
              background: 'var(--bg)', padding: 12, borderRadius: '50%',
              width: 52, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24, flexShrink: 0,
            }}>
              🗓️
            </div>
          </div>
        </section>

        {/* ── BENTO: HEMICICLO + STATS ───────────────────────────────── */}
        <section style={{
          display: 'grid', gridTemplateColumns: '7fr 5fr',
          gap: 20, marginTop: 40,
        }}>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '28px 32px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
              <div>
                <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                  Composição do Hemiciclo
                </h2>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                  Distribuição das {total} cadeiras por partido — legislatura 2023–2026
                </p>
              </div>
            </div>

            {dots.length > 0 ? (
              <>
                {/* SVG hemiciclo */}
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
                  <svg viewBox="0 0 400 200" style={{ width: '100%', maxWidth: 480 }}>
                    {/* Arco base */}
                    <path
                       d="M 50 196 Q 200 10 350 196"
                       fill="none" stroke="var(--line)"
                       strokeWidth="1" strokeDasharray="4,4"
                    />
                    {/* Dots */}
                    {dots.map((dot, i) => (
                      <circle
                        key={i}
                        className="hemi-dot"
                        cx={dot.cx}
                        cy={dot.cy}
                        r={total > 70 ? 4.5 : total > 40 ? 5 : 6}
                        fill={dot.color}
                      >
                        <title>{dot.sigla}</title>
                      </circle>
                    ))}
                    {/* Centro: total */}
                    <text x="200" y="190" textAnchor="middle"
                      fontSize="18" fontWeight="800" fill="var(--ink)"
                      fontFamily="var(--font-mono)">
                      {total}
                    </text>
                    <text x="200" y="200" textAnchor="middle"
                      fontSize="8" fill="var(--ink-3)" fontFamily="var(--font-mono)">
                      CADEIRAS
                    </text>
                  </svg>
                </div>

                {/* Legenda de partidos */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
                  {alePartidos.map((p) => (
                    <div key={p.sigla} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: p.cor, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
                        {p.sigla} <span style={{ color: 'var(--ink-3)' }}>{p.qtd}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13 }}>
                Dados de composição indisponíveis.
              </div>
            )}
          </div>

          {/* Sidebar direita: barras + stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Barras por partido */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '24px 28px', flex: 1,
            }}>
              <h2 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                Distribuição por Partido
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {alePartidos.slice(0, 10).map((p) => {
                  const pct = Math.round((p.qtd / total) * 100)
                  return (
                    <div key={p.sigla}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', fontWeight: 600 }}>{p.sigla}</span>
                        <span style={{ color: 'var(--ink-3)' }}>{p.qtd} dep. · {pct}%</span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                        <div className="partido-bar-fill"
                          style={{ width: `${pct}%`, height: '100%', background: p.cor, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
                {alePartidos.length > 10 && (
                  <p style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'right', margin: 0 }}>
                    +{alePartidos.length - 10} partidos com 1 dep. cada
                  </p>
                )}
              </div>
            </div>

            {/* Stats de gênero */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '20px 24px',
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', margin: '0 0 12px' }}>
                REPRESENTAÇÃO POR GÊNERO
              </p>
              {/* Barra segmentada */}
              <div style={{ display: 'flex', height: 10, borderRadius: 99, overflow: 'hidden', marginBottom: 10, gap: 1 }}>
                <div style={{ width: `${(feminino / total) * 100}%`, background: '#ec4899', minWidth: feminino > 0 ? 2 : 0 }} />
                <div style={{ flex: 1, background: '#6366F1' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ec4899', display: 'inline-block' }} />
                  <span style={{ color: 'var(--ink-2)' }}>Mulheres <strong>{feminino}</strong></span>
                  <span style={{ color: 'var(--ink-3)' }}>({Math.round((feminino / total) * 100)}%)</span>
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', display: 'inline-block' }} />
                  <span style={{ color: 'var(--ink-2)' }}>Homens <strong>{masculino}</strong></span>
                  <span style={{ color: 'var(--ink-3)' }}>({Math.round((masculino / total) * 100)}%)</span>
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── DEPUTADOS GRID ────────────────────────────────────────── */}
        <section style={{ marginTop: 48 }}>
          {/* Header + filtro */}
          <div style={{
            display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
            marginBottom: 24, flexWrap: 'wrap', gap: 16,
          }}>
            <div>
              <h2 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                Deputados Estaduais
              </h2>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)' }}>
                {partidoFiltro
                  ? `${deputadosFiltrados.length} deputado${deputadosFiltrados.length !== 1 ? 's' : ''} do ${partidoFiltro}`
                  : `Acompanhe os ${total} parlamentares da legislatura 2023–2026`
                }
              </p>
            </div>

            {/* Filtro por partido (server-side via URL param) */}
            <form method="GET" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link href={`/estado/${sigla}/assembleia`}
                className="filter-btn"
                style={{
                  padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                  border: !partidoFiltro ? `1px solid ${cor}` : '1px solid var(--line)', textDecoration: 'none',
                  background: !partidoFiltro ? `${cor}22` : 'var(--panel)',
                  color: !partidoFiltro ? cor : 'var(--ink-2)',
                }}>
                Todos
              </Link>
              {alePartidos.slice(0, 8).map((p) => (
                <Link
                  key={p.sigla}
                  href={`/estado/${sigla}/assembleia?partido=${p.sigla}`}
                  className="filter-btn"
                  style={{
                    padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
                    border: `1px solid ${partidoFiltro === p.sigla ? p.cor : 'var(--line)'}`,
                    textDecoration: 'none',
                    background: partidoFiltro === p.sigla ? `${p.cor}22` : 'var(--panel)',
                    color: partidoFiltro === p.sigla ? p.cor : 'var(--ink-2)',
                  }}>
                  {p.sigla} <span style={{ opacity: 0.7, fontSize: 11 }}>{p.qtd}</span>
                </Link>
              ))}
            </form>
          </div>

          {/* Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 16,
          }}>
            {deputadosFiltrados.map((dep) => {
              const pCor = PARTIDO_COR[dep.partido ?? ''] ?? '#94a3b8'
              const inicial = dep.nome_eleitoral.charAt(0)
              return (
                <Link key={dep.id} href={`/estado/${sigla.toLowerCase()}/assembleia/${dep.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="dep-card" style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 14, overflow: 'hidden',
                  }}>
                    {/* Header colorido com avatar */}
                    <div style={{
                      height: 100,
                      background: `linear-gradient(135deg, ${pCor}cc 0%, ${pCor}66 100%)`,
                      position: 'relative',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {dep.foto_url ? (
                        <img
                           src={dep.foto_url}
                           alt={dep.nome_eleitoral}
                           className="dep-avatar"
                           style={{
                             width: 72, height: 72, borderRadius: '50%', objectFit: 'cover',
                             border: '3px solid var(--panel)', boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                           }}
                        />
                      ) : (
                        <div className="dep-avatar" style={{
                          width: 72, height: 72, borderRadius: '50%',
                          background: 'var(--panel)', border: '3px solid var(--panel)',
                          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 28, fontWeight: 800, color: pCor,
                          fontFamily: 'var(--font-display)',
                        }}>
                          {inicial}
                        </div>
                      )}
                      {/* Party badge */}
                      <div style={{
                        position: 'absolute', bottom: 8, right: 10,
                        background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
                        color: 'white', fontSize: 10, fontWeight: 800,
                        padding: '2px 8px', borderRadius: 999,
                        fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                      }}>
                        {dep.partido ?? '—'}
                      </div>
                      {/* Gênero badge */}
                      {dep.sexo === 'F' && (
                        <div style={{
                          position: 'absolute', top: 8, left: 10,
                          background: '#ec489988', backdropFilter: 'blur(4px)',
                          color: 'white', fontSize: 10, fontWeight: 700,
                          padding: '1px 7px', borderRadius: 999,
                        }}>
                          ♀
                        </div>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: '14px 16px' }}>
                      <h4 style={{
                        margin: '0 0 8px', fontSize: 13, fontWeight: 700,
                        color: '#F8FAFC', lineHeight: 1.3,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {dep.nome_eleitoral}
                      </h4>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                        Mandato 2023–2026
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>

          {deputadosFiltrados.length === 0 && (
            <div style={{
              padding: '48px', textAlign: 'center',
              border: '1px dashed var(--line)', borderRadius: 12,
              color: 'var(--ink-3)', fontSize: 14,
            }}>
              Nenhum deputado encontrado para este filtro.
            </div>
          )}
        </section>

        {/* ── CTA TRANSPARÊNCIA ─────────────────────────────────────── */}
        <section style={{ marginTop: 48, marginBottom: 64 }}>
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)', color: 'var(--ink)',
            borderRadius: 16, padding: '48px',
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 32,
          }}>
            <div style={{ maxWidth: 560 }}>
              <h2 style={{ margin: '0 0 12px', fontSize: 28, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
                Transparência em tempo real
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                Dados de gastos, votações e presença dos deputados estaduais de {cfg.nome}.
                Em breve, acompanhe em tempo real via Portal da Transparência e TSE.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href={`/estado/${sigla}`} style={{
                background: 'var(--bg)', border: '1px solid var(--line)', color: 'var(--ink)',
                padding: '12px 28px', borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                ← Voltar ao Estado
              </Link>
              <Link href="/busca" style={{
                background: 'var(--brand)', color: 'white',
                padding: '12px 28px', borderRadius: 10,
                fontWeight: 700, fontSize: 14, textDecoration: 'none',
              }}>
                Buscar Políticos
              </Link>
            </div>
          </div>
        </section>

        {/* ── DISCLAIMER ────────────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'var(--panel)', padding: '8px 18px', borderRadius: 999,
            fontSize: 12, color: 'var(--ink-3)',
          }}>
            ℹ️ Fonte: <strong style={{ color: 'var(--ink-2)' }}>TSE — Eleitos 2022</strong>.
            Dados atualizados periodicamente.
          </div>
        </div>

      </div>
    </>
  )
}
