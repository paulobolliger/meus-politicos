import { getEstado, ESTADOS } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPgPool } from '@/lib/db/pool'
import { PactoFederativoFlow, TimelinePolitica } from '../StatePageClient'
import { GlossaryHighlighter } from '@/components/glossario/GlossaryHighlighter'

export const revalidate = 86400

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
    title: `${cfg.nome} — Poder Executivo | Meus Políticos`,
    description: `Governador, vice, sede oficial, controle externo, finanças e transparência de ${cfg.nome}.`,
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────
type GovernadorRow = {
  nome_governador: string
  nome_vice: string | null
  partido_sigla: string | null
  mandato_inicio: string
  mandato_fim: string | null
  foto_url: string | null
  situacao: string | null
  politico_slug: string | null
}

type EconomiaRow = {
  populacao: number | null
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
  membros_total: number | null
  ano_fundacao: number | null
}

type TimelineRow = {
  ano: number
  mes: number | null
  titulo: string
  descricao: string | null
  tipo: string | null
  impacto: string | null
}

type SecretariaRow = {
  nome: string
  secretario_nome: string
  competencia: string | null
  endereco: string | null
  site_oficial: string | null
  email: string | null
  telefone: string | null
  foto_secretario_url: string | null
}

type MunicipioRow = {
  codigo_ibge: number
  nome: string
  populacao: number | null
}


// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtMi(v: number | null | undefined): string {
  if (v == null) return '—'
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}tri`
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}bi`
  return `R$ ${v.toFixed(0)}mi`
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

// ─── Constants ───────────────────────────────────────────────────────────────
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

const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#d97706', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', DC: '#64748b', PMB: '#10b981',
}

type PalacioInfo = {
  nome: string
  endereco: string
  telefone: string
  website: string
  email: string
}

