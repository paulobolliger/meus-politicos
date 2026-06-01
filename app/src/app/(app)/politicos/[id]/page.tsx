import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import type { QueryResultRow } from 'pg'

import { PerfilApp } from '@/components/politico-v2/PerfilApp'
import { PerfilSite, type PerfilSiteData } from '@/components/politico-v2/PerfilSite'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string; follow?: string }>
}

type MetadataRow = {
  nome: string | null
  nome_eleitoral: string | null
  cargo: string | null
  uf: string | null
}

type PoliticoSiteRow = PerfilSiteData['politico']

type PartidoRow = {
  sigla: string | null
}

type VotacaoSiteRow = PerfilSiteData['votacoes'][number]
type GastoSiteRow = PerfilSiteData['gastos'][number]
type PresencaSiteRow = PerfilSiteData['presencaRows'][number]
type EmendaSiteRow = PerfilSiteData['emendas'][number]

type PoliticoAppRow = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  uf_nascimento: string | null
  sexo: string | null
  email: string | null
  gabinete_nome: string | null
  gabinete_telefone: string | null
  gabinete_email: string | null
  data_nascimento: string | null
  naturalidade: string | null
  escolaridade: string | null
  ocupacao: string | null
  partido_id: string | null
  mandato_inicio: string | null
  mandato_fim: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  codigo_siafi: string | null
  dado_estado: string | null
  collected_at: string | null
  removido_em: string | null
}

type VotacaoAppRow = {
  id: string
  voto: string
  descricao_simples: string | null
  data: string
  proposicao: string | null
}

type GastoAppRow = {
  valor: number
  categoria: string | null
  mes: number
  ano: number
}

