import { Pool } from 'pg'
import { getEstado, ESTADOS } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { EstadoAnchorNav } from '@/components/site/EstadoAnchorNav'

export const revalidate = 86400

// ─── Postgres Pool singleton (para queries com JOIN sem FK constraint) ────────
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5433),
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5, idleTimeoutMillis: 30_000,
  })
  return _pool
}

// ─── Static params ──────────────────────────────────────────────────────────
export function generateStaticParams() {
  return Object.keys(ESTADOS).map((s) => ({ sigla: s.toLowerCase() }))
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string }> }
): Promise<Metadata> {
  const { sigla } = await params
  const cfg = getEstado(sigla)
  if (!cfg) return { title: 'Estado não encontrado' }
  return {
    title: `${cfg.nome} — Inteligência Política | Meus Políticos`,
    description: `Governança, economia, pacto federativo, bancada e transparência de ${cfg.nome}. Dados do IBGE, STN e TSE.`,
    openGraph: {
      title: `${cfg.nome} — Painel Político`,
      description: `PIB, IDH, emendas, bancada federal e governador de ${cfg.nome}.`,
      type: 'website',
    },
  }
}

// ─── Bandeiras (Wikipedia SVG) ───────────────────────────────────────────────
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
  MS: 'https://upload.wikimedia.org/wikipedia/commons/6/64/Bandeira_do_Mato_Grosso_do_Sul.svg',
  MT: 'https://upload.wikimedia.org/wikipedia/commons/0/0b/Bandeira_de_Mato_Grosso.svg',
  PA: 'https://upload.wikimedia.org/wikipedia/commons/0/02/Bandeira_do_Par%C3%A1.svg',
  PB: 'https://upload.wikimedia.org/wikipedia/commons/b/bb/Bandeira_da_Para%C3%ADba.svg',
  PE: 'https://upload.wikimedia.org/wikipedia/commons/5/59/Bandeira_de_Pernambuco.svg',
  PI: 'https://upload.wikimedia.org/wikipedia/commons/3/33/Bandeira_do_Piau%C3%AD.svg',
  PR: 'https://upload.wikimedia.org/wikipedia/commons/9/93/Bandeira_do_Paran%C3%A1.svg',
  RJ: 'https://upload.wikimedia.org/wikipedia/commons/7/73/Bandeira_do_estado_do_Rio_de_Janeiro.svg',
  RN: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/Bandeira_do_Rio_Grande_do_Norte.svg',
  RO: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Bandeira_de_Rond%C3%B4nia.svg',
  RR: 'https://upload.wikimedia.org/wikipedia/commons/9/9f/Bandeira_de_Roraima.svg',
  RS: 'https://upload.wikimedia.org/wikipedia/commons/6/63/Bandeira_do_Rio_Grande_do_Sul.svg',
  SC: 'https://upload.wikimedia.org/wikipedia/commons/1/1a/Bandeira_de_Santa_Catarina.svg',
  SE: 'https://upload.wikimedia.org/wikipedia/commons/b/be/Bandeira_de_Sergipe.svg',
  SP: 'https://upload.wikimedia.org/wikipedia/commons/2/2b/Bandeira_do_estado_de_S%C3%A3o_Paulo.svg',
  TO: 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Bandeira_do_Tocantins.svg',
}

// ─── Types ───────────────────────────────────────────────────────────────────
type GovernadorRow = {
  nome_governador: string
  partido_sigla: string | null
  mandato_inicio: string
  mandato_fim: string | null
  foto_url: string | null
  situacao: string | null
}

type EconomiaRow = {
  pib_total_mi: number | null
  pib_per_capita: number | null
  pib_variacao_pct: number | null
  pib_agro_pct: number | null
  pib_industria_pct: number | null
  pib_servicos_pct: number | null
  populacao: number | null
  idh: number | null
  idh_ranking_nacional: number | null
  ranking_pib_nacional: number | null
  arrecadacao_icms_mi: number | null
  desemprego_pct: number | null
  gini: number | null
}

type PactoRow = {
  fpe_mi: number
  sus_mi: number
  fundeb_mi: number
  total_recebido_mi: number
  ir_arrecadado_mi: number
  ipi_arrecadado_mi: number
  previdencia_mi: number
  total_enviado_mi: number
  saldo_federativo_mi: number
  tipo: 'doador' | 'receptor'
}

type TribunalRow = {
  tipo: string
  nome_completo: string
  presidente: string | null
  sede: string | null
  site_oficial: string | null
}

type PoliticoRow = {
  id: string
  slug: string
  nome_eleitoral: string
  foto_url: string | null
  cargo: string
  partidos: { sigla: string } | null
}

type TimelineRow = {
  ano: number
  mes: number | null
  titulo: string
  descricao: string | null
  tipo: string | null
  impacto: string | null
}

type AleRow = {
  total_deputados: number | null
  presidente_nome: string | null
  presidente_partido: string | null
  site_oficial: string | null
  legislatura: number
}

type MunicipioRow = {
  codigo_ibge: number
  nome: string
  populacao: number | null
}