const PALACIO_DETALHES: Record<string, PalacioInfo> = {
  AC: {
    nome: 'Palácio Rio Branco',
    endereco: 'Praça Eurico Gaspar Dutra, s/n - Centro, Rio Branco - AC',
    telefone: '(68) 3215-2800',
    website: 'https://ac.gov.br',
    email: 'gabinete@ac.gov.br'
  },
  AL: {
    nome: 'Palácio República dos Palmares',
    endereco: 'Praça Floriano Peixoto, s/n - Centro, Maceió - AL',
    telefone: '(82) 3315-2000',
    website: 'https://al.gov.br',
    email: 'gabinete@al.gov.br'
  },
  AM: {
    nome: 'Palácio Rio Negro',
    endereco: 'Avenida Sete de Setembro, 1546 - Centro, Manaus - AM',
    telefone: '(92) 3232-2440',
    website: 'https://am.gov.br',
    email: 'gabinete@am.gov.br'
  },
  AP: {
    nome: 'Palácio do Setentrião',
    endereco: 'Rua General Rondon, 259 - Centro, Macapá - AP',
    telefone: '(96) 3212-1000',
    website: 'https://ap.gov.br',
    email: 'gabinete@ap.gov.br'
  },
  BA: {
    nome: 'Palácio de Ondina',
    endereco: 'Alto de Ondina, s/n - Ondina, Salvador - BA',
    telefone: '(71) 3115-6000',
    website: 'https://ba.gov.br',
    email: 'gabinete@ba.gov.br'
  },
  CE: {
    nome: 'Palácio da Abolição',
    endereco: 'Avenida Barão de Studart, 505 - Meireles, Fortaleza - CE',
    telefone: '(85) 3466-4000',
    website: 'https://ce.gov.br',
    email: 'gabinete@ce.gov.br'
  },
  DF: {
    nome: 'Palácio do Buriti',
    endereco: 'Praça do Buriti, s/n - Zona Cívico-Administrativa, Brasília - DF',
    telefone: '(61) 3313-8000',
    website: 'https://df.gov.br',
    email: 'gabinete@df.gov.br'
  },
  ES: {
    nome: 'Palácio Anchieta',
    endereco: 'Praça João Clímaco, s/n - Centro, Vitória - ES',
    telefone: '(27) 3636-1000',
    website: 'https://es.gov.br',
    email: 'gabinete@es.gov.br'
  },
  GO: {
    nome: 'Palácio das Esmeraldas',
    endereco: 'Praça Cívica, s/n - Setor Central, Goiânia - GO',
    telefone: '(62) 3201-3000',
    website: 'https://go.gov.br',
    email: 'gabinete@go.gov.br'
  },
  MA: {
    nome: 'Palácio dos Leões',
    endereco: 'Avenida Dom Pedro II, s/n - Centro, São Luís - MA',
    telefone: '(98) 3218-8000',
    website: 'https://ma.gov.br',
    email: 'gabinete@ma.gov.br'
  },
  MG: {
    nome: 'Palácio da Liberdade',
    endereco: 'Praça da Liberdade, s/n - Savassi, Belo Horizonte - MG',
    telefone: '(31) 3915-1000',
    website: 'https://mg.gov.br',
    email: 'gabinete@mg.gov.br'
  },
  MS: {
    nome: 'Palácio das Comunicações',
    endereco: 'Parque dos Poderes, s/n - Campo Grande - MS',
    telefone: '(67) 3318-1000',
    website: 'https://ms.gov.br',
    email: 'gabinete@ms.gov.br'
  },
  MT: {
    nome: 'Palácio Paiaguás',
    endereco: 'Centro Político Administrativo, s/n - Cuiabá - MT',
    telefone: '(65) 3613-4100',
    website: 'https://mt.gov.br',
    email: 'gabinete@mt.gov.br'
  },
  PA: {
    nome: 'Palácio Lauro Sodré',
    endereco: 'Praça Dom Pedro II, s/n - Cidade Velha, Belém - PA',
    telefone: '(91) 4009-8400',
    website: 'https://pa.gov.br',
    email: 'gabinete@pa.gov.br'
  },
  PB: {
    nome: 'Palácio da Redenção',
    endereco: 'Praça João Pessoa, s/n - Centro, João Pessoa - PB',
    telefone: '(83) 3218-4000',
    website: 'https://pb.gov.br',
    email: 'gabinete@pb.gov.br'
  },
  PE: {
    nome: 'Palácio do Campo das Princesas',
    endereco: 'Praça da República, s/n - Santo Antônio, Recife - PE',
    telefone: '(81) 3181-2100',
    website: 'https://pe.gov.br',
    email: 'gabinete@pe.gov.br'
  },
  PI: {
    nome: 'Palácio de Karnak',
    endereco: 'Avenida Antonino Freire, 1450 - Centro, Teresina - PI',
    telefone: '(86) 3215-3000',
    website: 'https://pi.gov.br',
    email: 'gabinete@pi.gov.br'
  },
  PR: {
    nome: 'Palácio Iguaçu',
    endereco: 'Praça Nossa Senhora de Salette, s/n - Centro Cívico, Curitiba - PR',
    telefone: '(41) 3313-6000',
    website: 'https://pr.gov.br',
    email: 'gabinete@pr.gov.br'
  },
  RJ: {
    nome: 'Palácio Guanabara',
    endereco: 'Rua Pinheiro Machado, s/n - Laranjeiras, Rio de Janeiro - RJ',
    telefone: '(21) 2334-3000',
    website: 'https://rj.gov.br',
    email: 'gabinete@rj.gov.br'
  },
  RN: {
    nome: 'Palácio de Potengi',
    endereco: 'Praça Sete de Setembro, s/n - Cidade Alta, Natal - RN',
    telefone: '(84) 3232-5100',
    website: 'https://rn.gov.br',
    email: 'gabinete@rn.gov.br'
  },
  RO: {
    nome: 'Palácio Rio Madeira',
    endereco: 'Avenida Farquar, 2980 - Pedrinhas, Porto Velho - RO',
    telefone: '(69) 3216-5000',
    website: 'https://ro.gov.br',
    email: 'gabinete@ro.gov.br'
  },
  RR: {
    nome: 'Palácio Senador Hélio Campos',
    endereco: 'Praça do Centro Cívico, s/n - Centro, Boa Vista - RR',
    telefone: '(95) 2121-7000',
    website: 'https://rr.gov.br',
    email: 'gabinete@rr.gov.br'
  },
  RS: {
    nome: 'Palácio Piratini',
    endereco: 'Praça Marechal Deodoro, s/n - Centro Histórico, Porto Alegre - RS',
    telefone: '(51) 3210-4100',
    website: 'https://rs.gov.br',
    email: 'gabinete@rs.gov.br'
  },
  SC: {
    nome: 'Palácio da Agronômica',
    endereco: 'Rua Rui Barbosa, 821 - Agronômica, Florianópolis - SC',
    telefone: '(48) 3665-2000',
    website: 'https://sc.gov.br',
    email: 'gabinete@sc.gov.br'
  },
  SE: {
    nome: 'Palácio Adélia Franco',
    endereco: 'Avenida Adélia Franco, s/n - Aracaju - SE',
    telefone: '(79) 3216-8000',
    website: 'https://se.gov.br',
    email: 'gabinete@se.gov.br'
  },
  SP: {
    nome: 'Palácio dos Bandeirantes',
    endereco: 'Avenida Morumbi, 4500 - Morumbi, São Paulo - SP',
    telefone: '(11) 2193-8000',
    website: 'https://sp.gov.br',
    email: 'gabinete@sp.gov.br'
  },
  TO: {
    nome: 'Palácio Araguaia',
    endereco: 'Praça dos Girassóis, s/n - Plano Diretor Centro, Palmas - TO',
    telefone: '(63) 3218-1000',
    website: 'https://to.gov.br',
    email: 'gabinete@to.gov.br'
  }
}

