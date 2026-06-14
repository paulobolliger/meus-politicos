import type { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import type { QueryResultRow } from 'pg'

import { getPgPool } from '@/lib/db/pool'
import { PerfilApp } from '@/components/politico-v2/PerfilApp'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isFeatureActive } from '@/lib/flags'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string; follow?: string }>
}

type MetadataRow = {
  nome: string | null
  nome_eleitoral: string | null
  cargo: string | null
  uf: string | null
  foto_url: string | null
}

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

type RedeSocialRow = {
  plataforma: string | null
  url: string | null
  handle: string | null
  verificado: boolean | null
}

type HistoricoPartidarioRow = {
  partido_sigla: string | null
  partido_nome: string | null
  partido_cor: string | null
  inicio: string | null
  fim: string | null
  motivo: string | null
  atual: boolean
}

type AgendaSessaoRow = {
  id: string
  data: string
  hora_inicio: string | null
  titulo: string | null
  tipo: string | null
  situacao: string | null
  link: string | null
  fonte: string
}

type DoadorEleitoralRow = {
  nome: string
  valor: number
  tipo: string | null
  ano: number | null
}

type AnnualKpiData = {
  ano: number
  has_presenca_ano: boolean
  has_votacoes_ano: boolean
  has_gastos_ano: boolean
  has_emendas_ano: boolean
  has_proposicoes_ano: boolean
  presenca_pct: number | null
  presenca_total_sessoes: number
  presenca_total_presencas: number
  total_votacoes: number
  gasto_total: number
  gasto_ultimo_mes: number | null
  total_emendas: number
  total_proposicoes: number
}

type CountRow = {
  total: number | string | null
}

type ProposicaoAppRow = {
  id: string
  slug: string
  tipo: string | null
  numero: string | number | null
  ano: number | null
  ementa: string | null
  situacao: string | null
}

type EmendaAppRow = {
  id: string
  valor: number | null
  valor_pago: number | null
  municipio_nome: string | null
  uf_municipio: string | null
  funcao: string | null
  ano: number | null
}

type FeedEventoRow = {
  id: string
  data: string | null
  tipo: string | null
  titulo: string | null
  descricao: string | null
  descricao_simples: string | null
  impacto_nivel: number | null
  link_fonte: string | null
}

type PresencaKpiRow = {
  total_sessoes: number | string | null
  total_presencas: number | string | null
  percentual: number | string | null
}

type GastoKpiRow = {
  total: number | string | null
  ultimo_mes: number | string | null
  total_ultimo_mes: number | string | null
}

type AvailabilityRow = {
  available: boolean
}

const PERFIL_KPI_ANO = 2026

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
  const pool = getPgPool()

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
    `SELECT p.nome, p.nome_eleitoral, p.cargo::text AS cargo, p.uf, p.foto_url
     FROM politicos p`
  )
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

