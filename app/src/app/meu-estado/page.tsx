import Link from 'next/link'
import { Pool } from 'pg'
import { BarChart3, MapPin, Users2 } from 'lucide-react'

import { CardPolitico, type PoliticoCard } from '@/components/busca/CardPolitico'
import { CepForm } from '@/components/meu-estado/CepForm'
import { CardRepresentante } from '@/components/meu-estado/CardRepresentante'
import { MapaBrasilRegioes } from '@/components/meu-estado/MapaBrasilRegioes'
import { SecaoRepresentantes } from '@/components/meu-estado/SecaoRepresentantes'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type PageProps = {
  searchParams: SearchParams
}

type ViaCepResponse = {
  localidade?: string
  uf?: string
  ibge?: string
  erro?: boolean
}

type NominatimResponse = {
  display_name?: string
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    state_code?: string
    country_code?: string
  }
}

type DeputadoPg = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  sigla: string | null
}

const REGIAO_POR_UF: Record<string, string> = {
  AC: 'Norte',
  AP: 'Norte',
  AM: 'Norte',
  PA: 'Norte',
  RO: 'Norte',
  RR: 'Norte',
  TO: 'Norte',
  AL: 'Nordeste',
  BA: 'Nordeste',
  CE: 'Nordeste',
  MA: 'Nordeste',
  PB: 'Nordeste',
  PE: 'Nordeste',
  PI: 'Nordeste',
  RN: 'Nordeste',
  SE: 'Nordeste',
  DF: 'Centro-Oeste',
  GO: 'Centro-Oeste',
  MT: 'Centro-Oeste',
  MS: 'Centro-Oeste',
  ES: 'Sudeste',
  MG: 'Sudeste',
  RJ: 'Sudeste',
  SP: 'Sudeste',
  PR: 'Sul',
  RS: 'Sul',
  SC: 'Sul',
}

const UF_POR_ESTADO: Record<string, string> = {
  acre: 'AC',
  alagoas: 'AL',
  amapa: 'AP',
  amazonas: 'AM',
  bahia: 'BA',
  ceara: 'CE',
  'distrito federal': 'DF',
  'espirito santo': 'ES',
  goias: 'GO',
  maranhao: 'MA',
  'mato grosso': 'MT',
  'mato grosso do sul': 'MS',
  'minas gerais': 'MG',
  para: 'PA',
  paraiba: 'PB',
  parana: 'PR',
  pernambuco: 'PE',
  piaui: 'PI',
  'rio de janeiro': 'RJ',
  'rio grande do norte': 'RN',
  'rio grande do sul': 'RS',
  rondonia: 'RO',
  roraima: 'RR',
  'santa catarina': 'SC',
  'sao paulo': 'SP',
  sergipe: 'SE',
  tocantins: 'TO',
}