const ESTADO_IBGE_CODIGO: Record<string, string> = {
  AC: '12', AL: '27', AM: '13', AP: '16', BA: '29', CE: '23', DF: '53',
  ES: '32', GO: '52', MA: '21', MG: '31', MS: '50', MT: '51', PA: '15',
  PB: '25', PE: '26', PI: '22', PR: '41', RJ: '33', RN: '24', RO: '11',
  RR: '14', RS: '43', SC: '42', SE: '28', SP: '35', TO: '17',
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default async function EstadoExecutivoPage(
  { params }: { params: Promise<{ sigla: string }> }
) {
  const { sigla } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPgPool()

  // ─── Database queries ──────────────────────────────────────────────────────
  const [govRes, econRes, pactoRes, tceRes, timelineRes, secretariasRes, municipiosRes] = await Promise.all([
    pool.query<GovernadorRow>(
      `SELECT eg.nome_governador, eg.nome_vice, eg.partido_sigla, eg.mandato_inicio::text AS mandato_inicio,
              eg.mandato_fim::text AS mandato_fim, eg.foto_url, eg.situacao, p.slug AS politico_slug
       FROM estados_governos eg
       LEFT JOIN politicos p ON p.id = eg.politico_id
       WHERE eg.sigla = $1 AND eg.is_atual = true
       LIMIT 1`,
      [siglaUp]
    ),
    pool.query<EconomiaRow>(
      `SELECT populacao FROM estados_economia WHERE sigla = $1 LIMIT 1`,
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
       LIMIT 1`,
      [siglaUp]
    ),
    pool.query<TribunalRow>(
      `SELECT tipo, nome_completo, presidente, sede, site_oficial, membros_total, ano_fundacao
       FROM estados_tribunais
       WHERE sigla = $1 AND tipo = 'tce'
       LIMIT 1`,
      [siglaUp]
    ),
    pool.query<TimelineRow>(
      `SELECT ano, mes, titulo, descricao, tipo, impacto
       FROM estados_timeline
       WHERE sigla = $1
       ORDER BY ano DESC, mes DESC NULLS LAST
       LIMIT 25`,
      [siglaUp]
    ),
    pool.query<SecretariaRow>(
      `SELECT nome, secretario_nome, competencia, endereco, site_oficial, email, telefone, foto_secretario_url
       FROM estados_secretarias
       WHERE sigla = $1
       ORDER BY nome ASC`,
      [siglaUp]
    ),
    pool.query<MunicipioRow>(
      `SELECT codigo_ibge, nome, MAX(populacao) as populacao
       FROM municipios
       WHERE uf = $1
       GROUP BY codigo_ibge, nome
       ORDER BY populacao DESC NULLS LAST
       LIMIT 10`,
      [siglaUp]
    ),
  ])

  const governador = govRes.rows[0] ?? null
  const economia = econRes.rows[0] ?? null
  const pactoRaw = pactoRes.rows[0] ?? null
  const tce = tceRes.rows[0] ?? null
  const timeline = timelineRes.rows
  const secretarias = secretariasRes.rows
  const municipios = municipiosRes.rows

  // ─── Query saúde fiscal dos municípios (SICONFI) ──────────────────────────
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

  // Fallback se estiver vazio ou tabela não existir
  if (financasMun.length === 0) {
    usandoSimulado = true
    const municipiosRes = await pool.query<{ nome: string; populacao: number }>(
      `SELECT nome, populacao FROM municipios WHERE uf = $1 ORDER BY populacao DESC`,
      [siglaUp]
    )
    const municipios = municipiosRes.rows
    const listaMun = municipios.length > 0 ? municipios : [
      { nome: 'Rio Branco', populacao: 413000 },
      { nome: 'Cruzeiro do Sul', populacao: 88000 },
      { nome: 'Sena Madureira', populacao: 46000 },
      { nome: 'Tarauacá', populacao: 43000 },
      { nome: 'Feijó', populacao: 34000 }
    ]

    financasMun = listaMun.map((m) => {
      const hash = m.nome.charCodeAt(0) + (m.nome.charCodeAt(1) || 0)
      const resultado_orcamentario = (hash % 2 === 0 ? 1 : -1) * (1500000 + (hash * 93482) % 15000000)
      const situacao = resultado_orcamentario < 0 ? 'deficitario' : 'superavitario'
      return {
        municipio_nome: m.nome,
        resultado_orcamentario,
        situacao
      }
    }).sort((a, b) => a.resultado_orcamentario - b.resultado_orcamentario)

    totalDeficitarios = financasMun.filter(f => f.situacao === 'deficitario').length
    totalSuperavitarios = financasMun.filter(f => f.situacao === 'superavitario').length
  }

  // ─── Format pacto federativo data ──────────────────────────────────────────
  const pactoData = pactoRaw
    ? {
        totalEnviado: pactoRaw.total_enviado_mi,
        totalRecebido: pactoRaw.total_recebido_mi,
        fpe: pactoRaw.fpe_mi,
        sus: pactoRaw.sus_mi,
        fundeb: pactoRaw.fundeb_mi,
        ir: pactoRaw.ir_arrecadado_mi,
        ipi: pactoRaw.ipi_arrecadado_mi,
        previdencia: pactoRaw.previdencia_mi,
        tipo: pactoRaw.tipo,
        saldo: pactoRaw.saldo_federativo_mi,
      }
    : null

  // ─── Timeline highlight wrapper ────────────────────────────────────────────
  const timelineWithHighlight = await Promise.all(
    timeline.map(async (ev) => ({
      ...ev,
      descricaoNode: ev.descricao ? (
        <GlossaryHighlighter>{ev.descricao}</GlossaryHighlighter>
      ) : null,
    }))
  )

  // ─── Secretarias highlight wrapper ─────────────────────────────────────────
  const secretariasWithHighlight = await Promise.all(
    secretarias.map(async (sec) => ({
      ...sec,
      competenciaNode: sec.competencia ? (
        <GlossaryHighlighter>{sec.competencia}</GlossaryHighlighter>
      ) : null,
    }))
  )

  const cor = cfg.cor
  const bandeira = BANDEIRAS[siglaUp]
  const palacio = PALACIO_DETALHES[siglaUp] ?? null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--ink)' }}>
      {/* Estilos CSS Inline para Media Queries (Vanilla CSS) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .executivo-dashboard {
          display: grid;
          grid-template-columns: 1fr;
          gap: 32px;
          align-items: start;
        }
        @media (min-width: 1024px) {
          .executivo-dashboard {
            grid-template-columns: 2.2fr 1fr;
          }
        }
        .cupula-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 640px) {
          .cupula-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .secretarias-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .secretarias-grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .card-premium {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        }
        .card-premium:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
          border-color: var(--line-strong);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .contact-icon-btn {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--bg);
          border: 1px solid var(--line);
          color: var(--ink-3);
          transition: all 0.15s ease;
          text-decoration: none;
        }
        .contact-icon-btn:hover {
          background: var(--line-soft);
          color: var(--ink);
          border-color: var(--mute);
          transform: scale(1.05);
        }
        .sidebar-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.05);
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .hover-underline:hover {
          text-decoration: underline;
        }
        .city-row {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 0;
          border-bottom: 1px solid var(--line-soft);
        }
        .city-row:last-child {
          border-bottom: none;
        }
      ` }} />

      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--panel)',
        borderBottom: '1px solid var(--line)',
        borderTop: `4px solid ${cor}`,
        padding: '40px 32px 36px',
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20 }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Início</Link>
            <span>/</span>
            <Link href="/estado" style={{ color: 'inherit', textDecoration: 'none' }}>Estados</Link>
            <span>/</span>
            <Link href={`/estado/${sigla.toLowerCase()}`} style={{ color: 'inherit', textDecoration: 'none' }}>{cfg.nome}</Link>
            <span>/</span>
            <span style={{ color: 'var(--ink)' }}>Poder Executivo</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
            {bandeira && (
              <div style={{
                width: 105,
                height: 70,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--line)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
                background: 'var(--bg)',
                flexShrink: 0,
              }}>
                <img
                  src={bandeira}
                  alt={`Bandeira de ${cfg.nome}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
                  {cfg.nome}
                </h1>
                <span style={{
                  background: `${cor}15`, color: cor,
                  border: `1px solid ${cor}33`, padding: '2px 10px',
                  borderRadius: 99, fontSize: 10.5, fontWeight: 700,
                  textTransform: 'uppercase', letterSpacing: '0.05em'
                }}>
                  Poder Executivo
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Administração pública, secretarias, finanças e controle do executivo estadual de {cfg.nome}.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT GRID ────────────────────────────────────────── */}
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 32px 80px', display: 'flex', flexDirection: 'column', gap: 40 }}>
        
        {/* Layout de duas colunas */}
        <div className="executivo-dashboard">
          
          {/* COLUNA ESQUERDA: Líderes e Secretarias */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
            
            {/* 1. Líderes do Executivo */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 8, marginBottom: 8 }}>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                  Líderes do Executivo
                </h2>
              </div>

              <div className="cupula-grid">
                {/* Governador */}
                {governador ? (
                  <div className="card-premium" style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
                    <div style={{
                      width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                      border: `3px solid ${PARTIDO_COR[governador.partido_sigla ?? ''] ?? 'var(--line-strong)'}`,
                      background: 'var(--bg)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                      boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
                    }}>
                      {governador.foto_url ? (
                        <img src={governador.foto_url} alt={governador.nome_governador} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      ) : (
                        governador.nome_governador.charAt(0)
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{
                          fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                          padding: '2px 6px', borderRadius: 4,
                          background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6',
                          border: '1px solid rgba(59, 130, 246, 0.2)'
                        }}>
                          GOVERNADOR(A)
                        </span>
                        {governador.situacao && (
                          <span style={{
                            fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                            padding: '2px 6px', borderRadius: 4,
                            background: governador.situacao === 'ativo' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: governador.situacao === 'ativo' ? '#10B981' : '#EF4444',
                            border: governador.situacao === 'ativo' ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                            textTransform: 'uppercase'
                          }}>
                            {governador.situacao}
                          </span>
                        )}
                      </div>

                      {governador.politico_slug ? (
                        <Link href={`/p/${governador.politico_slug}`} style={{ textDecoration: 'none' }}>
                          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)', transition: 'color 0.15s' }} className="hover-underline">
                            {governador.nome_governador}
                          </h3>
                        </Link>
                      ) : (
                        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--ink)' }}>
                          {governador.nome_governador}
                        </h3>
                      )}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, fontSize: 12.5, color: 'var(--ink-3)' }}>
                        <span style={{
                          background: PARTIDO_COR[governador.partido_sigla ?? ''] ?? 'var(--line)',
                          color: '#fff', fontSize: 9.5, fontWeight: 700,
                          padding: '1px 5px', borderRadius: 4, fontFamily: 'var(--font-mono)'
                        }}>
                          {governador.partido_sigla ?? 'S/P'}
                        </span>
                        <span>·</span>
                        <span>Mandato: {new Date(governador.mandato_inicio).getFullYear()}–{governador.mandato_fim ? new Date(governador.mandato_fim).getFullYear() : '2026'}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, padding: 24, color: 'var(--mute)', fontSize: 13, textAlign: 'center' }}>
                    Dados do Governador indisponíveis.
                  </div>
                )}

                {/* Vice-Governador */}
                <div className="card-premium" style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'center' }}>
                  <div style={{
                    width: 80, height: 80, borderRadius: '50%', overflow: 'hidden',
                    border: `3px solid ${governador?.nome_vice ? `${cor}44` : 'var(--line-strong)'}`,
                    background: `linear-gradient(135deg, ${cor}15, ${cor}30)`,
                    flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, fontWeight: 800, color: cor,
                    boxShadow: '0 4px 10px rgba(0,0,0,0.05)',
                  }}>
                    {governador?.nome_vice ? (
                      governador.nome_vice.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                    ) : (
                      '👤'
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{
                        fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)',
                        padding: '2px 6px', borderRadius: 4,
                        background: 'rgba(148, 163, 184, 0.1)', color: 'var(--ink-2)',
                        border: '1px solid var(--line)'
                      }}>
                        VICE-GOVERNADOR(A)
                      </span>
                    </div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: governador?.nome_vice ? 'var(--ink)' : 'var(--mute)' }}>
                      {governador?.nome_vice ?? 'Não informado no cadastro'}
                    </h3>
                    <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.3 }}>
                      Substituto constitucional em impedimentos ou vacância do cargo.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Secretarias Estaduais */}
            {secretariasWithHighlight.length > 0 && (
              <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ borderBottom: '1px solid var(--line-soft)', paddingBottom: 8 }}>
                  <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                    Secretarias Estaduais e Gabinete
                  </h2>
                  <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
                    Estrutura de execução das principais políticas públicas do estado.
                  </p>
                </div>

                <div className="secretarias-grid">
                  {secretariasWithHighlight.map((sec, idx) => (
                    <div
                      key={idx}
                      className="card-premium"
                      style={{
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: 14,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                        <div style={{
                          width: 46,
                          height: 46,
                          borderRadius: '50%',
                          overflow: 'hidden',
                          background: `linear-gradient(135deg, ${cor}10, ${cor}25)`,
                          border: `2px solid ${cor}22`,
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 16,
                          fontWeight: 700,
                          color: cor,
                          boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
                        }}>
                          {sec.foto_secretario_url ? (
                            <img
                              src={sec.foto_secretario_url}
                              alt={sec.secretario_nome}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          ) : (
                            sec.secretario_nome.charAt(0)
                          )}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{
                            margin: '0 0 2px',
                            fontSize: 14,
                            fontWeight: 700,
                            color: 'var(--ink)',
                            lineHeight: 1.25
                          }}>
                            {sec.nome}
                          </h4>
                          <div style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'var(--ink-2)',
                          }}>
                            {sec.secretario_nome}
                          </div>
                          <div style={{
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--mute)',
                            textTransform: 'uppercase',
                            marginTop: 2,
                            fontWeight: 600,
                          }}>
                            Secretário(a) Titular
                          </div>
                        </div>
                      </div>

                      {sec.competencia && (
                        <div className="line-clamp-2" style={{
                          fontSize: 12.5,
                          color: 'var(--ink-3)',
                          lineHeight: 1.45,
                          flexGrow: 1,
                        }}>
                          {sec.competenciaNode}
                        </div>
                      )}

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 'auto' }}>
                        <div style={{ height: 1, background: 'var(--line-soft)' }} />
                        
                        {/* Botões de Contato em Linha com SVG Icons */}
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          {sec.endereco && (
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sec.endereco + ', ' + cfg.nome)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="contact-icon-btn"
                              title={`Endereço: ${sec.endereco}`}
                            >
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                            </a>
                          )}

                          {sec.telefone && (
                            <a
                              href={`tel:${sec.telefone.replace(/\D/g, '')}`}
                              className="contact-icon-btn"
                              title={`Telefone: ${sec.telefone}`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                            </a>
                          )}

                          {sec.email && (
                            <a
                              href={`mailto:${sec.email}`}
                              className="contact-icon-btn"
                              title={`E-mail: ${sec.email}`}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                            </a>
                          )}

                          {sec.site_oficial && (
                            <a
                              href={sec.site_oficial}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="contact-icon-btn"
                              title="Visitar Website Oficial"
                              style={{ marginLeft: 'auto', color: cor, borderColor: `${cor}44`, background: `${cor}05` }}
                            >
                              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* COLUNA DIREITA (Sidebar): Sede, TCE, Cidades */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
            
            {/* 1. Sede do Governo (Palácio) */}
            {palacio && (
              <div className="sidebar-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line-soft)', paddingBottom: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>🏛️</span>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
                      SEDE DO GOVERNO
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                      {palacio.nome}
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, color: 'var(--ink-2)' }}>
                  {palacio.endereco && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--mute)', marginTop: 2, flexShrink: 0 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                      </span>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(palacio.endereco)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: 'inherit', textDecoration: 'none', lineHeight: 1.4 }}
                        className="hover-underline"
                      >
                        {palacio.endereco}
                      </a>
                    </div>
                  )}

                  {palacio.telefone && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <span style={{ color: 'var(--mute)', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                      </span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontVariantNumeric: 'tabular-nums' }}>
                        {palacio.telefone}
                      </span>
                    </div>
                  )}

                  {palacio.email && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', minWidth: 0 }}>
                      <span style={{ color: 'var(--mute)', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </span>
                      <a href={`mailto:${palacio.email}`} style={{ color: cor, textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} className="hover-underline">
                        {palacio.email}
                      </a>
                    </div>
                  )}

                  {palacio.website && (
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 4 }}>
                      <span style={{ color: 'var(--mute)', flexShrink: 0 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>
                      </span>
                      <a href={palacio.website} target="_blank" rel="noopener noreferrer" style={{ color: cor, fontWeight: 600, textDecoration: 'none' }} className="hover-underline">
                        Website do Governo ➔
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 2. Controle Externo (TCE) */}
            {tce && (
              <div className="sidebar-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line-soft)', paddingBottom: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>🛡️</span>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
                      CONTROLE EXTERNO
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                      {tce.nome_completo}
                    </h3>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.45 }}>
                  Órgão responsável pela fiscalização contábil, financeira e orçamentária das contas públicas do executivo estadual.
                </p>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 10,
                  marginTop: 4
                }}>
                  {tce.presidente && (
                    <div style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontSize: 8.5, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>PRESIDENTE</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tce.presidente}>{tce.presidente}</div>
                    </div>
                  )}
                  {tce.sede && (
                    <div style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontSize: 8.5, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>SEDE</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={tce.sede}>{tce.sede}</div>
                    </div>
                  )}
                  {tce.membros_total && (
                    <div style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontSize: 8.5, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>MEMBROS</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginTop: 2 }}>{tce.membros_total} conselheiros</div>
                    </div>
                  )}
                  {tce.ano_fundacao && (
                    <div style={{ background: 'var(--bg)', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--line-soft)' }}>
                      <div style={{ fontSize: 8.5, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>FUNDAÇÃO</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-2)', marginTop: 2 }}>{tce.ano_fundacao}</div>
                    </div>
                  )}
                </div>

                {tce.site_oficial && (
                  <a
                    href={tce.site_oficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      marginTop: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'rgba(255,255,255,0.03)',
                      border: '1px solid var(--line)',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 12,
                      fontWeight: 600,
                      color: 'var(--ink)',
                      textDecoration: 'none',
                      transition: 'all 0.15s'
                    }}
                    className="hover-underline"
                  >
                    Portal de Transparência do TCE ➔
                  </a>
                )}
              </div>
            )}

            {/* 3. Maiores Municípios */}
            {municipios.length > 0 && (
              <div className="sidebar-card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid var(--line-soft)', paddingBottom: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 22 }}>🏙️</span>
                  <div>
                    <div style={{ fontSize: 9, color: 'var(--mute)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.08em' }}>
                      MAIORES MUNICÍPIOS
                    </div>
                    <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                      Cidades por População
                    </h3>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {municipios.map((m, idx) => (
                    <div key={m.codigo_ibge} className="city-row">
                      <span style={{
                        fontSize: 11,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--mute)',
                        width: 18,
                        textAlign: 'right',
                        fontWeight: 600
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{
                        flex: 1,
                        fontSize: 13,
                        fontWeight: 600,
                        color: 'var(--ink-2)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {m.nome}
                      </span>
                      <span style={{
                        fontSize: 11.5,
                        fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-3)',
                        fontVariantNumeric: 'tabular-nums'
                      }}>
                        {m.populacao != null ? m.populacao.toLocaleString('pt-BR') : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>

        {/* 3. GESTÃO FISCAL E FINANCEIRA (Largura Total) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Gestão Fiscal e Finanças</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
              Receitas arrecadadas, transferências federais e equilíbrio das finanças municipais no estado.
            </p>
          </div>

          <div className="financas-grid">
            {/* Pacto Federativo */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 20
            }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Pacto Federativo</h3>
                <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                  Comparativo entre tributos arrecadados pela União e repasses fiscais federais devolvidos ao estado.
                </p>
              </div>

              {pactoData ? (
                <PactoFederativoFlow data={pactoData} />
              ) : (
                <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--mute)', fontSize: 13 }}>
                  Dados do Pacto Federativo indisponíveis para este estado.
                </div>
              )}
            </div>

            {/* Saúde Fiscal dos Municípios */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '28px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
            }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>Saúde Fiscal dos Municípios</h3>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', marginTop: 2 }}>
                      Percentual de cidades no estado operando em déficit ou superávit orçamentário.
                    </p>
                  </div>
                  {usandoSimulado ? (
                    <span title="Os dados reais serão carregados assim que o ETL do SICONFI for rodado" style={{
                      background: 'rgba(245, 158, 11, 0.12)', color: '#F59E0B',
                      border: '1px solid rgba(245, 158, 11, 0.3)', padding: '2px 8px',
                      borderRadius: 99, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0
                    }}>
                      SIMULADO
                    </span>
                  ) : (
                    <span style={{
                      background: 'rgba(16, 185, 129, 0.12)', color: '#10B981',
                      border: '1px solid rgba(16, 185, 129, 0.3)', padding: '2px 8px',
                      borderRadius: 99, fontSize: 9, fontWeight: 700, fontFamily: 'var(--font-mono)', flexShrink: 0
                    }}>
                      OFICIAL
                    </span>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginTop: 12 }}>
                  {/* Gráfico/Progresso */}
                  <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                      <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--neg)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>
                        {Math.round((totalDeficitarios / (totalDeficitarios + totalSuperavitarios || 1)) * 100)}%
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>das prefeituras</span>
                    </div>
                    <div style={{ fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 500, marginTop: 4, marginBottom: 12 }}>
                      operam no vermelho (déficit orçamentário).
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span style={{ color: 'var(--ink-2)' }}>Déficit: <strong>{totalDeficitarios}</strong></span>
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
                          <span style={{ color: 'var(--ink-2)' }}>Superávit: <strong>{totalSuperavitarios}</strong></span>
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

                  {/* Listagem */}
                  <div style={{ flex: 1.2, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--neg)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                        MAIORES DÉFICITS MUNICIPAIS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {financasMun
                          .filter(f => f.situacao === 'deficitario')
                          .slice(0, 2)
                          .map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                              <span style={{ color: 'var(--ink-2)' }}>{f.municipio_nome}</span>
                              <span style={{ color: 'var(--neg)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                {fmtBrlCompact(f.resultado_orcamentario)}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--pos)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                        MAIORES SUPERÁVITS MUNICIPAIS
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {financasMun
                          .filter(f => f.situacao === 'superavitario')
                          .slice(0, 2)
                          .map((f, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
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
            </div>
          </div>
        </section>

        {/* 4. LINHA DO TEMPO DO EXECUTIVO (Marcos da Administração - Largura Total) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 12 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Cronologia do Executivo</h2>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', marginTop: 4 }}>
              Eleições, reformas administrativas, grandes obras e crises enfrentadas pela administração.
            </p>
          </div>

          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 12, padding: '28px 32px',
          }}>
            <TimelinePolitica items={timelineWithHighlight} />
          </div>
        </section>

      </main>
    </div>
  )
}

