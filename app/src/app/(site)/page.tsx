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

  // Buscar votações recentes da Câmara (proposicao_id preenchido), agrupar por votação
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

  return <HomeCidadaoClient recentVotacoes={recentVotacoes} />
}