function parseTexto(valor?: string | string[]) {
  if (!valor) return ''
  const texto = Array.isArray(valor) ? valor[0] : valor
  return texto.trim()
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function nomeParaUf(nomeEstado?: string, stateCode?: string) {
  if (stateCode) {
    return stateCode.toUpperCase()
  }

  if (!nomeEstado) {
    return ''
  }

  return UF_POR_ESTADO[normalizarTexto(nomeEstado)] ?? ''
}

async function resolverLocalidade(entrada: string) {
  const valor = entrada.trim()
  const somenteNumeros = valor.replace(/\D/g, '')

  if (!valor) {
    return { cidade: '', uf: '', ibge: '', erro: 'Digite uma cidade ou um CEP.' }
  }

  if (somenteNumeros.length === 8) {
    const viaCep = await fetch(`https://viacep.com.br/ws/${somenteNumeros}/json/`, {
      cache: 'no-store',
    })

    const local = (await viaCep.json()) as ViaCepResponse

    if (!viaCep.ok || local.erro) {
      return { cidade: '', uf: '', ibge: '', erro: 'CEP invalido. Tente novamente.' }
    }

    const uf = local.uf ?? ''

    if (!uf) {
      return { cidade: '', uf: '', ibge: '', erro: 'Nao foi possivel identificar a UF para este CEP.' }
    }

    return {
      cidade: local.localidade ?? '',
      uf,
      ibge: local.ibge ?? '',
      erro: '',
    }
  }

  const buscaCidade = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(valor)}&countrycodes=br&format=jsonv2&addressdetails=1&limit=5`,
    {
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
      },
    }
  )

  if (!buscaCidade.ok) {
    return { cidade: '', uf: '', ibge: '', erro: 'Nao foi possivel buscar a cidade. Tente novamente.' }
  }

  const resultados = (await buscaCidade.json()) as NominatimResponse[]
  const melhorResultado = resultados.find((item) => item.address?.state) ?? resultados[0]

  const uf = nomeParaUf(melhorResultado?.address?.state, melhorResultado?.address?.state_code)
  const cidade =
    melhorResultado?.address?.city ??
    melhorResultado?.address?.town ??
    melhorResultado?.address?.village ??
    melhorResultado?.address?.municipality ??
    melhorResultado?.address?.county ??
    valor

  if (!uf) {
    return {
      cidade: '',
      uf: '',
      ibge: '',
      erro: 'Nao encontramos a UF dessa cidade. Tente CEP ou nome completo da cidade.',
    }
  }

  return {
    cidade,
    uf,
    ibge: '',
    erro: '',
  }
}

async function buscarDeputadosViaPostgres(uf: string): Promise<PoliticoCard[]> {
  const host = process.env.SUPABASE_DB_HOST
  const password = process.env.SUPABASE_DB_PASSWORD

  if (!host || !password) {
    return []
  }

  const pool = new Pool({
    host,
    port: Number(process.env.SUPABASE_DB_PORT ?? '5432'),
    user: process.env.SUPABASE_DB_USER ?? 'postgres',
    password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const result = await pool.query<DeputadoPg>(
      `
        SELECT
          p.id,
          p.slug,
          p.nome,
          p.nome_eleitoral,
          p.foto_url,
          p.cargo::text AS cargo,
          p.uf,
          p.presenca_pct_atual,
          pa.sigla
        FROM politicos p
        LEFT JOIN partidos pa ON pa.id = p.partido_id
        WHERE p.cargo = 'deputado_federal'
          AND p.uf = $1
          AND p.removido_em IS NULL
        ORDER BY p.nome_eleitoral ASC NULLS LAST
      `,
      [uf]
    )

    return result.rows.map((row) => ({
      id: row.id,
      slug: row.slug,
      nome: row.nome,
      nome_eleitoral: row.nome_eleitoral,
      foto_url: row.foto_url,
      cargo: row.cargo,
      uf: row.uf,
      presenca_pct_atual: row.presenca_pct_atual,
      gasto_total_ano: null,
      mandato_inicio: null,
      partidos: { sigla: row.sigla },
    }))
  } finally {
    await pool.end()
  }
}

export default async function MeuEstadoPage({ searchParams }: PageProps) {
  const params = await searchParams
  const localidade = parseTexto(params.local || params.cep)

  let cidade = ''
  let uf = ''
  let ibge = ''
  let erroCep = ''
  let deputados: PoliticoCard[] = []

  if (localidade) {
    const resultado = await resolverLocalidade(localidade)
    cidade = resultado.cidade
    uf = resultado.uf
    ibge = resultado.ibge
    erroCep = resultado.erro
  }

  if (uf) {
    const supabase = await createClient()

    const { data: deputadosData, error } = await supabase
      .from('politicos')
      .select('id, slug, nome, nome_eleitoral, foto_url, cargo, uf, presenca_pct_atual, partidos(sigla)')
      .eq('cargo', 'deputado_federal')
      .eq('uf', uf)
      .is('removido_em', null)
      .order('nome_eleitoral')

    if (deputadosData && !error) {
      deputados = deputadosData.map((item) => ({
        slug: item.slug,
        nome: item.nome,
        nome_eleitoral: item.nome_eleitoral,
        foto_url: item.foto_url,
        cargo: item.cargo,
        uf: item.uf,
        presenca_pct_atual: item.presenca_pct_atual,
        partidos: item.partidos,
        gasto_total_ano: null,
        mandato_inicio: null,
      }))
    } else {
      deputados = await buscarDeputadosViaPostgres(uf)
    }
  }

  const mostrarSecoes = Boolean(localidade && !erroCep && uf)
  const deputadosPreview = deputados.slice(0, 5)
  const regiaoAtual = uf ? REGIAO_POR_UF[uf] ?? '' : ''

  return (
    <main className="bg-[#f5f6fa] pb-12">
      <section className="bg-[#1a2b5e] text-white">
        <div className="container-shell py-10 sm:py-12">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div className="space-y-5">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-white/70">
                <Users2 className="size-3.5" aria-hidden="true" />
                Quem me representa?
              </div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Digite sua cidade ou CEP e descubra seus representantes.</h1>
              <p className="max-w-xl text-base leading-7 text-white/78 sm:text-lg">
                Comece pela cidade se quiser pensar como cidadão. O sistema transforma isso em UF, mapa e representantes em poucos segundos.
              </p>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <MapPin className="size-5 text-[#9fb7ff]" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/55">UF detectada</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{uf || '—'}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <BarChart3 className="size-5 text-[#9fb7ff]" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/55">Deputados</p>
                  <p className="mt-1 text-2xl font-bold tracking-tight">{deputados.length || '—'}</p>
                </div>
                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur">
                  <Users2 className="size-5 text-[#9fb7ff]" aria-hidden="true" />
                  <p className="mt-3 text-xs font-semibold uppercase tracking-widest text-white/55">Região</p>
                  <p className="mt-1 text-lg font-bold tracking-tight">{regiaoAtual || '—'}</p>
                </div>
              </div>

              <CepForm defaultLocalidade={localidade} />

              {erroCep ? (
                <p className="rounded-lg bg-[#ffd8d8] px-3 py-2 text-sm text-[#7b1d1d]">{erroCep}</p>
              ) : null}

              {mostrarSecoes ? (
                <div className="rounded-2xl border border-white/25 bg-white/15 px-4 py-3 text-sm text-white backdrop-blur">
                  📍 {cidade} · {uf}
                  {ibge ? ` (IBGE ${ibge})` : ''}
                </div>
              ) : null}
            </div>

            <div className="lg:pt-2">
              <MapaBrasilRegioes ufAtual={uf} />
            </div>
          </div>
        </div>
      </section>

      {mostrarSecoes ? (
        <div className="container-shell mt-6 space-y-4">
          <SecaoRepresentantes
            badge="Federal"
            badgeClassName="border-[#cdd9ff] bg-[#e8eefb] text-[#1a2b5e]"
            titulo="Presidente"
          >
            <CardRepresentante nome="Luiz Inacio Lula da Silva" legenda="PT · Em breve" />
          </SecaoRepresentantes>

          <SecaoRepresentantes
            badge="Estadual"
            badgeClassName="border-[#cce9da] bg-[#e8f5ee] text-[#085041]"
            titulo="Governador"
          >
            <CardRepresentante nome="Em breve" legenda="Fase 2" />
          </SecaoRepresentantes>

          <SecaoRepresentantes
            badge="Federal"
            badgeClassName="border-[#cdd9ff] bg-[#e8eefb] text-[#1a2b5e]"
            titulo="Senadores"
          >
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <CardRepresentante nome="Em breve" legenda="Fase 2" />
              <CardRepresentante nome="Em breve" legenda="Fase 2" />
              <CardRepresentante nome="Em breve" legenda="Fase 2" />
            </div>
          </SecaoRepresentantes>

          <SecaoRepresentantes
            badge="Federal"
            badgeClassName="border-[#cdd9ff] bg-[#e8eefb] text-[#1a2b5e]"
            titulo="Deputados Federais"
          >
            {deputados.length > 0 ? (
              <>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {deputadosPreview.map((deputado) => (
                    <CardPolitico key={deputado.slug} politico={deputado} />
                  ))}
                </div>

                {deputados.length > 5 ? (
                  <div className="mt-4">
                    <Link
                      href={`/busca?cargo=deputado_federal&uf=${uf}`}
                      className="inline-flex items-center rounded-lg border border-[#2952cc] px-3 py-2 text-sm font-medium text-[#2952cc] hover:bg-[#e8eefb]"
                    >
                      Ver todos os {deputados.length} deputados de {uf}
                    </Link>
                  </div>
                ) : null}
              </>
            ) : (
              <CardRepresentante nome="Nenhum deputado encontrado" legenda="Tente outro CEP" />
            )}
          </SecaoRepresentantes>

          <SecaoRepresentantes
            badge="Municipal"
            badgeClassName="border-[#dfd0ff] bg-[#f0e8ff] text-[#3c1489]"
            titulo="Prefeito e Vereadores"
          >
            <CardRepresentante nome="Em breve" legenda="Fase 4" />
          </SecaoRepresentantes>
        </div>
      ) : null}
    </main>
  )
}
