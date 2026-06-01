import type { Metadata } from 'next'
import { Pool } from 'pg'
import { CamaraClient } from './CamaraClient'

export const revalidate = 3600

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

export type DestaqueDeputado = {
  id: string
  slug: string
  nome_eleitoral: string | null
  foto_url: string | null
  uf: string | null
  gasto_total_ano: number | null
  presenca_pct_atual: number | null
  partido_sigla: string | null
  partido_cor: string | null
}

export type PartidoHemiciclo = {
  sigla: string
  total: number
  cor: string | null
}

export type ProposicaoRecente = {
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  situacao: string | null
}

export type CamaraStats = {
  total: number
  presencaMedia: number | null
  gastoTotalAno: number | null
}

export const metadata: Metadata = {
  title: 'Câmara dos Deputados | Meus Políticos',
  description: 'Acompanhe em tempo real a atividade legislativa, gastos e desempenho dos 513 Deputados Federais.',
}

export default async function CamaraPage() {
  const pool = getPool()
  const ano = new Date().getFullYear()

  let stats: CamaraStats = { total: 0, presencaMedia: null, gastoTotalAno: null }
  let destaques: DestaqueDeputado[] = []
  let partidos: PartidoHemiciclo[] = []
  let proposicoes: ProposicaoRecente[] = []

  try {
    // ── Stats gerais ───────────────────────────────────────────────────────
    const aggRes = await pool.query<{ total: string; presenca_media: string | null; gasto_total: string | null }>(
      `SELECT COUNT(*) AS total,
              ROUND(AVG(presenca_pct_atual)::numeric, 1) AS presenca_media,
              SUM(gasto_total_ano) AS gasto_total
       FROM politicos
       WHERE cargo = 'deputado_federal' AND removido_em IS NULL`
    )
    const agg = aggRes.rows[0]
    stats = {
      total:          Number(agg.total),
      presencaMedia:  agg.presenca_media != null ? Number(agg.presenca_media) : null,
      gastoTotalAno:  agg.gasto_total    != null ? Number(agg.gasto_total)    : null,
    }

    // ── Deputados em Destaque (4 com maior CEAP, com foto) ─────────────────
    const destRes = await pool.query<DestaqueDeputado>(
      `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, p.uf,
              p.gasto_total_ano, ROUND(p.presenca_pct_atual::numeric, 1) AS presenca_pct_atual,
              pt.sigla AS partido_sigla, pt.cor AS partido_cor
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_federal'
         AND p.removido_em IS NULL
         AND p.foto_url IS NOT NULL
       ORDER BY p.gasto_total_ano DESC NULLS LAST
       LIMIT 4`
    )
    destaques = destRes.rows.map(d => ({
      ...d,
      gasto_total_ano:    d.gasto_total_ano    != null ? Number(d.gasto_total_ano)    : null,
      presenca_pct_atual: d.presenca_pct_atual != null ? Number(d.presenca_pct_atual) : null,
    }))

    // ── Partidos no hemiciclo ──────────────────────────────────────────────
    const parRes = await pool.query<{ sigla: string; total: string; cor: string | null }>(
      `SELECT pt.sigla, COUNT(*) AS total, pt.cor
       FROM politicos p
       JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_federal' AND p.removido_em IS NULL
       GROUP BY pt.sigla, pt.cor
       ORDER BY COUNT(*) DESC`
    )
    partidos = parRes.rows.map(r => ({ sigla: r.sigla, total: Number(r.total), cor: r.cor }))

    // ── Proposições recentes ───────────────────────────────────────────────
    try {
      const propRes = await pool.query<ProposicaoRecente>(
        `SELECT tipo, numero, ano::int AS ano, ementa, situacao
         FROM proposicoes
         WHERE tipo IN ('PL','PEC','MPV','PDL')
         ORDER BY data_apresentacao DESC NULLS LAST
         LIMIT 3`
      )
      proposicoes = propRes.rows
    } catch { /* table may be empty */ }

  } catch (err) {
    console.error('[/camara]', err)
  }

  return (
    <CamaraClient
      stats={stats}
      destaques={destaques}
      partidos={partidos}
      proposicoes={proposicoes}
      ano={ano}
    />
  )
}
