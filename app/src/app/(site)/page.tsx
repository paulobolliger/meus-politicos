import type { Metadata } from 'next'
import { Pool } from 'pg'
import { HomeCidadaoClient } from '@/components/site/home/HomeCidadaoClient'

export const metadata: Metadata = {
  title: 'Meus Políticos — Transparência política para qualquer cidadão',
  description:
    'Digite seu CEP e descubra quem te representa em Brasília. Votações, gastos e presença de todos os deputados federais e senadores.',
}

export type VotacaoRecente = {
  proposicao: string
  descricao_simples: string | null
  data: string
  total_sim: number
  total_nao: number
  total_abstencao: number
}

type VotacaoRecenteRow = {
  proposicao_id: string | null
  proposicao: string | null
  descricao_simples: string | null
  data: string | null
  voto: string | null
}

let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host: process.env.POSTGRES_HOST ?? 'localhost',
    port: Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
    user: process.env.POSTGRES_USER ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5,
    idleTimeoutMillis: 30_000,
  })
  return _pool
}

export default async function HomePage() {
  const pool = getPool()

  // 1. Buscar votações recentes da Câmara (proposicao_id preenchido), agrupar por votação
  const { rows: raw } = await pool.query<VotacaoRecenteRow>(
    `SELECT proposicao_id, proposicao, descricao_simples, data::text AS data, voto
     FROM votacoes
     WHERE proposicao_id IS NOT NULL
       AND data IS NOT NULL
       AND source_id = 'camara_votos_bulk'
     ORDER BY data DESC
     LIMIT 600`
  )

  // Agrupar por proposicao_id → pegar as 4 mais recentes distintas
  type VotMap = {
    proposicao_id: string
    proposicao: string | null
    descricao_simples: string | null
    data: string
    sim: number
    nao: number
    abstencao: number
  }
  const map = new Map<string, VotMap>()
  for (const r of raw ?? []) {
    if (!r.proposicao_id || !r.data) continue
    if (!map.has(r.proposicao_id)) {
      map.set(r.proposicao_id, {
        proposicao_id: r.proposicao_id,
        proposicao: r.proposicao,
        descricao_simples: r.descricao_simples,
        data: r.data,
        sim: 0,
        nao: 0,
        abstencao: 0,
      })
    }
    const entry = map.get(r.proposicao_id)!
    if (r.voto === 'sim') entry.sim++
    else if (r.voto === 'nao') entry.nao++
    else entry.abstencao++
  }

  const recentVotacoes: VotacaoRecente[] = Array.from(map.values())
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 4)
    .map((v) => ({
      proposicao: v.proposicao || v.proposicao_id,
      descricao_simples: v.descricao_simples,
      data: v.data,
      total_sim: v.sim,
      total_nao: v.nao,
      total_abstencao: v.abstencao,
    }))

  // 2. Buscar estatísticas gerais agregadas para a homepage (com try-catches individuais)
  let ceapData = null
  try {
    const { rows } = await pool.query(`
      SELECT 
        COALESCE(SUM(valor), 0)::numeric as total, 
        COUNT(*)::integer as registros, 
        COUNT(DISTINCT politico_id)::integer as politicos,
        2026::integer as ano
      FROM gastos 
      WHERE ano = 2026
    `)
    if (rows[0] && rows[0].registros > 0) {
      ceapData = {
        total: Number(rows[0].total),
        registros: Number(rows[0].registros),
        politicos: Number(rows[0].politicos),
        ano: Number(rows[0].ano),
      }
    }
  } catch (err) {
    console.error("Erro ao buscar estatísticas de gastos CEAP para home:", err)
  }

  let emendasData = null
  try {
    const { rows } = await pool.query(`
      SELECT 
        COALESCE(SUM(valor_pago), 0)::numeric as total_pago,
        COALESCE(SUM(valor_empenhado), 0)::numeric as total_empenhado,
        COUNT(DISTINCT municipio_ibge)::integer as municipios,
        COUNT(DISTINCT politico_id)::integer as politicos,
        2026::integer as ano
      FROM emendas
      WHERE ano = 2026
    `)
    if (rows[0] && rows[0].politicos > 0) {
      emendasData = {
        totalPago: Number(rows[0].total_pago),
        totalEmpenhado: Number(rows[0].total_empenhado),
        municipios: Number(rows[0].municipios),
        politicos: Number(rows[0].politicos),
        ano: Number(rows[0].ano),
      }
    }
  } catch (err) {
    console.error("Erro ao buscar estatísticas de emendas para home:", err)
  }

  let representantesData = null
  try {
    const { rows: polRows } = await pool.query(`
      SELECT 
        COUNT(*)::integer as total,
        SUM(CASE WHEN cargo = 'deputado_federal' THEN 1 ELSE 0 END)::integer as camara,
        SUM(CASE WHEN cargo = 'senador' THEN 1 ELSE 0 END)::integer as senado
      FROM politicos 
      WHERE removido_em IS NULL
    `)

    const { rows: presRows } = await pool.query(`
      SELECT AVG(percentual)::numeric as avg_presenca 
      FROM presenca 
      WHERE ano = 2026
    `)

    if (polRows[0] && polRows[0].total > 0) {
      representantesData = {
        total: Number(polRows[0].total),
        camara: Number(polRows[0].camara),
        senado: Number(polRows[0].senado),
        presencaMedia: presRows[0]?.avg_presenca ? Number(presRows[0].avg_presenca) : null
      }
    }
  } catch (err) {
    console.error("Erro ao buscar estatísticas de representantes para home:", err)
  }

  let legislativoData = null
  try {
    const { rows: propRows } = await pool.query(`
      SELECT 
        COUNT(*)::integer as total,
        SUM(CASE WHEN tipo IN ('PL', 'PLP') THEN 1 ELSE 0 END)::integer as pl,
        SUM(CASE WHEN tipo = 'MPV' THEN 1 ELSE 0 END)::integer as mpv,
        SUM(CASE WHEN tipo = 'PEC' THEN 1 ELSE 0 END)::integer as pec
      FROM proposicoes
    `)

    const { rows: novRows } = await pool.query(`
      SELECT 
        COUNT(*)::integer as novos,
        2026::integer as ano
      FROM proposicoes 
      WHERE ano = 2026
    `)

    if (propRows[0] && propRows[0].total > 0) {
      legislativoData = {
        total: Number(propRows[0].total),
        pls: Number(propRows[0].pl),
        mpvs: Number(propRows[0].mpv),
        pecs: Number(propRows[0].pec),
        novasAno: Number(novRows[0].novos),
        ano: Number(novRows[0].ano)
      }
    }
  } catch (err) {
    console.error("Erro ao buscar estatísticas legislativas para home:", err)
  }

  let bancadasData = null
  try {
    const { rows } = await pool.query<{ sigla: string; count: number }>(`
      SELECT pt.sigla, COUNT(*)::integer as count
      FROM politicos p
      JOIN partidos pt ON p.partido_id = pt.id
      WHERE p.removido_em IS NULL 
        AND p.cargo IN ('deputado_federal', 'senador')
      GROUP BY pt.sigla
      ORDER BY count DESC
      LIMIT 3
    `)
    if (rows && rows.length > 0) {
      bancadasData = rows.map((r) => ({
        sigla: r.sigla,
        count: Number(r.count),
      }))
    }
  } catch (err) {
    console.error("Erro ao buscar bancadas para home:", err)
  }

  let presencaEstadoData = null
  try {
    const { rows } = await pool.query<{ uf: string; avg_presenca: number }>(`
      SELECT p.uf, AVG(pr.percentual)::numeric as avg_presenca
      FROM presenca pr
      JOIN politicos p ON pr.politico_id = p.id
      WHERE pr.ano = 2026
        AND p.removido_em IS NULL
      GROUP BY p.uf
      ORDER BY avg_presenca DESC
      LIMIT 3
    `)
    if (rows && rows.length > 0) {
      presencaEstadoData = rows.map((r) => ({
        uf: r.uf,
        avgPresenca: Number(r.avg_presenca),
      }))
    }
  } catch (err) {
    console.error("Erro ao buscar presença por estado para home:", err)
  }

  let cidadesEmendasData = null
  try {
    const { rows } = await pool.query<{ nome: string; uf: string; total: number }>(`
      SELECT nome, uf, total_emendas::numeric as total
      FROM v_emendas_municipio
      ORDER BY total_emendas DESC
      LIMIT 3
    `)
    if (rows && rows.length > 0) {
      cidadesEmendasData = rows.map((r) => ({
        nome: r.nome,
        uf: r.uf,
        total: Number(r.total),
      }))
    }
  } catch (err) {
    console.error("Erro ao buscar cidades de emendas para home:", err)
  }

  const estatisticas = {
    ceap: ceapData,
    emendas: emendasData,
    representantes: representantesData,
    legislativo: legislativoData,
    bancadas: bancadasData,
    presencaEstado: presencaEstadoData,
    cidadesEmendas: cidadesEmendasData
  }

  return <HomeCidadaoClient recentVotacoes={recentVotacoes} estatisticas={estatisticas} />
}
