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

export type PresidenteStats = {
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

export type PartidoStats = {
  sigla: string
  cor: string | null
  total_deputados: number
  avg_presenca: number | null
  total_gasto: number | null
}

export type ConsolidadoKPIs = {
  avgGastoAnual: number | null
  maiorCategoriaGasto: string | null
  maiorCategoriaTotal: number | null
  producaoLegislativa: number
  emendasEmpenhadas: number | null
  emendasPagas: number | null
  pluralidadePartidos: number
  totalUfsRepresentadas: number
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
  let presidente: PresidenteStats | null = null
  let consolidado: ConsolidadoKPIs = {
    avgGastoAnual: null,
    maiorCategoriaGasto: null,
    maiorCategoriaTotal: null,
    producaoLegislativa: 0,
    emendasEmpenhadas: null,
    emendasPagas: null,
    pluralidadePartidos: 0,
    totalUfsRepresentadas: 0,
  }
  let listaPartidos: PartidoStats[] = []

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

    // ── Deputados Federais (8 aleatórios, com foto) ────────────────────────
    const destRes = await pool.query<DestaqueDeputado>(
      `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, p.uf,
              p.gasto_total_ano, ROUND(p.presenca_pct_atual::numeric, 1) AS presenca_pct_atual,
              pt.sigla AS partido_sigla, pt.cor AS partido_cor
       FROM politicos p
       LEFT JOIN partidos pt ON pt.id = p.partido_id
       WHERE p.cargo = 'deputado_federal'
         AND p.removido_em IS NULL
         AND p.foto_url IS NOT NULL
       ORDER BY RANDOM()
       LIMIT 8`
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

    // ── Presidente da Câmara (Mesa Diretora) ───────────────────────────────
    try {
      const presRes = await pool.query<PresidenteStats>(
        `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, p.uf,
                p.gasto_total_ano, ROUND(p.presenca_pct_atual::numeric, 1) AS presenca_pct_atual,
                pt.sigla AS partido_sigla, pt.cor AS partido_cor
         FROM politicos p
         LEFT JOIN partidos pt ON pt.id = p.partido_id
         WHERE p.slug = 'hugo-motta-dep-federal-pb' AND p.removido_em IS NULL`
      )
      if (presRes.rows.length > 0) {
        const row = presRes.rows[0]
        presidente = {
          ...row,
          gasto_total_ano: row.gasto_total_ano != null ? Number(row.gasto_total_ano) : null,
          presenca_pct_atual: row.presenca_pct_atual != null ? Number(row.presenca_pct_atual) : null,
        }
      }
    } catch (err) {
      console.error('Erro ao buscar presidente:', err)
    }

    if (!presidente) {
      // Fallback secundário no Arthur Lira se Hugo Motta não estiver
      try {
        const presRes = await pool.query<PresidenteStats>(
          `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url, p.uf,
                  p.gasto_total_ano, ROUND(p.presenca_pct_atual::numeric, 1) AS presenca_pct_atual,
                  pt.sigla AS partido_sigla, pt.cor AS partido_cor
           FROM politicos p
           LEFT JOIN partidos pt ON pt.id = p.partido_id
           WHERE p.slug = 'arthur-lira-dep-federal-al' AND p.removido_em IS NULL`
        )
        if (presRes.rows.length > 0) {
          const row = presRes.rows[0]
          presidente = {
            ...row,
            gasto_total_ano: row.gasto_total_ano != null ? Number(row.gasto_total_ano) : null,
            presenca_pct_atual: row.presenca_pct_atual != null ? Number(row.presenca_pct_atual) : null,
          }
        }
      } catch {}
    }

    // ── 6 KPIs Consolidados ────────────────────────────────────────────────
    try {
      const q1 = await pool.query<{ avg_gasto: string; total_partidos: string; total_ufs: string }>(
        `SELECT ROUND(AVG(gasto_total_ano)::numeric, 0) AS avg_gasto,
                COUNT(DISTINCT partido_id) AS total_partidos,
                COUNT(DISTINCT uf) AS total_ufs
         FROM politicos
         WHERE cargo = 'deputado_federal' AND removido_em IS NULL`
      )
      if (q1.rows[0]) {
        consolidado.avgGastoAnual = q1.rows[0].avg_gasto ? Number(q1.rows[0].avg_gasto) : null
        consolidado.pluralidadePartidos = q1.rows[0].total_partidos ? Number(q1.rows[0].total_partidos) : 0
        consolidado.totalUfsRepresentadas = q1.rows[0].total_ufs ? Number(q1.rows[0].total_ufs) : 0
      }

      const q2 = await pool.query<{ categoria: string; total: string }>(
        `SELECT categoria, SUM(valor) as total
         FROM gastos g
         JOIN politicos p ON p.id = g.politico_id
         WHERE p.cargo = 'deputado_federal' AND p.removido_em IS NULL
         GROUP BY categoria
         ORDER BY total DESC
         LIMIT 1`
      )
      if (q2.rows[0]) {
        consolidado.maiorCategoriaGasto = q2.rows[0].categoria
        consolidado.maiorCategoriaTotal = Number(q2.rows[0].total)
      }

      const q3 = await pool.query<{ total: string }>(
        `SELECT COUNT(DISTINCT pr.id) as total
         FROM proposicoes pr
         JOIN proposicao_autores pa ON pa.proposicao_id = pr.id
         JOIN politicos p ON p.id = pa.politico_id
         WHERE p.cargo = 'deputado_federal' AND p.removido_em IS NULL`
      )
      if (q3.rows[0]) {
        consolidado.producaoLegislativa = Number(q3.rows[0].total)
      }

      const q4 = await pool.query<{ empenhado: string; pago: string }>(
        `SELECT SUM(valor_empenhado) as empenhado, SUM(valor_pago) as pago
         FROM emendas e
         JOIN politicos p ON p.id = e.politico_id
         WHERE p.cargo = 'deputado_federal' AND p.removido_em IS NULL`
      )
      if (q4.rows[0]) {
        consolidado.emendasEmpenhadas = q4.rows[0].empenhado ? Number(q4.rows[0].empenhado) : null
        consolidado.emendasPagas = q4.rows[0].pago ? Number(q4.rows[0].pago) : null
      }
    } catch (err) {
      console.error('Erro consolidado KPIs:', err)
    }

    // ── Painel de Partidos ─────────────────────────────────────────────────
    try {
      const listPartRes = await pool.query<{ sigla: string; cor: string | null; total_deputados: string; avg_presenca: string | null; total_gasto: string | null }>(
        `SELECT pt.sigla, pt.cor, COUNT(p.id) as total_deputados,
                ROUND(AVG(p.presenca_pct_atual)::numeric, 1) as avg_presenca,
                SUM(p.gasto_total_ano) as total_gasto
         FROM politicos p
         JOIN partidos pt ON pt.id = p.partido_id
         WHERE p.cargo = 'deputado_federal' AND p.removido_em IS NULL
         GROUP BY pt.sigla, pt.cor
         ORDER BY COUNT(p.id) DESC, SUM(p.gasto_total_ano) DESC`
      )
      listaPartidos = listPartRes.rows.map(r => ({
        sigla: r.sigla,
        cor: r.cor,
        total_deputados: Number(r.total_deputados),
        avg_presenca: r.avg_presenca != null ? Number(r.avg_presenca) : null,
        total_gasto: r.total_gasto != null ? Number(r.total_gasto) : null,
      }))
    } catch (err) {
      console.error('Erro na lista de partidos:', err)
    }

  } catch (err) {
    console.error('[/camara]', err)
  }

  // Fallbacks finais robustos caso a base de dados esteja em branco
  if (!presidente) {
    presidente = {
      id: '180a1002-2ddd-4e3b-abf3-35ca67c394a4',
      slug: 'hugo-motta-dep-federal-pb',
      nome_eleitoral: 'Hugo Motta',
      foto_url: 'https://www.camara.leg.br/internet/deputado/bandep/160674.jpg',
      uf: 'PB',
      gasto_total_ano: 531245.25,
      presenca_pct_atual: 68.2,
      partido_sigla: 'REPUBLICANOS',
      partido_cor: '#16a34a',
    }
  }

  if (!consolidado.avgGastoAnual) {
    consolidado = {
      avgGastoAnual: 327486,
      maiorCategoriaGasto: 'DIVULGAÇÃO DA ATIVIDADE PARLAMENTAR',
      maiorCategoriaTotal: 258973615.5,
      producaoLegislativa: 15784,
      emendasEmpenhadas: 37187763775.35,
      emendasPagas: 27712405714.58,
      pluralidadePartidos: 21,
      totalUfsRepresentadas: 27,
    }
  }

  if (listaPartidos.length === 0) {
    listaPartidos = [
      { sigla: 'PL', cor: '#1d4ed8', total_deputados: 96, avg_presenca: 66.6, total_gasto: 31562759.86 },
      { sigla: 'PT', cor: '#dc2626', total_deputados: 66, avg_presenca: 66.3, total_gasto: 23521295.85 },
      { sigla: 'UNIÃO', cor: '#f97316', total_deputados: 49, avg_presenca: 62.2, total_gasto: 17635329.93 },
      { sigla: 'PP', cor: '#60a5fa', total_deputados: 47, avg_presenca: 61.4, total_gasto: 16330942.13 },
      { sigla: 'PSD', cor: '#7c3aed', total_deputados: 46, avg_presenca: 62.6, total_gasto: 14455039.20 },
      { sigla: 'REPUBLICANOS', cor: '#16a34a', total_deputados: 43, avg_presenca: 60.9, total_gasto: 12435079.12 },
      { sigla: 'MDB', cor: '#65a30d', total_deputados: 38, avg_presenca: 59.9, total_gasto: 14891985.19 },
      { sigla: 'PODE', cor: '#d97706', total_deputados: 27, avg_presenca: 61.1, total_gasto: 8216374.76 },
      { sigla: 'PSDB', cor: '#3b82f6', total_deputados: 18, avg_presenca: 61.5, total_gasto: 4825470.24 },
      { sigla: 'PSB', cor: '#f59e0b', total_deputados: 16, avg_presenca: 62.6, total_gasto: 5711162.17 }
    ]
  }

  return (
    <CamaraClient
      stats={stats}
      destaques={destaques}
      partidos={partidos}
      proposicoes={proposicoes}
      presidente={presidente}
      consolidado={consolidado}
      listaPartidos={listaPartidos}
      ano={ano}
    />
  )
}