async function getAppRelatedData(politicoId: string) {
  const pool = getPgPool()
  const anoReferencia = PERFIL_KPI_ANO

  const [
    votacoesResult,
    votacoesRecentesResult,
    votacoesCountResult,
    gastosResult,
    gastosKpiResult,
    presencaResult,
    presencaKpiResult,
    proposicoesResult,
    proposicoesCountResult,
    emendasResult,
    emendasCountResult,
    redesSociaisResult,
    historicoPartidarioResult,
    agendaResult,
    availabilityResult,
  ] = await Promise.all([
    pool.query<VotacaoAppRow>(
      `SELECT id, voto, descricao_simples, data::text AS data, proposicao
       FROM votacoes
       WHERE politico_id = $1
         AND data >= make_date($2, 1, 1)
         AND data < make_date($2 + 1, 1, 1)
       ORDER BY data DESC NULLS LAST
       LIMIT 20`,
      [politicoId, anoReferencia]
    ),
    pool.query<VotacaoAppRow>(
      `SELECT id, voto, descricao_simples, data::text AS data, proposicao
       FROM votacoes
       WHERE politico_id = $1
       ORDER BY data DESC NULLS LAST
       LIMIT 8`,
      [politicoId]
    ),
    pool.query<CountRow>(
      `SELECT COUNT(*) AS total
       FROM votacoes
       WHERE politico_id = $1
         AND data >= make_date($2, 1, 1)
         AND data < make_date($2 + 1, 1, 1)`,
      [politicoId, anoReferencia]
    ),
    pool.query<GastoAppRow>(
      `SELECT valor, categoria, mes, ano
       FROM gastos
       WHERE politico_id = $1
         AND ano = $2
       ORDER BY mes DESC, valor DESC`,
      [politicoId, anoReferencia]
    ),
    pool.query<GastoKpiRow>(
      `WITH total_ano AS (
         SELECT COALESCE(SUM(valor), 0) AS total, MAX(mes) AS ultimo_mes
         FROM gastos
         WHERE politico_id = $1
           AND ano = $2
       )
       SELECT
         total_ano.total,
         total_ano.ultimo_mes,
         (
           SELECT COALESCE(SUM(g.valor), 0)
           FROM gastos g
           WHERE g.politico_id = $1
             AND g.ano = $2
             AND g.mes = total_ano.ultimo_mes
         ) AS total_ultimo_mes
       FROM total_ano`,
      [politicoId, anoReferencia]
    ),
    pool.query<PresencaAppRow>(
      `SELECT percentual, mes, ano, total_sessoes, presencas
       FROM presenca
       WHERE politico_id = $1
         AND ano = $2
       ORDER BY ano DESC NULLS LAST, mes DESC NULLS LAST
       LIMIT 24`,
      [politicoId, anoReferencia]
    ),
    pool.query<PresencaKpiRow>(
      `WITH mensal AS (
         SELECT total_sessoes, presencas
         FROM presenca
         WHERE politico_id = $1
           AND ano = $2
           AND mes IS NOT NULL
       ),
       base AS (
         SELECT total_sessoes, presencas
         FROM mensal
         UNION ALL
         SELECT total_sessoes, presencas
         FROM presenca
         WHERE politico_id = $1
           AND ano = $2
           AND mes IS NULL
           AND NOT EXISTS (SELECT 1 FROM mensal)
       )
       SELECT
         COALESCE(SUM(total_sessoes), 0) AS total_sessoes,
         COALESCE(SUM(presencas), 0) AS total_presencas,
         CASE
           WHEN COALESCE(SUM(total_sessoes), 0) = 0 THEN NULL
           ELSE ROUND((SUM(presencas)::numeric / SUM(total_sessoes)::numeric) * 100, 2)
         END AS percentual
       FROM base`,
      [politicoId, anoReferencia]
    ),
    pool.query<ProposicaoAppRow>(
      `SELECT p.id, p.slug, p.tipo, p.numero, p.ano, p.ementa, p.situacao
       FROM proposicoes p
       JOIN proposicao_autores pa ON pa.proposicao_id = p.id
       WHERE pa.politico_id = $1
         AND p.ano = $2
       ORDER BY p.ano DESC, p.numero DESC
       LIMIT 50`,
      [politicoId, anoReferencia]
    ),
    pool.query<CountRow>(
      `SELECT COUNT(*) AS total
       FROM proposicoes p
       JOIN proposicao_autores pa ON pa.proposicao_id = p.id
       WHERE pa.politico_id = $1
         AND p.ano = $2`,
      [politicoId, anoReferencia]
    ),
    pool.query<EmendaAppRow>(
      `SELECT e.id, e.valor, e.valor_pago, e.municipio_nome, e.uf_municipio, e.funcao, e.ano
       FROM emendas e
       WHERE e.politico_id = $1
         AND e.ano = $2
       ORDER BY e.ano DESC, e.valor_pago DESC
       LIMIT 50`,
      [politicoId, anoReferencia]
    ),
    pool.query<CountRow>(
      `SELECT COUNT(*) AS total
       FROM emendas e
       WHERE e.politico_id = $1
         AND e.ano = $2`,
      [politicoId, anoReferencia]
    ),
    pool.query<RedeSocialRow>(
      `WITH redes_normalizadas AS (
         SELECT
           CASE
             WHEN lower(plataforma) IN ('twitter', 'twitter_x', 'x') THEN 'twitter_x'
             ELSE lower(plataforma)
           END AS plataforma_key,
           plataforma,
           url,
           handle,
           verificado,
           atualizado_em
         FROM redes_sociais
         WHERE politico_id = $1
           AND removido_em IS NULL
       ),
       redes_unicas AS (
         SELECT DISTINCT ON (plataforma_key)
           plataforma,
           url,
           handle,
           verificado
         FROM redes_normalizadas
         ORDER BY plataforma_key, verificado DESC NULLS LAST, atualizado_em DESC NULLS LAST
       )
       SELECT plataforma, url, handle, verificado
       FROM redes_unicas
       ORDER BY
         CASE lower(plataforma)
           WHEN 'site_oficial' THEN 1
           WHEN 'instagram' THEN 2
           WHEN 'twitter_x' THEN 3
           WHEN 'x' THEN 3
           WHEN 'youtube' THEN 4
           WHEN 'tiktok' THEN 5
           WHEN 'facebook' THEN 6
           WHEN 'linkedin' THEN 7
           ELSE 99
         END,
         plataforma ASC`,
      [politicoId]
    ),
    pool.query<HistoricoPartidarioRow>(
      `SELECT
         pt.sigla AS partido_sigla,
         pt.nome AS partido_nome,
         pt.cor AS partido_cor,
         pp.inicio::text AS inicio,
         pp.fim::text AS fim,
         pp.motivo,
         (pp.fim IS NULL) AS atual
       FROM politico_partidos pp
       JOIN partidos pt ON pt.id = pp.partido_id
       WHERE pp.politico_id = $1
       ORDER BY pp.inicio DESC`,
      [politicoId]
    ),
    politicoId
      ? pool.query<AgendaSessaoRow>(
          `SELECT id::text, data::text, hora_inicio::text, titulo, tipo, situacao, link, fonte
           FROM (
             SELECT
               ss.id,
               ss.data,
               ss.hora_inicio,
               COALESCE(ss.tipo_sessao, 'Sessão plenária') AS titulo,
               ss.tipo_sessao AS tipo,
               ss.situacao,
               NULL::text AS link,
               'Senado'::text AS fonte
             FROM senado_sessoes ss
             WHERE EXISTS (
               SELECT 1
               FROM politicos p
               WHERE p.id = $1
                 AND p.cargo = 'senador'
             )
               AND ss.data >= current_date
             UNION ALL
             SELECT
               als.id,
               als.data,
               als.hora_inicio,
               COALESCE(als.nome_sessao, als.tipo, 'Sessão') AS titulo,
               als.tipo,
               als.situacao,
               als.link_ata AS link,
               COALESCE(als.fonte, 'Assembleia') AS fonte
             FROM ale_sessoes als
             WHERE EXISTS (
               SELECT 1
               FROM politicos p
               WHERE p.id = $1
                 AND p.cargo = 'deputado_estadual'
                 AND p.uf = als.uf
             )
               AND als.data >= current_date
           ) agenda
           ORDER BY data ASC, hora_inicio ASC NULLS LAST
           LIMIT 5`,
          [politicoId]
        )
      : Promise.resolve({ rows: [] as AgendaSessaoRow[] }),
    Promise.all([
      pool.query<AvailabilityRow>(
        `SELECT EXISTS (
           SELECT 1 FROM votacoes
           WHERE data >= make_date($1, 1, 1)
             AND data < make_date($1 + 1, 1, 1)
           LIMIT 1
         ) AS available`,
        [anoReferencia]
      ),
      pool.query<AvailabilityRow>(
        `SELECT EXISTS (
           SELECT 1 FROM presenca
           WHERE ano = $1
           LIMIT 1
         ) AS available`,
        [anoReferencia]
      ),
      pool.query<AvailabilityRow>(
        `SELECT EXISTS (
           SELECT 1 FROM gastos
           WHERE ano = $1
           LIMIT 1
         ) AS available`,
        [anoReferencia]
      ),
      pool.query<AvailabilityRow>(
        `SELECT EXISTS (
           SELECT 1 FROM emendas
           WHERE ano = $1
           LIMIT 1
         ) AS available`,
        [anoReferencia]
      ),
      pool.query<AvailabilityRow>(
        `SELECT EXISTS (
           SELECT 1 FROM proposicoes
           WHERE ano = $1
           LIMIT 1
         ) AS available`,
        [anoReferencia]
      ),
    ]),
  ])

  const presencaKpi = presencaKpiResult.rows[0]
  const gastosKpi = gastosKpiResult.rows[0]
  const [
    votacoesAvailabilityResult,
    presencaAvailabilityResult,
    gastosAvailabilityResult,
    emendasAvailabilityResult,
    proposicoesAvailabilityResult,
  ] = availabilityResult

  return {
    votacoes: votacoesResult.rows,
    votacoesRecentes: votacoesRecentesResult.rows,
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
    proposicoes: proposicoesResult.rows,
    emendas: emendasResult.rows.map((row) => ({
      ...row,
      valor: toNumber(row.valor),
      valor_pago: toNumber(row.valor_pago),
      ano: toNumber(row.ano),
    })),
    redesSociais: redesSociaisResult.rows,
    historicoPartidario: historicoPartidarioResult.rows,
    agenda: agendaResult.rows,
    doadoresEleitorais: [] as DoadorEleitoralRow[],
    kpis: {
      ano: anoReferencia,
      has_votacoes_ano: Boolean(votacoesAvailabilityResult.rows[0]?.available),
      has_presenca_ano: Boolean(presencaAvailabilityResult.rows[0]?.available),
      has_gastos_ano: Boolean(gastosAvailabilityResult.rows[0]?.available),
      has_emendas_ano: Boolean(emendasAvailabilityResult.rows[0]?.available),
      has_proposicoes_ano: Boolean(proposicoesAvailabilityResult.rows[0]?.available),
      presenca_pct: toNumber(presencaKpi?.percentual),
      presenca_total_sessoes: toRequiredNumber(presencaKpi?.total_sessoes),
      presenca_total_presencas: toRequiredNumber(presencaKpi?.total_presencas),
      total_votacoes: toRequiredNumber(votacoesCountResult.rows[0]?.total),
      gasto_total: toRequiredNumber(gastosKpi?.total),
      gasto_ultimo_mes: toNumber(gastosKpi?.ultimo_mes) == null ? null : toNumber(gastosKpi?.total_ultimo_mes),
      total_emendas: toRequiredNumber(emendasCountResult.rows[0]?.total),
      total_proposicoes: toRequiredNumber(proposicoesCountResult.rows[0]?.total),
    } satisfies AnnualKpiData,
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const data = await getMetadataPolitico(id)

  if (!data) return { title: 'Político não encontrado' }

  const nome = data.nome_eleitoral ?? data.nome ?? ''
  const cargoLabel = data.cargo === 'deputado_federal' ? 'Deputado Federal'
    : data.cargo === 'senador' ? 'Senador(a)'
    : data.cargo === 'prefeito' ? 'Prefeito(a)'
    : data.cargo === 'vereador' ? 'Vereador(a)'
    : data.cargo === 'deputado_estadual' ? 'Deputado Estadual'
    : 'Político'
  const ufLabel = data.uf ? ` por ${data.uf.toUpperCase()}` : ''

  return {
    title: `${nome} (Painel) · ${cargoLabel}${ufLabel} | Meus Políticos`,
  }
}

export default async function PerfilInternoPage({ params, searchParams }: PageProps) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')

  const { id } = await params
  const { aba = 'Visão geral' } = await searchParams

  const politico = await getPoliticoApp(id)
  if (!politico) notFound()

  // Busca filiação partidária
  const pool = getPgPool()
  let partido = null
  if (politico.partido_id) {
    const { rows: partidoRows } = await pool.query<{ sigla: string | null; nome: string | null; numero: number | null }>(
      `SELECT sigla, nome, numero FROM partidos WHERE id = $1 LIMIT 1`,
      [politico.partido_id]
    )
    partido = partidoRows[0] ?? null
  }

  const {
    votacoes,
    votacoesRecentes,
    gastos,
    presenca,
    proposicoes,
    emendas,
    redesSociais,
    historicoPartidario,
    agenda,
    doadoresEleitorais,
    kpis,
  } = await getAppRelatedData(politico.id)

  const politicoCompleto = {
    ...politico,
    partidos: partido,
    redes_sociais: redesSociais,
  }

  const timelineActive = await isFeatureActive('timeline_politica', currentUser.perfilId)
  let feedEventos: FeedEventoRow[] = []
  if (timelineActive) {
    const { rows } = await pool.query<FeedEventoRow>(
      `SELECT id, data::text AS data, tipo, titulo, descricao, descricao_simples, impacto_nivel, link_fonte
       FROM feed_eventos
       WHERE politico_id = $1
       ORDER BY data DESC, criado_em DESC
       LIMIT 100`,
      [politico.id]
    )
    feedEventos = rows
  }

  return (
    <PerfilApp
      politico={politicoCompleto}
      votacoes={votacoes}
      votacoesRecentes={votacoesRecentes}
      gastos={gastos}
      presenca={presenca}
      proposicoes={proposicoes}
      emendas={emendas}
      historicoPartidario={historicoPartidario}
      agenda={agenda}
      doadoresEleitorais={doadoresEleitorais}
      kpis={kpis}
      initialTab={aba}
      timelineActive={timelineActive}
      feedEventos={feedEventos}
      expliqueVotacaoActive={await isFeatureActive('explique_votacao', currentUser.perfilId)}
    />
  )
}