type EmendaMunRow = {
  municipio_ibge: string | null
  municipio_nome: string | null
  total_pago: number
  qtd_emendas: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMi(v: number | null | undefined): string {
  if (v == null) return '—'
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}tri`
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}bi`
  return `R$ ${v.toFixed(0)}mi`
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR')
}

function fmtPop(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}mi`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

// ─── Hemiciclo (server-side SVG arc computation) ─────────────────────────────
function computeHemicycleArcs(
  partidos: Array<{ sigla: string; qtd: number; cor: string }>,
  total: number
): Array<{ d: string; color: string; sigla: string; qtd: number }> {
  const cx = 50, cy = 52, r = 38
  let cumulative = 0
  return partidos.filter((p) => p.qtd > 0).map((p) => {
    const a1 = Math.PI - (cumulative / total) * Math.PI
    const a2 = Math.PI - ((cumulative + p.qtd) / total) * Math.PI
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy - r * Math.sin(a1)
    const x2 = cx + r * Math.cos(a2)
    const y2 = cy - r * Math.sin(a2)
    const largeArc = p.qtd / total > 0.5 ? 1 : 0
    cumulative += p.qtd
    return {
      d: `M ${x1.toFixed(2)},${y1.toFixed(2)} A ${r},${r} 0 ${largeArc},1 ${x2.toFixed(2)},${y2.toFixed(2)}`,
      color: p.cor,
      sigla: p.sigla,
      qtd: p.qtd,
    }
  })
}

// ─── Constants ───────────────────────────────────────────────────────────────
const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#d97706', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', DC: '#64748b', PMB: '#10b981',
}

const TIMELINE_TIPO_COR: Record<string, string> = {
  eleicao: '#0051d5',
  escandalo: '#dc2626',
  obra: '#10B981',
  crise: '#D97706',
  reforma: '#7c3aed',
  default: '#64748b',
}

const TRIBUNAL_LABEL: Record<string, string> = {
  tj: 'Tribunal de Justiça', tce: 'Tribunal de Contas',
  mp: 'Ministério Público', dp: 'Defensoria Pública',
  trt: 'Tribunal Regional do Trabalho', tre: 'Tribunal Regional Eleitoral',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function EstadoPage(
  { params }: { params: Promise<{ sigla: string }> }
) {
  const { sigla } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPool()

  // ─── Parallel data fetching ─────────────────────────────────────────────
  const [
    govRes, econRes, pactoRes, tribunaisRes,
    depFedRows, senadoresRows, depEstRows,
    municipiosRes, emendasMunRes, timelineRes, aleRes,
  ] = await Promise.all([
    pool.query<GovernadorRow>(
      `SELECT nome_governador, partido_sigla, mandato_inicio::text AS mandato_inicio,
              mandato_fim::text AS mandato_fim, foto_url, situacao
       FROM estados_governos
       WHERE sigla = $1 AND is_atual = true
       LIMIT 1`,
      [siglaUp]
    ),

    pool.query<EconomiaRow>(
      `SELECT pib_total_mi::float8 AS pib_total_mi,
              pib_per_capita::float8 AS pib_per_capita,
              pib_variacao_pct::float8 AS pib_variacao_pct,
              pib_agro_pct::float8 AS pib_agro_pct,
              pib_industria_pct::float8 AS pib_industria_pct,
              pib_servicos_pct::float8 AS pib_servicos_pct,
              populacao,
              idh::float8 AS idh,
              idh_ranking_nacional,
              ranking_pib_nacional,
              arrecadacao_icms_mi::float8 AS arrecadacao_icms_mi,
              desemprego_pct::float8 AS desemprego_pct,
              gini::float8 AS gini
       FROM estados_economia
       WHERE sigla = $1
       ORDER BY ano DESC
       LIMIT 1`,
      [siglaUp]
    ),

    pool.query<PactoRow>(
      `SELECT fpe_mi::float8 AS fpe_mi,
              sus_mi::float8 AS sus_mi,
              fundeb_mi::float8 AS fundeb_mi,
              total_recebido_mi::float8 AS total_recebido_mi,
              ir_arrecadado_mi::float8 AS ir_arrecadado_mi,
              ipi_arrecadado_mi::float8 AS ipi_arrecadado_mi,
              previdencia_mi::float8 AS previdencia_mi,
              total_enviado_mi::float8 AS total_enviado_mi,
              saldo_federativo_mi::float8 AS saldo_federativo_mi,
              tipo
       FROM estados_pacto_federativo
       WHERE sigla = $1
       ORDER BY ano DESC
       LIMIT 1`,
      [siglaUp]
    ),

    pool.query<TribunalRow>(
      `SELECT tipo, nome_completo, presidente, sede, site_oficial
       FROM estados_tribunais
       WHERE sigla = $1
       ORDER BY tipo`,
      [siglaUp]
    ),

    // Postgres direto — politicos JOIN partidos (sem FK constraint, o join direto falha)
    pool.query<{ id: string; slug: string; nome_eleitoral: string; foto_url: string | null; sigla_partido: string | null }>(
      `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, pt.sigla AS sigla_partido
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_federal' AND p.uf = $1 AND p.removido_em IS NULL
       ORDER BY p.nome_eleitoral
       LIMIT 80`,
      [siglaUp]
    ),

    pool.query<{ id: string; slug: string; nome_eleitoral: string; foto_url: string | null; sigla_partido: string | null }>(
      `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, pt.sigla AS sigla_partido
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'senador' AND p.uf = $1 AND p.removido_em IS NULL
       ORDER BY p.nome_eleitoral
       LIMIT 4`,
      [siglaUp]
    ),

    pool.query<{ id: string; nome_eleitoral: string; sigla_partido: string | null }>(
      `SELECT p.id, p.nome_eleitoral, pt.sigla AS sigla_partido
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_estadual' AND p.uf = $1 AND p.removido_em IS NULL
       ORDER BY p.nome_eleitoral
       LIMIT 200`,
      [siglaUp]
    ),

    pool.query<MunicipioRow>(
      `SELECT codigo_ibge, nome, populacao
       FROM municipios
       WHERE uf = $1
       ORDER BY populacao DESC NULLS LAST
       LIMIT 10`,
      [siglaUp]
    ),

    pool.query<EmendaMunRow>(
      `SELECT municipio_ibge, municipio_nome,
              SUM(valor_pago)::float8 AS total_pago,
              COUNT(*)::int AS qtd_emendas
       FROM emendas
       WHERE uf_municipio = $1
         AND municipio_ibge IS NOT NULL
       GROUP BY municipio_ibge, municipio_nome
       ORDER BY SUM(valor_pago) DESC NULLS LAST
       LIMIT 8`,
      [siglaUp]
    ),

    pool.query<TimelineRow>(
      `SELECT ano, mes, titulo, descricao, tipo, impacto
       FROM estados_timeline
       WHERE sigla = $1
       ORDER BY ano DESC
       LIMIT 20`,
      [siglaUp]
    ),

    pool.query<AleRow>(
      `SELECT total_deputados, presidente_nome, presidente_partido, site_oficial, legislatura
       FROM estados_ale
       WHERE sigla = $1
       ORDER BY legislatura DESC
       LIMIT 1`,
      [siglaUp]
    ),
  ])

  // ─── Data extraction ────────────────────────────────────────────────────
  const governador = govRes.rows[0] ?? null
  const economia = econRes.rows[0] ?? null
  const pacto = pactoRes.rows[0] ?? null
  const tribunais = tribunaisRes.rows

  // Postgres rows → formato compatível com o resto do template
  const depFederais: PoliticoRow[] = depFedRows.rows.map((r) => ({
    id: r.id, slug: r.slug, nome_eleitoral: r.nome_eleitoral,
    foto_url: r.foto_url, cargo: 'deputado_federal',
    partidos: r.sigla_partido ? { sigla: r.sigla_partido } : null,
  }))
  const senadores: PoliticoRow[] = senadoresRows.rows.map((r) => ({
    id: r.id, slug: r.slug, nome_eleitoral: r.nome_eleitoral,
    foto_url: r.foto_url, cargo: 'senador',
    partidos: r.sigla_partido ? { sigla: r.sigla_partido } : null,
  }))
  const depEstaduais = depEstRows.rows.map((r) => ({
    id: r.id, nome_eleitoral: r.nome_eleitoral,
    partidos: r.sigla_partido ? { sigla: r.sigla_partido } : null,
  }))

  const municipios = municipiosRes.rows
  const emendasMun = emendasMunRes.rows
  const timeline = timelineRes.rows
  const ale = aleRes.rows[0] ?? null

  // ─── ALE party composition ──────────────────────────────────────────────
  const alePartyMap = new Map<string, number>()
  depEstaduais.forEach((d) => {
    const sp = d.partidos?.sigla ?? 'Outros'
    alePartyMap.set(sp, (alePartyMap.get(sp) ?? 0) + 1)
  })
  const alePartidos = Array.from(alePartyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([s, qtd]) => ({ sigla: s, qtd, cor: PARTIDO_COR[s] ?? '#94a3b8' }))
  const aleTotalParlamentares = depEstaduais.length || ale?.total_deputados || cfg.depu_estaduais

  // ─── Bancada federal party grouping ────────────────────────────────────
  const bancadaPartyMap = new Map<string, number>()
  depFederais.forEach((d) => {
    const sp = d.partidos?.sigla ?? 'Outros'
    bancadaPartyMap.set(sp, (bancadaPartyMap.get(sp) ?? 0) + 1)
  })
  const bancadaPartidos = Array.from(bancadaPartyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([s, qtd]) => ({ sigla: s, qtd, cor: PARTIDO_COR[s] ?? '#94a3b8' }))

  // ─── Derived values ─────────────────────────────────────────────────────
  const cor = cfg.cor
  const bandeira = BANDEIRAS[siglaUp]
  const aleArcs = alePartidos.length > 0
    ? computeHemicycleArcs(alePartidos, aleTotalParlamentares)
    : []
  const pactoRetorno = pacto?.total_enviado_mi && pacto.total_enviado_mi > 0
    ? ((pacto.total_recebido_mi / pacto.total_enviado_mi) * 100).toFixed(0)
    : null

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: 'white',
        borderBottom: '1px solid #e5e7eb',
        padding: '40px 32px 36px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: '#9ca3af', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Início</Link>
            <span>/</span>
            <Link href="/estado" style={{ color: 'inherit', textDecoration: 'none' }}>Estados</Link>
            <span>/</span>
            <span style={{ color: '#374151' }}>{cfg.nome}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>

            {/* Esquerda: bandeira + dados */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flex: 1, minWidth: 280 }}>
              {/* Bandeira */}
              <div style={{
                width: 100, height: 70, flexShrink: 0,
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                background: '#f9fafb',
              }}>
                {bandeira ? (
                  <img src={bandeira} alt={`Bandeira de ${cfg.nome}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, color: cor,
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {siglaUp}
                  </div>
                )}
              </div>

              {/* Nome + meta */}
              <div style={{ flex: 1 }}>
                <div style={{
                  display: 'inline-block', fontSize: 11, fontWeight: 700,
                  letterSpacing: '0.08em', color: cor,
                  background: `${cor}18`, borderRadius: 6,
                  padding: '3px 10px', marginBottom: 10,
                  fontFamily: 'var(--font-mono)',
                }}>
                  {cfg.regiao.toUpperCase()}
                </div>
                <h1 style={{
                  fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 800,
                  color: '#111827', margin: '0 0 8px',
                  lineHeight: 1.1, letterSpacing: '-0.02em',
                }}>
                  {cfg.nome}
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280', lineHeight: 1.6 }}>
                  Capital: <strong style={{ color: '#374151' }}>{cfg.capital}</strong>
                  {' · '}{cfg.municipios.toLocaleString('pt-BR')} municípios
                  {cfg.area_km2 ? ` · ${cfg.area_km2.toLocaleString('pt-BR')} km²` : ''}
                </p>
              </div>
            </div>

            {/* Direita: card do governador */}
            {governador && (
              <div style={{
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: 14,
                minWidth: 260, flexShrink: 0,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: '50%', overflow: 'hidden',
                  background: '#e5e7eb', flexShrink: 0,
                  border: '2px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
                }}>
                  {governador.foto_url
                    ? <img src={governador.foto_url} alt={governador.nome_governador}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '👤'
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
                    GOVERNADOR(A)
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#111827', lineHeight: 1.3 }}>
                    {governador.nome_governador}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    {governador.partido_sigla && (
                      <span style={{
                        fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        padding: '1px 7px', borderRadius: 999,
                        background: `${PARTIDO_COR[governador.partido_sigla] ?? '#64748b'}22`,
                        color: PARTIDO_COR[governador.partido_sigla] ?? '#64748b',
                        border: `1px solid ${PARTIDO_COR[governador.partido_sigla] ?? '#64748b'}44`,
                      }}>
                        {governador.partido_sigla}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>
                      {new Date(governador.mandato_inicio).getFullYear()}
                      {governador.mandato_fim ? `–${new Date(governador.mandato_fim).getFullYear()}` : '–hoje'}
                    </span>
                  </div>
                </div>
                <a href={`https://www.${sigla.toLowerCase()}.gov.br`}
                  target="_blank" rel="noopener noreferrer"
                  style={{
                    padding: '6px 10px', borderRadius: 8,
                    background: 'white', border: '1px solid #e5e7eb',
                    fontSize: 11, color: '#6b7280', textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}>
                  🌐 Site
                </a>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── ANCHOR NAV ───────────────────────────────────────────────── */}
      <EstadoAnchorNav cor={cor} />

      {/* ── VISÃO GERAL — KPI GRID ────────────────────────────────────── */}
      <section id="visao-geral" style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: cor }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
              Visão Geral
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#6b7280', paddingLeft: 13 }}>
            Dados estruturais de {cfg.nome} — IBGE e configuração constitucional
          </p>
        </div>

        {/* 4 KPI cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 16, marginBottom: 28,
        }}>
          {[
            {
              label: 'POPULAÇÃO',
              value: economia?.populacao ? fmtPop(economia.populacao) : '—',
              sub: economia?.populacao ? fmtNum(economia.populacao) + ' hab.' : 'IBGE',
              icon: '👥',
            },
            {
              label: 'PIB TOTAL',
              value: economia?.pib_total_mi ? fmtMi(economia.pib_total_mi) : '—',
              sub: economia?.ranking_pib_nacional ? `#${economia.ranking_pib_nacional} no Brasil` : 'IBGE',
              icon: '💰',
            },
            {
              label: 'MUNICÍPIOS',
              value: cfg.municipios.toLocaleString('pt-BR'),
              sub: `Capital: ${cfg.capital}`,
              icon: '🏙️',
            },
            {
              label: 'IDH-M',
              value: economia?.idh ? economia.idh.toFixed(3) : '—',
              sub: economia?.idh_ranking_nacional ? `#${economia.idh_ranking_nacional} no Brasil` : 'PNUD',
              icon: '📊',
            },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{kpi.icon}</div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: '#111827', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: '#9ca3af', fontFamily: 'var(--font-sans)' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Stats secundários */}
        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          padding: '16px 24px',
          background: '#f9fafb', borderRadius: 10,
          border: '1px solid #e5e7eb',
        }}>
          {[
            { label: 'Área', value: `${cfg.area_km2.toLocaleString('pt-BR')} km²` },
            { label: 'Dep. Estaduais', value: String(cfg.depu_estaduais) },
            { label: 'Dep. Federais', value: String(cfg.depu_federais) },
            { label: 'Senadores', value: String(cfg.senadores) },
            { label: 'Fuso', value: cfg.fuso },
            ...(economia?.desemprego_pct != null ? [{ label: 'Desemprego', value: `${economia.desemprego_pct}%` }] : []),
            ...(economia?.gini != null ? [{ label: 'Gini', value: economia.gini.toFixed(3) }] : []),
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '8px 14px', borderRadius: 8,
              background: 'white', border: '1px solid #e5e7eb',
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                {item.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── ASSEMBLEIA LEGISLATIVA ────────────────────────────────────── */}
      <section id="legislativa" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 99, background: cor }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>
                Assembleia Legislativa
              </h2>
            </div>
            <Link href={`/estado/${sigla}/assembleia`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 16px', borderRadius: 8,
              border: `1px solid ${cor}44`,
              background: `${cor}0d`,
              color: cor, textDecoration: 'none',
              fontSize: 13, fontWeight: 600,
              transition: 'background 0.15s',
            }}>
              Ver ALE completa →
            </Link>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#6b7280', paddingLeft: 13 }}>
            {cfg.depu_estaduais} deputados estaduais que votam leis, orçamento e fiscalizam o Executivo
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* Hemiciclo SVG */}
          <div style={{
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '24px 28px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              COMPOSIÇÃO PARTIDÁRIA — ALE
            </div>
            {aleArcs.length > 0 ? (
              <>
                <svg viewBox="0 0 100 56" style={{ width: '100%', maxWidth: 260, display: 'block', margin: '0 auto 16px' }}>
                  {/* Inner arc (thinner base) */}
                  <path d="M 12,52 A 38,38 0 0,1 88,52" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  {/* Party arcs */}
                  {aleArcs.map((arc, i) => (
                    <path key={i} d={arc.d} fill="none" stroke={arc.color} strokeWidth="10" strokeLinecap="butt">
                      <title>{arc.sigla}: {arc.qtd} dep.</title>
                    </path>
                  ))}
                  {/* Center label */}
                  <text x="50" y="49" textAnchor="middle" fontSize="8" fontWeight="700" fill="#374151" fontFamily="monospace">
                    {aleTotalParlamentares}
                  </text>
                  <text x="50" y="55.5" textAnchor="middle" fontSize="4.5" fill="#9ca3af" fontFamily="monospace">
                    DEP.
                  </text>
                </svg>
                {/* Legenda */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                  {alePartidos.slice(0, 8).map((p) => (
                    <div key={p.sigla} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: p.cor, flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: '#374151', fontFamily: 'var(--font-mono)' }}>
                        {p.sigla} <span style={{ color: '#9ca3af' }}>{p.qtd}</span>
                      </span>
                    </div>
                  ))}
                  {alePartidos.length > 8 && (
                    <span style={{ fontSize: 11, color: '#9ca3af' }}>+{alePartidos.length - 8} partidos</span>
                  )}
                </div>
              </>
            ) : (
              <div style={{
                padding: '32px 24px', textAlign: 'center',
                border: '1px dashed #d1d5db', borderRadius: 10,
                color: '#9ca3af', fontSize: 13,
              }}>
                Composição da ALE disponível após ETL de deputados estaduais.
              </div>
            )}
            {ale?.presidente_nome && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6', fontSize: 12, color: '#6b7280' }}>
                <span style={{ color: '#9ca3af' }}>Presidente: </span>
                <strong style={{ color: '#374151' }}>{ale.presidente_nome}</strong>
                {ale.presidente_partido && <span style={{ color: '#9ca3af' }}> · {ale.presidente_partido}</span>}
                {ale.site_oficial && (
                  <>
                    {' · '}
                    <a href={ale.site_oficial} target="_blank" rel="noopener noreferrer"
                      style={{ color: cor, textDecoration: 'none' }}>site oficial</a>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Barras de partido */}
          <div style={{
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '24px 28px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
              DISTRIBUIÇÃO POR PARTIDO
            </div>
            {alePartidos.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {alePartidos.slice(0, 10).map((p) => {
                  const pct = Math.round((p.qtd / aleTotalParlamentares) * 100)
                  return (
                    <div key={p.sigla}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#374151', fontWeight: 600 }}>{p.sigla}</span>
                        <span style={{ color: '#6b7280' }}>{p.qtd} dep. · {pct}%</span>
                      </div>
                      <div style={{ height: 6, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: p.cor, borderRadius: 99, transition: 'width 0.6s ease' }} />
                      </div>
                    </div>
                  )
                })}
                {alePartidos.length > 10 && (
                  <div style={{ fontSize: 11, color: '#9ca3af', textAlign: 'right' }}>
                    +{alePartidos.length - 10} partidos com menos de {Math.round((alePartidos[10]?.qtd ?? 0) / aleTotalParlamentares * 100)}% cada
                  </div>
                )}
              </div>
            ) : (
              <div style={{ padding: '24px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Sem dados de deputados estaduais.
              </div>
            )}
          </div>

        </div>

        {/* Bancada Federal */}
        <div style={{
          background: 'white', border: '1px solid #e5e7eb',
          borderRadius: 12, padding: '24px 28px',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                BANCADA FEDERAL
              </div>
              <div style={{ fontSize: 13, color: '#6b7280' }}>
                {cfg.depu_federais} dep. federais · {cfg.senadores} senadores no Congresso Nacional
              </div>
            </div>
            {bancadaPartidos.length > 0 && (
              <div style={{
                display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 1,
                width: 200, flexShrink: 0,
              }}>
                {bancadaPartidos.map((p) => (
                  <div key={p.sigla}
                    style={{ width: `${(p.qtd / depFederais.length) * 100}%`, background: p.cor }}
                    title={`${p.sigla}: ${p.qtd}`}
                  />
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 6 }}>
            {depFederais.slice(0, 40).map((d) => (
              <Link key={d.id} href={`/p/${d.slug}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7, padding: '6px 8px',
                  borderRadius: 8, background: '#f9fafb', border: '1px solid transparent',
                  transition: 'border-color 0.15s',
                }}>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%', overflow: 'hidden',
                    background: '#e5e7eb', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10,
                  }}>
                    {d.foto_url
                      ? <img src={d.foto_url} alt={d.nome_eleitoral} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : d.nome_eleitoral.charAt(0)
                    }
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 10.5, color: '#374151', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {d.nome_eleitoral}
                    </div>
                    {d.partidos?.sigla && (
                      <div style={{ fontSize: 9.5, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                        {d.partidos.sigla}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
            {depFederais.length > 40 && (
              <div style={{ padding: '6px 8px', fontSize: 11, color: '#9ca3af', display: 'flex', alignItems: 'center' }}>
                +{depFederais.length - 40} mais
              </div>
            )}
          </div>

          {/* Senadores */}
          {senadores.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid #f3f4f6' }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                SENADORES
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {senadores.map((s) => (
                  <Link key={s.id} href={`/p/${s.slug}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 14px', borderRadius: 10,
                      background: '#f9fafb', border: '1px solid #e5e7eb',
                    }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
                        background: '#e5e7eb', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
                      }}>
                        {s.foto_url
                          ? <img src={s.foto_url} alt={s.nome_eleitoral} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : '👤'
                        }
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>{s.nome_eleitoral}</div>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                          Senador · {s.partidos?.sigla ?? '—'}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── ECONOMIA ──────────────────────────────────────────────────── */}
      <section id="economia" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: cor }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Economia</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#6b7280', paddingLeft: 13 }}>
            Indicadores IBGE — PIB, IDH, estrutura produtiva e Pacto Federativo
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>

          {/* PIB setores */}
          <div style={{
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '24px 28px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
              ESTRUTURA DO PIB POR SETOR
            </div>
            {economia && (economia.pib_agro_pct != null || economia.pib_industria_pct != null || economia.pib_servicos_pct != null) ? (
              <>
                {/* Barra segmentada */}
                <div style={{ display: 'flex', height: 14, borderRadius: 8, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
                  {economia.pib_agro_pct != null && economia.pib_agro_pct > 0 && (
                    <div style={{ width: `${economia.pib_agro_pct}%`, background: '#10B981', minWidth: 2 }} title={`Agro: ${economia.pib_agro_pct}%`} />
                  )}
                  {economia.pib_industria_pct != null && economia.pib_industria_pct > 0 && (
                    <div style={{ width: `${economia.pib_industria_pct}%`, background: '#3B82F6', minWidth: 2 }} title={`Indústria: ${economia.pib_industria_pct}%`} />
                  )}
                  {economia.pib_servicos_pct != null && economia.pib_servicos_pct > 0 && (
                    <div style={{ width: `${economia.pib_servicos_pct}%`, background: '#8B5CF6', minWidth: 2 }} title={`Serviços: ${economia.pib_servicos_pct}%`} />
                  )}
                </div>
                {/* Legenda */}
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: 'Agropecuária', color: '#10B981', value: economia.pib_agro_pct },
                    { label: 'Indústria', color: '#3B82F6', value: economia.pib_industria_pct },
                    { label: 'Serviços', color: '#8B5CF6', value: economia.pib_servicos_pct },
                  ].filter((s) => s.value != null).map((s) => (
                    <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, color: '#374151' }}>
                        {s.label} <strong style={{ fontFamily: 'var(--font-mono)' }}>{s.value}%</strong>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Indicadores adicionais */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {economia.pib_per_capita != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>PIB PER CAPITA</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                        R$&nbsp;{economia.pib_per_capita.toLocaleString('pt-BR')}
                      </div>
                    </div>
                  )}
                  {economia.pib_variacao_pct != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>VARIAÇÃO PIB</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: economia.pib_variacao_pct >= 0 ? '#10B981' : '#dc2626' }}>
                        {economia.pib_variacao_pct >= 0 ? '+' : ''}{economia.pib_variacao_pct}%
                      </div>
                    </div>
                  )}
                  {economia.desemprego_pct != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>DESEMPREGO</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#111827', fontFamily: 'var(--font-mono)' }}>
                        {economia.desemprego_pct}%
                      </div>
                    </div>
                  )}
                  {economia.gini != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>GINI</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: economia.gini > 0.55 ? '#dc2626' : economia.gini < 0.45 ? '#10B981' : '#111827' }}>
                        {economia.gini.toFixed(3)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Dados econômicos serão exibidos após ETL do IBGE.
              </div>
            )}
          </div>

          {/* Pacto Federativo */}
          {pacto ? (
            <div style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
                PACTO FEDERATIVO
              </div>

              {/* Tipo doador/receptor */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                <div style={{
                  padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  background: pacto.tipo === 'receptor' ? '#dcfce7' : '#fef9c3',
                  color: pacto.tipo === 'receptor' ? '#15803d' : '#854d0e',
                }}>
                  {pacto.tipo === 'receptor' ? '📥 Estado receptor' : '📤 Estado doador'}
                </div>
                {pactoRetorno && (
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    retorna {pactoRetorno}% do enviado
                  </span>
                )}
              </div>

              {/* Fluxo: Recebe ← → Envia */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: 8, alignItems: 'center', marginBottom: 20 }}>
                {/* Recebe */}
                <div style={{
                  background: '#f0fdf4', border: '1px solid #bbf7d0',
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#16a34a', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>RECEBE DA UNIÃO</div>
                  {[
                    { label: 'FPE', value: pacto.fpe_mi },
                    { label: 'SUS', value: pacto.sus_mi },
                    { label: 'FUNDEB', value: pacto.fundeb_mi },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#166534', fontFamily: 'var(--font-mono)' }}>{item.label}</span>
                      <span style={{ color: '#15803d', fontWeight: 600 }}>{fmtMi(item.value)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #bbf7d0', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#166534', fontWeight: 700 }}>TOTAL</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#15803d', fontFamily: 'var(--font-mono)' }}>
                      {fmtMi(pacto.total_recebido_mi)}
                    </span>
                  </div>
                </div>

                {/* Seta central */}
                <div style={{ textAlign: 'center', fontSize: 18 }}>
                  {pacto.saldo_federativo_mi >= 0 ? '⇆' : '⇄'}
                </div>

                {/* Envia */}
                <div style={{
                  background: '#fff7ed', border: '1px solid #fed7aa',
                  borderRadius: 10, padding: '14px 16px',
                }}>
                  <div style={{ fontSize: 10, letterSpacing: '0.08em', color: '#c2410c', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>ENVIA À UNIÃO</div>
                  {[
                    { label: 'IR arrecadado', value: pacto.ir_arrecadado_mi },
                    { label: 'IPI arrecadado', value: pacto.ipi_arrecadado_mi },
                    { label: 'Previdência', value: pacto.previdencia_mi },
                  ].map((item) => (
                    <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: '#9a3412', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{item.label}</span>
                      <span style={{ color: '#c2410c', fontWeight: 600 }}>{fmtMi(item.value)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 8, paddingTop: 6, borderTop: '1px solid #fed7aa', display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 11, color: '#9a3412', fontWeight: 700 }}>TOTAL</span>
                    <span style={{ fontSize: 13, fontWeight: 800, color: '#c2410c', fontFamily: 'var(--font-mono)' }}>
                      {fmtMi(pacto.total_enviado_mi)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Saldo */}
              <div style={{
                padding: '12px 16px', borderRadius: 8,
                background: pacto.saldo_federativo_mi >= 0 ? '#f0fdf4' : '#fff7ed',
                border: `1px solid ${pacto.saldo_federativo_mi >= 0 ? '#bbf7d0' : '#fed7aa'}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, color: '#6b7280' }}>Saldo federativo</span>
                <span style={{
                  fontSize: 16, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  color: pacto.saldo_federativo_mi >= 0 ? '#15803d' : '#c2410c',
                }}>
                  {pacto.saldo_federativo_mi >= 0 ? '+' : ''}{fmtMi(pacto.saldo_federativo_mi)}
                </span>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'white', border: '1px dashed #d1d5db',
              borderRadius: 12, padding: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: '#9ca3af', fontSize: 13, textAlign: 'center',
            }}>
              Dados do Pacto Federativo disponíveis após ETL da STN.
            </div>
          )}

          {/* Emendas municipais */}
          {emendasMun.length > 0 && (
            <div style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                MUNICÍPIOS COM MAIS EMENDAS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {emendasMun.map((em, i) => {
                  const maxPago = emendasMun[0]?.total_pago ?? 1
                  const pct = Math.round((em.total_pago / maxPago) * 100)
                  return (
                    <div key={em.municipio_ibge ?? i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: '#374151' }}>{em.municipio_nome ?? em.municipio_ibge}</span>
                        <span style={{ color: '#6b7280', fontFamily: 'var(--font-mono)' }}>{fmtMi(em.total_pago)}</span>
                      </div>
                      <div style={{ height: 5, background: '#f3f4f6', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 99 }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Municípios */}
          {municipios.length > 0 && (
            <div style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                MAIORES MUNICÍPIOS (POPULAÇÃO)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {municipios.map((m, i) => (
                  <div key={m.codigo_ibge} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: i < municipios.length - 1 ? '1px solid #f9fafb' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)', width: 18, textAlign: 'right', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: '#374151', fontWeight: 500 }}>{m.nome}</span>
                    <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'var(--font-mono)' }}>
                      {m.populacao != null ? fmtNum(m.populacao) : '—'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </section>

      {/* ── TIMELINE ──────────────────────────────────────────────────── */}
      <section id="timeline" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: cor }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#111827' }}>Linha do Tempo</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: '#6b7280', paddingLeft: 13 }}>
            Eventos históricos, eleições, crises e marcos políticos de {cfg.nome}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)', gap: 24, alignItems: 'start' }}>

          {/* Zigzag timeline */}
          <div style={{
            background: 'white', border: '1px solid #e5e7eb',
            borderRadius: 12, padding: '28px 32px',
          }}>
            {timeline.length > 0 ? (
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* Linha vertical */}
                <div style={{
                  position: 'absolute', left: 9, top: 6, bottom: 6,
                  width: 2, background: '#f3f4f6', borderRadius: 99,
                }} />

                {timeline.map((ev, i) => {
                  const tipoCor = TIMELINE_TIPO_COR[ev.tipo ?? ''] ?? TIMELINE_TIPO_COR.default
                  return (
                    <div key={i} style={{
                      position: 'relative',
                      marginBottom: i < timeline.length - 1 ? 28 : 0,
                    }}>
                      {/* Dot */}
                      <div style={{
                        position: 'absolute', left: -28 + 3, top: 5,
                        width: 14, height: 14, borderRadius: '50%',
                        background: tipoCor,
                        border: '2px solid white',
                        boxShadow: `0 0 0 2px ${tipoCor}55`,
                        flexShrink: 0,
                      }} />

                      {/* Content */}
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)', color: tipoCor, marginBottom: 3 }}>
                        {ev.ano}{ev.mes ? `/${String(ev.mes).padStart(2, '0')}` : ''}
                        {ev.tipo && (
                          <span style={{
                            marginLeft: 8, fontSize: 10,
                            background: `${tipoCor}18`, color: tipoCor,
                            padding: '1px 6px', borderRadius: 999,
                          }}>
                            {ev.tipo}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', lineHeight: 1.4, marginBottom: ev.descricao ? 4 : 0 }}>
                        {ev.titulo}
                      </div>
                      {ev.descricao && (
                        <div style={{ fontSize: 12.5, color: '#6b7280', lineHeight: 1.6 }}>
                          {ev.descricao}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '40px 0', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
                Nenhum evento registrado ainda para {cfg.nome}.
              </div>
            )}
          </div>

          {/* Sidebar direita */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Card tribunais */}
            {tribunais.length > 0 && (
              <div style={{
                background: 'white', border: '1px solid #e5e7eb',
                borderRadius: 12, padding: '20px 24px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                  CONTROLE E INSTITUIÇÕES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tribunais.map((t) => (
                    <div key={t.tipo} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#374151' }}>
                        {TRIBUNAL_LABEL[t.tipo] ?? t.tipo}
                      </div>
                      {t.presidente && (
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Pres.: {t.presidente}</div>
                      )}
                      {t.site_oficial && (
                        <a href={t.site_oficial} target="_blank" rel="noopener noreferrer"
                          style={{ fontSize: 11, color: cor, textDecoration: 'none' }}>
                          🔗 Site oficial
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Card sobre a linha do tempo */}
            <div style={{
              background: `${cor}0d`, border: `1px solid ${cor}33`,
              borderRadius: 12, padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: cor, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                SOBRE {cfg.nome.toUpperCase()}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: '#374151', lineHeight: 1.7 }}>
                {cfg.gentilico ? `Os ${cfg.gentilico}s compõem ` : ''}
                Estado da região {cfg.regiao}, com capital em <strong>{cfg.capital}</strong>.
                {cfg.municipios && ` São ${cfg.municipios.toLocaleString('pt-BR')} municípios`}
                {cfg.area_km2 ? ` em ${cfg.area_km2.toLocaleString('pt-BR')} km².` : '.'}
              </p>
            </div>

            {/* Links úteis */}
            <div style={{
              background: 'white', border: '1px solid #e5e7eb',
              borderRadius: 12, padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                LINKS ÚTEIS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: `Governo de ${cfg.nome}`, href: `https://www.${sigla.toLowerCase()}.gov.br` },
                  { label: 'TSE — Eleições', href: 'https://www.tse.jus.br' },
                  { label: 'IBGE — Cidades', href: `https://cidades.ibge.gov.br/brasil/${sigla.toLowerCase()}` },
                  { label: `TCE — ${cfg.nome}`, href: `https://www.tce.${sigla.toLowerCase()}.gov.br` },
                ].map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12.5, color: cor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔗 {link.label}
                  </a>
                ))}
              </div>
            </div>
          </div>

        </div>
      </section>
    </>
  )
}
