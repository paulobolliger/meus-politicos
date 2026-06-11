import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { QueryResultRow } from 'pg'

import { getPgPool } from '@/lib/db/pool'
import { PerfilSite, type PerfilSiteData } from '@/components/politico-v2/PerfilSite'
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

type PoliticoSiteRow = PerfilSiteData['politico']

type PartidoRow = {
  sigla: string | null
}

type VotacaoSiteRow = PerfilSiteData['votacoes'][number]
type GastoSiteRow = PerfilSiteData['gastos'][number]
type PresencaSiteRow = PerfilSiteData['presencaRows'][number]
type EmendaSiteRow = PerfilSiteData['emendas'][number]

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}

function toNumber(value: unknown): number | null {
  if (value == null) return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
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

async function getSiteRelatedData(politico: PoliticoSiteRow) {
  const pool = getPgPool()
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
              municipio_nome, uf_municipio, funcao, ano, tipo_emenda
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

  const shareImg = data.foto_url || "/logos_meus-politicos_colorido_fundobranco.png"

  return {
    title: `${nome} · ${cargoLabel}${ufLabel} | Meus Políticos`,
    description: `Acompanhe o perfil de ${nome} (${cargoLabel}): votações nominais, gastos de gabinete (CEAP), índice de presença e atuação legislativa no Meus Políticos.`,
    openGraph: {
      title: `${nome} — Perfil de Transparência`,
      description: `Histórico, votações e gastos do(a) ${cargoLabel} ${nome}${ufLabel}.`,
      type: 'profile',
      images: [
        {
          url: shareImg,
          alt: `Foto de ${nome}`,
        },
      ],
    },
  }
}

export default async function PerfilPublicoPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { aba = 'votacoes', follow } = await searchParams

  const politico = await getPoliticoSite(id)
  if (!politico) notFound()

  const {
    partido,
    votacoes,
    gastos,
    presencaRows,
    emendas,
  } = await getSiteRelatedData(politico)

  // Checar se o usuário logado acompanha este político (para exibir estado no botão)
  const currentUser = await getCurrentUser()
  let isSeguindo = false
  if (currentUser) {
    const pool = getPgPool()
    try {
      const { rows } = await pool.query(
        'SELECT 1 FROM acompanhamentos WHERE usuario_id = $1 AND politico_id = $2 LIMIT 1',
        [currentUser.perfilId, politico.id]
      )
      isSeguindo = rows.length > 0
    } catch {
      // Ignorar erro
    }
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOfficial',
    'name': politico.nome,
    'alternateName': politico.nome_eleitoral,
    'description': `Perfil de transparência de ${politico.nome} (${politico.cargo}).`,
    'image': politico.foto_url,
    'jobTitle': politico.cargo,
    'address': {
      '@type': 'PostalAddress',
      'addressRegion': politico.uf,
      'addressCountry': 'BR'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PerfilSite
        politico={politico}
        partido={partido}
        votacoes={votacoes}
        gastos={gastos}
        presencaRows={presencaRows}
        emendas={emendas}
        aba={aba}
        isSeguindo={isSeguindo}
        followIntent={follow === '1'}
        emendasPixActive={await isFeatureActive('emendas_pix_visivel')}
        expliqueVotacaoActive={await isFeatureActive('explique_votacao')}
      />
    </>
  )
}
