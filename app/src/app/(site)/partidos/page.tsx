import type { Metadata } from 'next'
import { Pool } from 'pg'
import { PartidosClient, type PartidoCard, type FpAno } from './PartidosClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Partidos Políticos | Meus Políticos',
  description: 'Explore os partidos políticos brasileiros — bancada, presença, gastos e histórico de votações.',
}

// ─── Pool singleton ───────────────────────────────────────────────────────────
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

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PartidosPage() {
  const pool = getPool()
  let partidos: PartidoCard[] = []
  let totalPoliticos = 0
  // Fallback com dados reais do último query (atualizar via ETL)
  let fpPorAno: FpAno[] = [
    { ano: 2022, total: 2_536_800_825 },
    { ano: 2023, total: 1_704_231_948 },
    { ano: 2024, total: 2_494_944_655 },
    { ano: 2025, total: 1_812_659_453 },
  ]

  try {
    const res = await pool.query<PartidoCard>(`
      SELECT
        pt.id,
        pt.sigla,
        pt.nome,
        pt.numero,
        pt.cor,
        pt.logo_url,
        COUNT(DISTINCT p.id)                                                                   AS total_politicos,
        COUNT(DISTINCT CASE WHEN p.cargo = 'deputado_federal'  THEN p.id END)                 AS dep_federal,
        COUNT(DISTINCT CASE WHEN p.cargo = 'senador'           THEN p.id END)                 AS senadores,
        COUNT(DISTINCT CASE WHEN p.cargo = 'governador'        THEN p.id END)                 AS governadores,
        COUNT(DISTINCT CASE WHEN p.cargo = 'deputado_estadual' THEN p.id END)                 AS dep_estadual,
        ROUND(AVG(NULLIF(p.presenca_pct_atual, 0))::numeric, 1)                               AS presenca_media,
        ROUND(COALESCE(AVG(NULLIF(p.gasto_total_ano, 0)), 0)::numeric / 12, 0)                AS gasto_medio_mensal
      FROM partidos pt
      LEFT JOIN politicos p ON p.partido_id = pt.id AND p.removido_em IS NULL
      GROUP BY pt.id, pt.sigla, pt.nome, pt.numero, pt.cor, pt.logo_url
      HAVING COUNT(DISTINCT p.id) > 0
      ORDER BY COUNT(DISTINCT p.id) DESC, pt.sigla
    `)
    partidos = res.rows.map(r => ({
      ...r,
      total_politicos:    Number(r.total_politicos    ?? 0),
      dep_federal:        Number(r.dep_federal        ?? 0),
      senadores:          Number(r.senadores          ?? 0),
      governadores:       Number(r.governadores       ?? 0),
      dep_estadual:       Number(r.dep_estadual       ?? 0),
      presenca_media:     r.presenca_media     != null ? Number(r.presenca_media)     : null,
      gasto_medio_mensal: r.gasto_medio_mensal != null ? Number(r.gasto_medio_mensal) : null,
    }))
    totalPoliticos = partidos.reduce((s, p) => s + p.total_politicos, 0)
  } catch { /* table may not exist */ }

  // Tentar buscar FP do banco — fallback para valores hardcoded se falhar
  try {
    const fpRes = await pool.query<{ ano: string; total: string }>(
      `SELECT ano::int AS ano, SUM(valor_total)::bigint AS total
       FROM partidos_fundos
       GROUP BY ano ORDER BY ano`
    )
    if (fpRes.rows.length > 0) {
      fpPorAno = fpRes.rows.map(r => ({ ano: Number(r.ano), total: Number(r.total) }))
    }
  } catch { /* use hardcoded fallback */ }

  return <PartidosClient partidos={partidos} totalPoliticos={totalPoliticos} fpPorAno={fpPorAno} />
}