type PresencaAppRow = {
  percentual: number
  mes: number | null
  ano: number
  total_sessoes: number
  presencas: number
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function toNumber(value: unknown): number | null {
  if (value == null) return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

function toRequiredNumber(value: unknown): number {
  return toNumber(value) ?? 0
}

async function findOneBySlugOrUuid<T extends QueryResultRow>(slugOrId: string, selectSql: string): Promise<T | null> {
  const pool = getPool()

  const bySlug = await pool.query<T>(
    `${selectSql} WHERE p.slug = $1 LIMIT 1`,
    [slugOrId]
  )
  if (bySlug.rows[0]) return bySlug.rows[0]

  if (!isUuid(slugOrId)) return null

  const byId = await pool.query<T>(
    `${selectSql} WHERE p.id = $1 LIMIT 1`,
    [slugOrId]
  )
  return byId.rows[0] ?? null
}

async function getMetadataPolitico(slugOrId: string) {
  return findOneBySlugOrUuid<MetadataRow>(
    slugOrId,
    `SELECT p.nome, p.nome_eleitoral, p.cargo::text AS cargo, p.uf
     FROM politicos p`
  )
}

async function getPoliticoSite(slugOrId: string) {
  const row = await findOneBySlugOrUuid<PoliticoSiteRow>(
    slugOrId,
    `SELECT p.id, p.slug, p.nome, p.nome_eleitoral, p.foto_url,
            p.cargo::text AS cargo, p.uf, p.partido_id,
            p.mandato_inicio::text AS mandato_inicio,
            p.mandato_fim::text AS mandato_fim,
            p.presenca_pct_atual,
            p.gasto_total_ano,
            p.total_votacoes
     FROM politicos p`
  )

  if (!row) return null

  return {
    ...row,
    presenca_pct_atual: toNumber(row.presenca_pct_atual),
    gasto_total_ano: toNumber(row.gasto_total_ano),
    total_votacoes: toNumber(row.total_votacoes),
  }
}

async function getPoliticoApp(slugOrId: string) {
  const row = await findOneBySlugOrUuid<PoliticoAppRow>(
    slugOrId,
    `SELECT p.id, p.slug, p.nome, p.nome_civil, p.nome_eleitoral, p.foto_url,
            p.cargo::text AS cargo, p.uf, p.uf_nascimento, p.sexo, p.email,
            p.gabinete_nome, p.gabinete_telefone, p.gabinete_email,
            p.data_nascimento::text AS data_nascimento,
            p.naturalidade, p.escolaridade, p.ocupacao, p.partido_id,
            p.mandato_inicio::text AS mandato_inicio,
            p.mandato_fim::text AS mandato_fim,
            p.presenca_pct_atual,
            p.gasto_total_ano,
            p.total_votacoes,
            p.codigo_siafi::text AS codigo_siafi,
            p.dado_estado,
            p.collected_at::text AS collected_at,
            p.removido_em::text AS removido_em
     FROM politicos p`
  )

  if (!row) return null

  return {
    ...row,
    presenca_pct_atual: toNumber(row.presenca_pct_atual),
    gasto_total_ano: toNumber(row.gasto_total_ano),
    total_votacoes: toNumber(row.total_votacoes),
  }
}

async function getSiteRelatedData(politico: PoliticoSiteRow) {
  const pool = getPool()
  const anoAtual = new Date().getFullYear()

  const [partidoResult, votacoesResult, gastosResult, presencaResult, emendasResult] = await Promise.all([
    politico.partido_id
      ? pool.query<PartidoRow>(
          `SELECT sigla FROM partidos WHERE id = $1 LIMIT 1`,
          [politico.partido_id]
        )
      : Promise.resolve({ rows: [] as PartidoRow[] }),
    pool.query<VotacaoSiteRow>(
      `SELECT id, voto, descricao_simples, data::text AS data, proposicao
       FROM votacoes
       WHERE politico_id = $1
       ORDER BY data DESC NULLS LAST
       LIMIT 20`,
      [politico.id]
    ),
    pool.query<GastoSiteRow>(
      `SELECT valor, categoria
       FROM gastos
       WHERE politico_id = $1
         AND ano = $2
       LIMIT 200`,
      [politico.id, anoAtual]
    ),
    pool.query<PresencaSiteRow>(
      `SELECT percentual, mes, ano, total_sessoes, presencas
       FROM presenca
       WHERE politico_id = $1
       ORDER BY ano DESC NULLS LAST, mes DESC NULLS LAST
       LIMIT 12`,
      [politico.id]
    ),
    pool.query<EmendaSiteRow>(
      `SELECT id, valor, valor_pago, municipio_destino, uf_destino, area,
              municipio_nome, uf_municipio, funcao, ano
       FROM emendas
       WHERE politico_id = $1
       ORDER BY valor_pago DESC NULLS LAST
       LIMIT 20`,
      [politico.id]
    ),
  ])

  return {
    partido: partidoResult.rows[0]?.sigla ? { sigla: partidoResult.rows[0].sigla } : null,
    votacoes: votacoesResult.rows,
    gastos: gastosResult.rows.map((row) => ({
      ...row,
      valor: toNumber(row.valor),
    })),
    presencaRows: presencaResult.rows.map((row) => ({
      ...row,
      percentual: toNumber(row.percentual),
      mes: toNumber(row.mes),
      ano: toNumber(row.ano),
      total_sessoes: toNumber(row.total_sessoes),
      presencas: toNumber(row.presencas),
    })),
    emendas: emendasResult.rows.map((row) => ({
      ...row,
      valor: toNumber(row.valor),
      valor_pago: toNumber(row.valor_pago),
      ano: toNumber(row.ano),
    })),
  }
}

async function getAppRelatedData(politicoId: string) {
  const pool = getPool()
  const anoAtual = new Date().getFullYear()

  const [votacoesResult, gastosResult, presencaResult] = await Promise.all([
    pool.query<VotacaoAppRow>(
      `SELECT id, voto, descricao_simples, data::text AS data, proposicao
       FROM votacoes
       WHERE politico_id = $1
       ORDER BY data DESC NULLS LAST
       LIMIT 8`,
      [politicoId]
    ),
    pool.query<GastoAppRow>(
      `SELECT valor, categoria, mes, ano
       FROM gastos
       WHERE politico_id = $1
         AND ano = $2
       LIMIT 100`,
      [politicoId, anoAtual]
    ),
    pool.query<PresencaAppRow>(
      `SELECT percentual, mes, ano, total_sessoes, presencas
       FROM presenca
       WHERE politico_id = $1
       ORDER BY ano DESC NULLS LAST, mes DESC NULLS LAST
       LIMIT 24`,
      [politicoId]
    ),
  ])

  return {
    votacoes: votacoesResult.rows,
    gastos: gastosResult.rows.map((row) => ({
      ...row,
      valor: toRequiredNumber(row.valor),
      mes: toRequiredNumber(row.mes),
      ano: toRequiredNumber(row.ano),
    })),
    presenca: presencaResult.rows.map((row) => ({
      ...row,
      percentual: toRequiredNumber(row.percentual),
      mes: toNumber(row.mes),
      ano: toRequiredNumber(row.ano),
      total_sessoes: toRequiredNumber(row.total_sessoes),
      presencas: toRequiredNumber(row.presencas),
    })),
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getMetadataPolitico(id)

  if (!data) return { title: 'Político não encontrado' }

  const nome = data.nome_eleitoral ?? data.nome ?? ''
  return {
    title: `${nome} · Meus Políticos`,
    description: `Votações, gastos e presença de ${nome} em linguagem simples.`,
  }
}

export default async function PerfilPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { aba = 'votacoes', follow } = await searchParams
  const followIntent = follow === '1'

  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isSite = !host.startsWith('app.')

  if (isSite) {
    const politico = await getPoliticoSite(id)
    if (!politico) notFound()

    const { partido, votacoes, gastos, presencaRows, emendas } = await getSiteRelatedData(politico)

    return (
      <PerfilSite
        politico={politico}
        partido={partido}
        votacoes={votacoes}
        gastos={gastos}
        presencaRows={presencaRows}
        emendas={emendas}
        aba={aba}
        isSeguindo={false}
        followIntent={followIntent}
      />
    )
  }

  const politico = await getPoliticoApp(id)
  if (!politico) notFound()

  const { votacoes, gastos, presenca } = await getAppRelatedData(politico.id)

  return (
    <PerfilApp
      politico={politico}
      votacoes={votacoes}
      gastos={gastos}
      presenca={presenca}
    />
  )
}
