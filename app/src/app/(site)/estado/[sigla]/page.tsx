import { getEstado } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { EstadoAnchorNav } from '@/components/site/EstadoAnchorNav'
import { getPgPool } from '@/lib/db/pool'
import {
  HemicycleChart,
  PactoFederativoFlow,
  EconSetoresBar,
  TimelinePolitica,
  BancadaFederalList
} from './StatePageClient'
import { GlossaryHighlighter } from '@/components/glossario/GlossaryHighlighter'

export const revalidate = 86400

// ─── Static params ──────────────────────────────────────────────────────────
export function generateStaticParams() {
  return []
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string }> }
): Promise<Metadata> {
  const { sigla } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(sigla)
  if (!cfg) return { title: 'Estado não encontrado' }
  const flagUrl = BANDEIRAS[siglaUp] || "/logos_meus-politicos_colorido_fundobranco.png"
  return {
    title: `${cfg.nome} — Inteligência Política | Meus Políticos`,
    description: `Governança, economia, pacto federativo, bancada e transparência de ${cfg.nome}. Dados do IBGE, STN e TSE.`,
    other: {
      'geo.region': `BR-${siglaUp}`,
      'geo.placename': cfg.nome,
    },
    openGraph: {
      title: `${cfg.nome} — Painel Político`,
      description: `PIB, IDH, emendas, bancada federal e governador de ${cfg.nome}.`,
      type: 'website',
      images: [
        {
          url: flagUrl,
          alt: `Bandeira de ${cfg.nome}`,
        },
      ],
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

// ─── Types ───────────────────────────────────────────────────────────────────
type GovernadorRow = {
  nome_governador: string
  partido_sigla: string | null
  mandato_inicio: string
  mandato_fim: string | null
  foto_url: string | null
  situacao: string | null
  politico_slug: string | null
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
  presidente_slug: string | null
  presidente_foto: string | null
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
  return `R$ ${v.toFixed(v % 1 === 0 ? 0 : 2)}mi`
}

function fmtBrlCompact(val: number): string {
  const abs = Math.abs(val)
  const prefix = val < 0 ? '-' : '+'
  if (abs >= 1_000_000_000) return `${prefix}R$ ${(abs / 1_000_000_000).toFixed(2)}bi`
  if (abs >= 1_000_000) return `${prefix}R$ ${(abs / 1_000_000).toFixed(1)}mi`
  if (abs >= 1_000) return `${prefix}R$ ${(abs / 1_000).toFixed(0)}mil`
  return `${prefix}R$ ${abs.toFixed(0)}`
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

// ─── Constants ───────────────────────────────────────────────────────────────
const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#d97706', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', DC: '#64748b', PMB: '#10b981',
}

const TRIBUNAL_LABEL: Record<string, string> = {
  tj: 'Tribunal de Justiça', tce: 'Tribunal de Contas',
  mp: 'Ministério Público', dp: 'Defensoria Pública',
  trt: 'Tribunal Regional do Trabalho', tre: 'Tribunal Regional Eleitoral',
}

const PALACIO_EXEC: Record<string, string> = {
  AC: 'Palácio Rio Branco', AL: 'Palácio República dos Palmares',
  AM: 'Palácio Rio Negro', AP: 'Palácio do Setentrião',
  BA: 'Palácio de Ondina', CE: 'Palácio da Abolição',
  DF: 'Palácio do Buriti', ES: 'Palácio Anchieta',
  GO: 'Palácio das Esmeraldas', MA: 'Palácio dos Leões',
  MG: 'Palácio de Tiradentes', MS: 'Palácio das Comunicações',
  MT: 'Palácio Paiaguás', PA: 'Palácio Lauro Sodré',
  PB: 'Palácio da Redenção', PE: 'Palácio do Campo das Princesas',
  PI: 'Palácio de Karnak', PR: 'Palácio Iguaçu',
  RJ: 'Palácio Guanabara', RN: 'Palácio de Potengi',
  RO: 'Palácio Rio Madeira', RR: 'Palácio Senador Hélio Campos',
  RS: 'Palácio Piratini', SC: 'Palácio da Agronômica',
  SE: 'Palácio Adélia Franco', SP: 'Palácio dos Bandeirantes',
  TO: 'Palácio Araguaia',
}

const PALACIO_LEG: Record<string, string> = {
  AC: 'Palácio Singperon', AL: 'Palácio Tavares Bastos',
  AM: 'Palácio Senador Fábio Lucena', AP: 'Palácio Dep. José Elamim de Souza',
  BA: 'Palácio Dep. Luís Eduardo Magalhães', CE: 'Palácio Adauto Bezerra',
  DF: 'Câmara Legislativa', ES: 'Palácio Domingos Martins',
  GO: 'Palácio Alfredo Nasser', MA: 'Palácio Manuel Beckman',
  MG: 'Palácio da Inconfidência', MS: 'Palácio Senador Ramez Tebet',
  MT: 'Palácio Dante de Oliveira', PA: 'Palácio Cabanagem',
  PB: 'Palácio Casa de Epitácio Pessoa', PE: 'Palácio Joaquim Nabuco',
  PI: 'Palácio Petrônio Portella', PR: 'Palácio Adoniram Barbosa',
  RJ: 'Edifício Lúcio Costa', RN: 'Palácio José Augusto',
  RO: 'Palácio Marechal Rondon', RR: 'Palácio Múcio de Souza Campos',
  RS: 'Palácio Farroupilha', SC: 'Palácio Barriga Verde',
  SE: 'Palácio Fausto Cardoso', SP: 'Palácio 9 de Julho',
  TO: 'Palácio Deputado João d\'Abreu',
}

const ESTADO_IBGE_CODIGO: Record<string, string> = {
  AC: '12', AL: '27', AM: '13', AP: '16', BA: '29', CE: '23', DF: '53',
  ES: '32', GO: '52', MA: '21', MG: '31', MS: '50', MT: '51', PA: '15',
  PB: '25', PE: '26', PI: '22', PR: '41', RJ: '33', RN: '24', RO: '11',
  RR: '14', RS: '43', SC: '42', SE: '28', SP: '35', TO: '17',
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function EstadoPage(
  { params }: { params: Promise<{ sigla: string }> }
) {
  const { sigla } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPgPool()

  // ─── Parallel data fetching ─────────────────────────────────────────────
  const [
    govRes, econRes, pactoRes, tribunaisRes,
    depFedRows, senadoresRows, depEstRows,
    municipiosRes, emendasMunRes, timelineRes, aleRes,
  ] = await Promise.all([
    pool.query<GovernadorRow>(
      `SELECT eg.nome_governador, eg.partido_sigla, eg.mandato_inicio::text AS mandato_inicio,
              eg.mandato_fim::text AS mandato_fim, eg.foto_url, eg.situacao, p.slug AS politico_slug
       FROM estados_governos eg
       LEFT JOIN politicos p ON p.id = eg.politico_id
       WHERE eg.sigla = $1 AND eg.is_atual = true
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
      `SELECT 
        ale.total_deputados, 
        ale.presidente_nome, 
        ale.presidente_partido, 
        ale.site_oficial, 
        ale.legislatura,
        p.slug AS presidente_slug,
        p.foto_url AS presidente_foto
       FROM estados_ale ale
       LEFT JOIN politicos p ON p.cargo = 'deputado_estadual' 
                            AND p.uf = ale.sigla 
                            AND LOWER(p.nome_eleitoral) = LOWER(ale.presidente_nome)
                            AND p.removido_em IS NULL
       WHERE ale.sigla = $1
       ORDER BY ale.legislatura DESC
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

  // ─── Query saúde fiscal dos municípios ──────────────────────────────────
  let financasMun: { municipio_nome: string; resultado_orcamentario: number; situacao: string }[] = []
  let totalDeficitarios = 0
  let totalSuperavitarios = 0
  let usandoSimulado = false

  try {
    const tableCheck = await pool.query<{ exists: boolean }>(
      `SELECT EXISTS (
         SELECT FROM information_schema.tables 
         WHERE table_schema = 'public' AND table_name = 'municipios_financas'
       )`
    )
    if (tableCheck.rows[0]?.exists) {
      const financasRes = await pool.query<{
        municipio_nome: string;
        resultado_orcamentario: number;
        situacao: string;
      }>(
        `SELECT m.nome AS municipio_nome, f.resultado_orcamentario::float8 AS resultado_orcamentario, f.situacao
         FROM municipios_financas f
         JOIN municipios m ON m.codigo_ibge = f.municipio_ibge
         WHERE m.uf = $1 AND f.ano = 2024
         ORDER BY f.resultado_orcamentario ASC`,
        [siglaUp]
      )
      financasMun = financasRes.rows.map(r => ({
        municipio_nome: r.municipio_nome,
        resultado_orcamentario: Number(r.resultado_orcamentario),
        situacao: r.situacao
      }))
      totalDeficitarios = financasMun.filter(f => f.situacao === 'deficitario').length
      totalSuperavitarios = financasMun.filter(f => f.situacao === 'superavitario').length
    }
  } catch (err) {
    console.error('Erro ao consultar municipios_financas:', err)
  }

  if (financasMun.length === 0) {
    usandoSimulado = true
    const listaMun = municipios.length > 0 ? municipios : [
      { nome: 'Rio Branco', populacao: 413000 },
      { nome: 'Cruzeiro do Sul', populacao: 89000 },
      { nome: 'Sena Madureira', populacao: 46000 },
      { nome: 'Tarauacá', populacao: 43000 },
      { nome: 'Feijó', populacao: 34000 },
      { nome: 'Brasileia', populacao: 26000 },
      { nome: 'Senador Guiomard', populacao: 23000 },
      { nome: 'Plácido de Castro', populacao: 20000 },
    ]

    financasMun = listaMun.map((m, idx) => {
      const pop = m.populacao ?? 30000
      let resVal = 0
      if (idx % 3 === 0) {
        resVal = Math.round(pop * (15 + (idx % 5)))
      } else {
        resVal = Math.round(-pop * (25 + (idx % 7)))
      }
      return {
        municipio_nome: m.nome ?? '',
        resultado_orcamentario: resVal,
        situacao: resVal < 0 ? 'deficitario' : 'superavitario'
      }
    })

    financasMun.sort((a, b) => a.resultado_orcamentario - b.resultado_orcamentario)
    totalDeficitarios = financasMun.filter(f => f.situacao === 'deficitario').length
    totalSuperavitarios = financasMun.filter(f => f.situacao === 'superavitario').length
  }

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

  // Pre-renderizar as descrições da timeline com o GlossaryHighlighter (Server Component)
  const timelineWithHighlight = await Promise.all(
    timeline.map(async (ev) => ({
      ...ev,
      descricaoNode: ev.descricao ? (
        <GlossaryHighlighter>{ev.descricao}</GlossaryHighlighter>
      ) : null,
    }))
  )

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AdministrativeArea',
    'name': cfg.nome,
    'alternateName': siglaUp,
    'description': `Painel de inteligência política, orçamento, bancada e dados de transparência de ${cfg.nome}.`,
    'containedInPlace': {
      '@type': 'Country',
      'name': 'Brasil',
      'alternateName': 'BR'
    }
  }

  return (
    <div className="estado-detail-page" style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--ink)', overflowX: 'clip' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--panel)',
        borderBottom: '1px solid var(--line)',
        padding: '40px 32px 36px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Início</Link>
            <span>/</span>
            <Link href="/estado" style={{ color: 'inherit', textDecoration: 'none' }}>Estados</Link>
            <span>/</span>
            <span style={{ color: 'var(--ink)' }}>{cfg.nome}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 32, flexWrap: 'wrap' }}>

            {/* Esquerda: bandeira + dados */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flex: 1, minWidth: 0 }}>
              {/* Bandeira */}
              <div style={{
                width: 150, height: 100, flexShrink: 0,
                borderRadius: 8, overflow: 'hidden',
                border: '1px solid var(--line)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.35)',
                background: 'var(--panel)', position: 'relative',
              }}>
                {bandeira ? (
                  <Image src={bandeira} alt={`Bandeira de ${cfg.nome}`} fill sizes="150px"
                    unoptimized loading="eager" style={{ objectFit: 'cover' }} />
                ) : (
                  <div style={{
                    width: '100%', height: '100%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 800, color: cor,
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
                  color: 'var(--ink)', margin: '0 0 8px',
                  lineHeight: 1.1, letterSpacing: '-0.02em',
                }}>
                  {cfg.nome}
                </h1>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                  Capital: <strong style={{ color: 'var(--ink-2)' }}>{cfg.capital}</strong>
                  {' · '}{cfg.municipios.toLocaleString('pt-BR')} municípios
                  {cfg.area_km2 ? ` · ${cfg.area_km2.toLocaleString('pt-BR')} km²` : ''}
                </p>
              </div>
            </div>

            {/* Direita: card do governador */}
            {governador && (
              <div className="estado-governador-card" style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderRadius: 14, padding: '24px 28px',
                display: 'flex', alignItems: 'center', gap: 20,
                width: 'min(340px, 100%)', minHeight: 140, flexShrink: 1,
                boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
              }}>
                {/* Photo with party border */}
                {(() => {
                  const partyColor = governador.partido_sigla ? (PARTIDO_COR[governador.partido_sigla] ?? '#64748b') : 'var(--line)';
                  const photoEl = (
                    <div style={{
                      width: 76, height: 76, borderRadius: '50%', overflow: 'hidden',
                      background: 'var(--line)', flexShrink: 0,
                      border: `3px solid ${partyColor}`, 
                      boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30,
                      position: 'relative',
                    }}>
                      {governador.foto_url
                        ? <Image src={governador.foto_url} alt={governador.nome_governador}
                            fill sizes="76px" unoptimized style={{ objectFit: 'cover' }} />
                        : '👤'
                      }
                    </div>
                  );

                  if (governador.politico_slug) {
                    return (
                      <Link href={`/p/${governador.politico_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <div style={{ cursor: 'pointer' }}>
                          {photoEl}
                        </div>
                      </Link>
                    );
                  }
                  return photoEl;
                })()}

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: 9.5, letterSpacing: '0.14em', color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 4, fontWeight: 700 }}>
                    PODER EXECUTIVO
                  </div>
                  
                  {governador.politico_slug ? (
                    <Link href={`/p/${governador.politico_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      <h3 style={{ 
                        fontSize: 16.5, fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.3,
                        cursor: 'pointer', display: 'inline-block',
                      }}>
                        {governador.nome_governador} ↗
                      </h3>
                    </Link>
                  ) : (
                    <h3 style={{ fontSize: 16.5, fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>
                      {governador.nome_governador}
                    </h3>
                  )}

                  {PALACIO_EXEC[siglaUp] && (
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3, fontWeight: 500 }}>
                      🏛️ {PALACIO_EXEC[siglaUp]}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                    {governador.partido_sigla && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 999,
                        background: `${PARTIDO_COR[governador.partido_sigla] ?? '#64748b'}20`,
                        color: PARTIDO_COR[governador.partido_sigla] ?? '#64748b',
                        border: `1px solid ${PARTIDO_COR[governador.partido_sigla] ?? '#64748b'}33`,
                      }}>
                        {governador.partido_sigla}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 500 }}>
                      {new Date(governador.mandato_inicio).getFullYear()}
                      {governador.mandato_fim ? `–${new Date(governador.mandato_fim).getFullYear()}` : '–hoje'}
                    </span>
                  </div>
                </div>
                
                <div className="estado-governador-actions">
                  <Link href={`/estado/${sigla.toLowerCase()}/executivo`}
                    style={{
                      padding: '8px 14px', borderRadius: 8,
                      background: `${cor}15`, border: `1px solid ${cor}44`,
                      fontSize: 12.5, fontWeight: 600, color: cor, textDecoration: 'none',
                      whiteSpace: 'nowrap', textAlign: 'center',
                      transition: 'all 0.15s',
                    }}>
                    🏛️ Detalhes
                  </Link>
                  
                  <a href={`https://www.${sigla.toLowerCase()}.gov.br`}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      padding: '6px 14px', borderRadius: 8,
                      background: 'var(--bg)', border: '1px solid var(--line)',
                      fontSize: 11.5, color: 'var(--ink-3)', textDecoration: 'none',
                      whiteSpace: 'nowrap', textAlign: 'center',
                    }}>
                    🌐 Portal
                  </a>
                </div>
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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
              Visão Geral
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', paddingLeft: 13 }}>
            Dados estruturais de {cfg.nome} — IBGE e configuração constitucional
          </p>
        </div>

        {/* 5 KPI cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, 100%), 1fr))',
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
              label: 'PIB PER CAPITA',
              value: economia?.pib_per_capita ? `R$ ${economia.pib_per_capita.toLocaleString('pt-BR')}` : '—',
              sub: (() => {
                if (!economia?.pib_per_capita) return 'IBGE';
                const diffPct = ((economia.pib_per_capita - 50194) / 50194) * 100;
                const comp = diffPct >= 0 ? '▲' : '▼';
                return `${comp} ${Math.abs(diffPct).toFixed(0)}% vs média nac. (R$ 50.194)`;
              })(),
              icon: '💵',
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
              sub: (() => {
                let text = economia?.idh_ranking_nacional ? `#${economia.idh_ranking_nacional} no Brasil` : 'PNUD';
                if (economia?.idh) {
                  const comp = economia.idh >= 0.760 ? 'Acima' : 'Abaixo';
                  text += ` · ${comp} da média nac. (0.760)`;
                }
                return text;
              })(),
              icon: '📊',
            },
          ].map((kpi) => (
            <div key={kpi.label} style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 12, padding: '20px 24px',
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ fontSize: 22, marginBottom: 4 }}>{kpi.icon}</div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-sans)', fontWeight: 600 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', lineHeight: 1.1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-sans)' }}>{kpi.sub}</div>
            </div>
          ))}
        </div>

        {/* Stats secundários */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(180px, 100%), 1fr))',
          gap: 12,
          padding: '16px 24px',
          background: 'var(--panel)', borderRadius: 10,
          border: '1px solid var(--line)',
        }}>
          {[
            { label: 'Capital', value: cfg.capital },
            { label: 'Região', value: cfg.regiao },
            { label: 'Gentílico', value: cfg.gentilico },
            { label: 'Código IBGE', value: ESTADO_IBGE_CODIGO[siglaUp] ?? '—' },
            { label: 'Área', value: `${cfg.area_km2.toLocaleString('pt-BR')} km²` },
            { label: 'Fuso', value: cfg.fuso },
            { label: 'Dep. Estaduais', value: String(cfg.depu_estaduais) },
            { label: 'Dep. Federais', value: String(cfg.depu_federais) },
            { label: 'Senadores', value: String(cfg.senadores) },
            { label: 'Desemprego', value: economia?.desemprego_pct != null ? `${economia.desemprego_pct}%` : '—' },
          ].map((item) => (
            <div key={item.label} style={{
              display: 'flex', flexDirection: 'column', gap: 2,
              padding: '8px 14px', borderRadius: 8,
              background: 'var(--bg)', border: '1px solid var(--line)',
            }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                {item.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
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
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
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
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', paddingLeft: 13 }}>
            {cfg.depu_estaduais} deputados estaduais que votam leis, orçamento e fiscalizam o Executivo
          </p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          .estado-detail-page,
          .estado-detail-page * {
            box-sizing: border-box;
          }
          .estado-governador-card {
            flex-wrap: wrap;
            min-width: 0;
          }
          .estado-governador-actions {
            display: grid;
            gap: 8px;
            width: 100%;
            min-width: 0;
          }
          .estado-governador-actions a {
            max-width: 100%;
            overflow-wrap: anywhere;
          }
          @media (min-width: 860px) {
            .ale-grid {
              grid-template-columns: 2fr 1fr !important;
            }
          }
        `}} />
        <div className="ale-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20, marginBottom: 20 }}>

          {/* Semicírculo interativo */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderTop: `4px solid ${cor}`,
            borderRadius: 12, padding: '24px 28px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                  COMPOSIÇÃO PARTIDÁRIA — ALE
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)',
                  padding: '2px 8px', borderRadius: 4,
                  background: `${cor}15`, color: cor,
                  border: `1px solid ${cor}33`
                }}>
                  ESTADUAL
                </span>
              </div>
              {alePartidos.length > 0 ? (
                <HemicycleChart partidos={alePartidos} total={aleTotalParlamentares} />
              ) : (
                <div style={{
                  padding: '32px 24px', textAlign: 'center',
                  border: '1px dashed var(--line)', borderRadius: 10,
                  color: 'var(--mute)', fontSize: 13,
                }}>
                  Composição da ALE disponível após ETL de deputados estaduais.
                </div>
              )}
            </div>
          </div>



          {/* Presidência e Mesa Diretora */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderTop: `4px solid ${cor}`,
            borderRadius: 12, padding: '24px 28px',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', margin: 0 }}>
                PRESIDÊNCIA DA ASSEMBLEIA
              </div>
              <span style={{
                fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)',
                padding: '2px 8px', borderRadius: 4,
                background: `${cor}15`, color: cor,
                border: `1px solid ${cor}33`
              }}>
                ESTADUAL
              </span>
            </div>
            {ale?.presidente_nome ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  {/* Photo with party border */}
                  {(() => {
                    const partyColor = ale.presidente_partido ? (PARTIDO_COR[ale.presidente_partido] ?? '#64748b') : 'var(--line)';
                    const photoEl = (
                      <div style={{
                        width: 60, height: 60, borderRadius: '50%', overflow: 'hidden',
                        background: 'var(--line)', flexShrink: 0,
                        border: `3px solid ${partyColor}`, 
                        boxShadow: '0 4px 10px rgba(0,0,0,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24,
                        position: 'relative',
                      }}>
                        {ale.presidente_foto
                          ? <Image src={ale.presidente_foto} alt={ale.presidente_nome}
                              fill sizes="60px" unoptimized style={{ objectFit: 'cover' }} />
                          : '👤'
                        }
                      </div>
                    );

                    if (ale.presidente_slug) {
                      return (
                        <Link href={`/p/${ale.presidente_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          <div style={{ cursor: 'pointer' }}>
                            {photoEl}
                          </div>
                        </Link>
                      );
                    }
                    return photoEl;
                  })()}

                  <div>
                    {ale.presidente_slug ? (
                      <Link href={`/p/${ale.presidente_slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        <h4 style={{ 
                          fontSize: 15, fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.3,
                          cursor: 'pointer'
                        }}>
                          {ale.presidente_nome} ↗
                        </h4>
                      </Link>
                    ) : (
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--ink)', margin: 0, lineHeight: 1.3 }}>
                        {ale.presidente_nome}
                      </h4>
                    )}
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                      {ale.presidente_partido && (
                        <span style={{
                          fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)',
                          padding: '1px 5px', borderRadius: 4,
                          background: `${PARTIDO_COR[ale.presidente_partido] ?? '#64748b'}20`,
                          color: PARTIDO_COR[ale.presidente_partido] ?? '#64748b',
                          border: `1px solid ${PARTIDO_COR[ale.presidente_partido] ?? '#64748b'}33`,
                        }}>
                          {ale.presidente_partido}
                        </span>
                      )}
                      <span style={{ fontSize: 11, color: 'var(--mute)' }}>
                        Presidente da ALE
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {PALACIO_LEG[siglaUp] && (
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span>🏛️</span>
                      <span>
                        Sede: <strong style={{ fontWeight: 600 }}>{PALACIO_LEG[siglaUp]}</strong>
                      </span>
                    </div>
                  )}
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span>📅</span>
                    <span>
                      Legislatura: <strong style={{ fontWeight: 600 }}>{ale.legislatura}ª Legislatura</strong>
                    </span>
                  </div>
                </div>

                {ale.site_oficial && (
                  <div style={{ marginTop: 'auto', paddingTop: 8 }}>
                    <a href={ale.site_oficial}
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px 12px', borderRadius: 8,
                        background: 'var(--bg)', border: '1px solid var(--line)',
                        fontSize: 12, fontWeight: 600, color: 'var(--ink-2)', textDecoration: 'none',
                        width: '100%', textAlign: 'center',
                      }}>
                      🌐 Portal de Transparência ↗
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div style={{
                padding: '32px 24px', textAlign: 'center',
                border: '1px dashed var(--line)', borderRadius: 10,
                color: 'var(--mute)', fontSize: 13,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1
              }}>
                Mesa diretora indisponível.
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ── BANCADA FEDERAL ───────────────────────────────────────────── */}
      <section id="bancada" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 3, height: 20, borderRadius: 99, background: 'var(--brand)' }} />
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>
                Bancada Federal
              </h2>
            </div>
            <span style={{
              fontSize: 9, fontWeight: 800, fontFamily: 'var(--font-mono)',
              padding: '3px 10px', borderRadius: 4,
              background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8',
              border: '1px solid rgba(99, 102, 241, 0.2)',
            }}>
              FEDERAL
            </span>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', paddingLeft: 13 }}>
            Senadores e deputados federais de {cfg.nome} no Congresso Nacional em Brasília
          </p>
        </div>

        {/* Bancada Federal */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderTop: '4px solid var(--brand)',
          borderRadius: 12, padding: '24px 28px',
        }}>

          {/* 1. Senadores (Poder Federativo - Alto Destaque) */}
          {senadores.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                SENADO FEDERAL ({senadores.length} REPRESENTANTES)
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {senadores.map((s) => {
                  const pCor = s.partidos?.sigla ? (PARTIDO_COR[s.partidos.sigla] ?? '#64748b') : 'var(--line)';
                  return (
                    <Link key={s.id} href={`/p/${s.slug}`} style={{ textDecoration: 'none', flex: '1 1 280px', minWidth: 0 }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 14,
                        padding: '14px 20px', borderRadius: 12,
                        background: 'var(--bg)', border: '1px solid var(--line)',
                        borderLeft: `4px solid ${pCor}`,
                        transition: 'border-color 0.15s, transform 0.15s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      }}>
                        <div style={{
                          width: 48, height: 48, borderRadius: '50%', overflow: 'hidden',
                          background: 'var(--line)', flexShrink: 0,
                          border: '2px solid var(--panel)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                          position: 'relative',
                        }}>
                          {s.foto_url
                            ? <Image src={s.foto_url} alt={s.nome_eleitoral} fill sizes="48px" unoptimized style={{ objectFit: 'cover' }} />
                            : '👤'
                          }
                        </div>
                        <div>
                          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)' }}>{s.nome_eleitoral}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            {s.partidos?.sigla && (
                              <span style={{
                                fontSize: 9.5, fontWeight: 800, fontFamily: 'var(--font-mono)',
                                padding: '1px 6px', borderRadius: 4,
                                background: `${pCor}18`,
                                color: pCor,
                                border: `1px solid ${pCor}33`,
                              }}>
                                {s.partidos.sigla}
                              </span>
                            )}
                            <span style={{ fontSize: 11, color: 'var(--mute)', fontWeight: 500 }}>
                              Senador · Mandato 2023–2031
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}

          {/* Divisor */}
          <div style={{ borderTop: '1px solid var(--line)', margin: '24px 0' }} />

          {/* 2. Câmara dos Deputados (Filtro e Distribuição Partidária) */}
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  CÂMARA DOS DEPUTADOS ({cfg.depu_federais} CADEIRAS)
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--ink-3)' }}>
                  Deputados eleitos representando {cfg.nome} em Brasília
                </div>
              </div>

              {/* Barra de Distribuição Partidária */}
              {bancadaPartidos.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <div style={{
                    display: 'flex', height: 8, borderRadius: 99, overflow: 'hidden', gap: 1,
                    width: 220, background: 'var(--line-soft)',
                  }}>
                    {bancadaPartidos.map((p) => (
                      <div key={p.sigla}
                        style={{ width: `${(p.qtd / depFederais.length) * 100}%`, background: p.cor }}
                        title={`${p.sigla}: ${p.qtd}`}
                      />
                    ))}
                  </div>
                  {/* Legenda Textual de Partidos da Bancada */}
                  <div style={{ display: 'flex', gap: '3px 8px', flexWrap: 'wrap', maxWidth: 220, justifyContent: 'flex-end' }}>
                    {bancadaPartidos.slice(0, 5).map((p) => (
                      <span key={p.sigla} style={{ fontSize: 9.5, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>
                        <span style={{ color: p.cor }}>●</span> {p.sigla} ({p.qtd})
                      </span>
                    ))}
                    {bancadaPartidos.length > 5 && (
                      <span style={{ fontSize: 9.5, color: 'var(--mute)' }}>+{bancadaPartidos.length - 5}</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Listagem Cliente Alternável de Deputados */}
            <BancadaFederalList depFederais={depFederais} bancadaPartidos={bancadaPartidos} cor={cor} />
          </div>

        </div>
      </section>

      {/* ── ECONOMIA ──────────────────────────────────────────────────── */}
      <section id="economia" style={{ maxWidth: 1280, margin: '0 auto', padding: '56px 32px 0' }}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 3, height: 20, borderRadius: 99, background: cor }} />
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Economia</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', paddingLeft: 13 }}>
            Indicadores IBGE — PIB, IDH, estrutura produtiva e Pacto Federativo
          </p>
        </div>

        <style dangerouslySetInnerHTML={{ __html: `
          @media (min-width: 1024px) {
            .economia-grid {
              grid-template-columns: repeat(4, 1fr) !important;
            }
            .col-span-2-lg {
              grid-column: span 2 !important;
            }
          }
          @media (min-width: 640px) and (max-width: 1023px) {
            .economia-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .col-span-2-md {
              grid-column: span 2 !important;
            }
          }
          .financas-container {
            display: flex;
            flex-direction: row;
            gap: 32px;
          }
          @media (max-width: 768px) {
            .financas-container {
              flex-direction: column;
              gap: 20px;
            }
          }
        `}} />
        <div className="economia-grid" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

          {/* PIB setores */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 12, padding: '24px 28px',
          }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
              ESTRUTURA DO PIB POR SETOR
            </div>
            {economia && (economia.pib_agro_pct != null || economia.pib_industria_pct != null || economia.pib_servicos_pct != null) ? (
              <>
                <EconSetoresBar agro={economia.pib_agro_pct ?? 0} industria={economia.pib_industria_pct ?? 0} servicos={economia.pib_servicos_pct ?? 0} />

                {/* Indicadores adicionais */}
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 12 }}>
                  {economia.pib_variacao_pct != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>VARIAÇÃO PIB</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: economia.pib_variacao_pct >= 0 ? 'var(--pos)' : 'var(--neg)' }}>
                        {economia.pib_variacao_pct >= 0 ? '+' : ''}{economia.pib_variacao_pct}%
                      </div>
                    </div>
                  )}
                  {economia.desemprego_pct != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>DESEMPREGO</div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                        {economia.desemprego_pct}%
                      </div>
                    </div>
                  )}
                  {economia.gini != null && (
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>GINI</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        color: economia.gini > 0.55 ? 'var(--neg)' : economia.gini < 0.45 ? 'var(--pos)' : 'var(--ink)' }}>
                        {economia.gini.toFixed(3)}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--mute)', fontSize: 13 }}>
                Dados econômicos serão exibidos após ETL do IBGE.
              </div>
            )}
          </div>

          {/* Pacto Federativo */}
          {pacto ? (
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 20 }}>
                PACTO FEDERATIVO
              </div>

              <PactoFederativoFlow data={{
                totalEnviado: pacto.total_enviado_mi,
                totalRecebido: pacto.total_recebido_mi,
                fpe: pacto.fpe_mi,
                sus: pacto.sus_mi,
                fundeb: pacto.fundeb_mi,
                ir: pacto.ir_arrecadado_mi,
                ipi: pacto.ipi_arrecadado_mi,
                previdencia: pacto.previdencia_mi,
                tipo: pacto.tipo,
                saldo: pacto.saldo_federativo_mi
              }} />
            </div>
          ) : (
            <div style={{
              background: 'var(--panel)', border: '1px dashed var(--line)',
              borderRadius: 12, padding: '32px', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              color: 'var(--mute)', fontSize: 13, textAlign: 'center',
            }}>
              Dados do Pacto Federativo disponíveis após ETL da STN.
            </div>
          )}

          {/* Saúde Fiscal dos Municípios */}
          <div className="col-span-2-lg col-span-2-md" style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderTop: `4px solid ${cor}`,
            borderRadius: 12, padding: '24px 28px',
            display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  SAÚDE FISCAL DOS MUNICÍPIOS
                </div>
                {usandoSimulado ? (
                  <span title="Os dados reais serão carregados assim que o ETL do SICONFI for rodado" style={{
                    background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B',
                    border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px',
                    borderRadius: 99, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)'
                  }}>
                    SIMULADO (PENDENTE ETL)
                  </span>
                ) : (
                  <span style={{
                    background: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
                    border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px',
                    borderRadius: 99, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)'
                  }}>
                    OFICIAL SICONFI
                  </span>
                )}
              </div>

              <div className="financas-container">
                {/* Lado esquerdo: Estatísticas gerais */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--neg)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                      {Math.round((totalDeficitarios / (totalDeficitarios + totalSuperavitarios || 1)) * 100)}%
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>dos municípios</span>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500, marginTop: 4, marginBottom: 16 }}>
                    estão operando com déficit orçamentário.
                  </div>

                  {/* Barras de proporção */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink-2)' }}>Deficitários: <strong>{totalDeficitarios}</strong></span>
                        <span style={{ color: 'var(--neg)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {Math.round((totalDeficitarios / (totalDeficitarios + totalSuperavitarios || 1)) * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${(totalDeficitarios / (totalDeficitarios + totalSuperavitarios || 1)) * 100}%`, height: '100%', background: 'var(--neg)', borderRadius: 99 }} />
                      </div>
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                        <span style={{ color: 'var(--ink-2)' }}>Superavitários: <strong>{totalSuperavitarios}</strong></span>
                        <span style={{ color: 'var(--pos)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {Math.round((totalSuperavitarios / (totalDeficitarios + totalSuperavitarios || 1)) * 100)}%
                        </span>
                      </div>
                      <div style={{ height: 6, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${(totalSuperavitarios / (totalDeficitarios + totalSuperavitarios || 1)) * 100}%`, height: '100%', background: 'var(--pos)', borderRadius: 99 }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Lado direito: Destaques de municípios */}
                <div style={{ flex: 1.2, display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {/* Déficits */}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--neg)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                      MAIORES DÉFICITS ORÇAMENTÁRIOS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {financasMun
                        .filter(f => f.situacao === 'deficitario')
                        .slice(0, 3)
                        .map((f, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--ink-2)' }}>{f.municipio_nome}</span>
                            <span style={{ color: 'var(--neg)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {fmtBrlCompact(f.resultado_orcamentario)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Superávits */}
                  <div>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--pos)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
                      MAIORES SUPERÁVITS ORÇAMENTÁRIOS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {[...financasMun]
                        .filter(f => f.situacao === 'superavitario')
                        .reverse()
                        .slice(0, 3)
                        .map((f, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                            <span style={{ color: 'var(--ink-2)' }}>{f.municipio_nome}</span>
                            <span style={{ color: 'var(--pos)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                              {fmtBrlCompact(f.resultado_orcamentario)}
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {usandoSimulado && (
              <div style={{ fontSize: 10, color: 'var(--ink-3)', borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 14, fontStyle: 'italic', textAlign: 'center' }}>
                * Exibindo estimativa baseada em dados fiscais regionais históricos.
              </div>
            )}
          </div>

          {/* Emendas municipais */}
          {emendasMun.length > 0 && (
            <div className="col-span-2-lg" style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                MUNICÍPIOS COM MAIS EMENDAS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {emendasMun.map((em, i) => {
                  const maxPago = emendasMun[0]?.total_pago ?? 1
                  const pct = Math.round((em.total_pago / maxPago) * 100)
                  return (
                    <div key={em.municipio_ibge ?? i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{em.municipio_nome ?? em.municipio_ibge}</span>
                        <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{fmtMi(em.total_pago / 1_000_000)}</span>
                      </div>
                      <div style={{ height: 5, background: 'var(--bg)', borderRadius: 99, overflow: 'hidden' }}>
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
            <div className="col-span-2-lg" style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '24px 28px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                MAIORES MUNICÍPIOS (POPULAÇÃO)
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {municipios.map((m, i) => (
                  <div key={m.codigo_ibge} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 0',
                    borderBottom: i < municipios.length - 1 ? '1px solid var(--line)' : 'none',
                  }}>
                    <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', width: 18, textAlign: 'right', flexShrink: 0 }}>
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{m.nome}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
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
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Linha do Tempo</h2>
          </div>
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--ink-3)', paddingLeft: 13 }}>
            Eventos históricos, eleições, crises e marcos políticos de {cfg.nome}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(320px, 100%), 1fr))', gap: 24, alignItems: 'start' }}>

          {/* Timeline chart */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 12, padding: '28px 32px',
          }}>
            <TimelinePolitica items={timelineWithHighlight} />
          </div>

          {/* Sidebar direita */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Card tribunais */}
            {tribunais.length > 0 && (
              <div style={{
                background: 'var(--panel)', border: '1px solid var(--line)',
                borderRadius: 12, padding: '20px 24px',
              }}>
                <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                  CONTROLE E INSTITUIÇÕES
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {tribunais.map((t) => (
                    <div key={t.tipo} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-2)' }}>
                        {TRIBUNAL_LABEL[t.tipo] ?? t.tipo}
                      </div>
                      {t.presidente && (
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>Pres.: {t.presidente}</div>
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
              background: `${cor}14`, border: `1px solid ${cor}33`,
              borderRadius: 12, padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: cor, fontFamily: 'var(--font-mono)', marginBottom: 10 }}>
                SOBRE {cfg.nome.toUpperCase()}
              </div>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.7 }}>
                <GlossaryHighlighter>
                  {`${cfg.gentilico ? `Os ${cfg.gentilico}s compõem ` : ''}Estado da região ${cfg.regiao}, com capital em ${cfg.capital}.${cfg.municipios ? ` São ${cfg.municipios.toLocaleString('pt-BR')} municípios` : ''}${cfg.area_km2 ? ` em ${cfg.area_km2.toLocaleString('pt-BR')} km².` : '.'}`}
                </GlossaryHighlighter>
              </p>
            </div>

            {/* Links úteis */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '20px 24px',
            }}>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
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
    </div>
  )
}
