import Link from 'next/link'
import { Pool } from 'pg'

import { CepForm } from '@/components/meu-estado/CepForm'
import { CardRepresentante } from '@/components/meu-estado/CardRepresentante'
import { SecaoRepresentantes } from '@/components/meu-estado/SecaoRepresentantes'
import { createClient } from '@/lib/supabase/server'

type ViaCepResponse = {
  localidade?: string
  uf?: string
  ibge?: string
  erro?: boolean
}

type NominatimResponse = {
  address?: {
    city?: string
    town?: string
    village?: string
    municipality?: string
    county?: string
    state?: string
    state_code?: string
  }
}

type Representante = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partidos: { sigla: string | null } | null
}

type DeputadoPg = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  sigla: string | null
}

type CargoConsulta = 'presidente' | 'governador' | 'senador' | 'deputado_federal'

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

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  governador: 'Governador',
  senador: 'Senador',
  deputado_federal: 'Dep. Federal',
}

function normalizarTexto(texto: string) {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
}

function nomeParaUf(nomeEstado?: string, stateCode?: string) {
  if (stateCode) return stateCode.toUpperCase()
  if (!nomeEstado) return ''
  return UF_POR_ESTADO[normalizarTexto(nomeEstado)] ?? ''
}

function nomeExibicao(rep: Representante) {
  return rep.nome_eleitoral ?? rep.nome
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
      return { cidade: '', uf: '', ibge: '', erro: 'CEP inválido. Tente novamente.' }
    }

    const uf = local.uf ?? ''

    if (!uf) {
      return { cidade: '', uf: '', ibge: '', erro: 'Não foi possível identificar a UF para este CEP.' }
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
    return { cidade: '', uf: '', ibge: '', erro: 'Não foi possível buscar a cidade. Tente novamente.' }
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
      erro: 'Não encontramos a UF dessa cidade. Tente CEP ou nome completo da cidade.',
    }
  }

  return {
    cidade,
    uf,
    ibge: '',
    erro: '',
  }
}

async function buscarDeputadosViaPostgres(uf: string): Promise<Representante[]> {
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
          p.cargo::text AS cargo,
          p.uf,
          p.presenca_pct_atual,
          p.gasto_total_ano,
          p.total_votacoes,
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
      cargo: row.cargo,
      uf: row.uf,
      presenca_pct_atual: row.presenca_pct_atual,
      gasto_total_ano: row.gasto_total_ano,
      total_votacoes: row.total_votacoes,
      partidos: { sigla: row.sigla },
    }))
  } finally {
    await pool.end()
  }
}

async function buscarPorCargo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  cargo: CargoConsulta,
  uf?: string,
  limite?: number
): Promise<Representante[]> {
  let query = supabase
    .from('politicos')
    .select('id, slug, nome, nome_eleitoral, cargo, uf, presenca_pct_atual, gasto_total_ano, total_votacoes, partidos(sigla)')
    .eq('cargo', cargo)
    .eq('dado_estado', 'oficial')
    .is('removido_em', null)
    .order('nome_eleitoral')

  if (uf) {
    query = query.eq('uf', uf)
  }

  if (limite) {
    query = query.limit(limite)
  }

  const { data, error } = await query

  if (error || !data) {
    return []
  }

  return data as unknown as Representante[]
}

type Props = {
  searchParams: Record<string, string | string[] | undefined>
}

export async function MeuEstadoContent({ searchParams }: Props) {
  function parseTexto(valor?: string | string[]) {
    if (!valor) return ''
    const texto = Array.isArray(valor) ? valor[0] : valor
    return texto.trim()
  }

  const localidade = parseTexto(searchParams.local || searchParams.cep)

  let cidade = ''
  let uf = ''
  let ibge = ''
  let erroCep = ''

  if (localidade) {
    const resultado = await resolverLocalidade(localidade)
    cidade = resultado.cidade
    uf = resultado.uf
    ibge = resultado.ibge
    erroCep = resultado.erro
  }

  let presidente: Representante[] = []
  let governador: Representante[] = []
  let senadores: Representante[] = []
  let deputados: Representante[] = []

  if (uf) {
    const supabase = await createClient()

    presidente = await buscarPorCargo(supabase, 'presidente', undefined, 1)
    governador = await buscarPorCargo(supabase, 'governador', uf, 1)
    senadores = await buscarPorCargo(supabase, 'senador', uf)
    deputados = await buscarPorCargo(supabase, 'deputado_federal', uf)

    if (deputados.length === 0) {
      deputados = await buscarDeputadosViaPostgres(uf)
    }
  }

  const mostrarSecoes = Boolean(localidade && !erroCep && uf)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <section style={{ background: '#1a2b5e', color: '#fff' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 24px 44px' }}>
          <div style={{ maxWidth: 900 }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.75)' }}>
              QUEM ME REPRESENTA
            </div>

            <h1 style={{ margin: '16px 0 0', fontSize: 'clamp(36px, 6vw, 62px)', lineHeight: 1.04, letterSpacing: '-0.03em' }}>
              Seus representantes em Brasília
            </h1>

            <p style={{ margin: '16px 0 0', fontSize: 'clamp(17px, 2.1vw, 21px)', color: 'rgba(255,255,255,0.84)', maxWidth: 760 }}>
              Digite seu CEP ou use sua localização para ver quem decide por você.
            </p>

            <div style={{ marginTop: 22, maxWidth: 740 }}>
              <CepForm defaultLocalidade={localidade} />
              {erroCep ? (
                <p style={{ margin: '10px 0 0', fontSize: 12, color: '#fecaca' }}>{erroCep}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {mostrarSecoes ? (
        <section style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
          <div style={{ maxWidth: 1320, margin: '0 auto', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-2)' }}>
              📍 {cidade || 'Cidade não informada'} · {uf} · IBGE {ibge || '—'}
            </div>
            <span
              className="mono"
              style={{
                background: 'var(--pos-soft)',
                color: 'var(--pos)',
                border: '1px solid var(--pos)',
                fontSize: 10.5,
                letterSpacing: '0.1em',
                padding: '4px 8px',
              }}
            >
              LOCALIZAÇÃO IDENTIFICADA
            </span>
          </div>
        </section>
      ) : null}

      {mostrarSecoes ? (
        <section style={{ maxWidth: 1320, margin: '0 auto', padding: '16px 24px 26px', display: 'grid', gap: 12 }}>
          <SecaoRepresentantes titulo="Presidente" badge="[Federal]" quantidade={presidente.length}>
            <div className="rep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {presidente.length > 0 ? (
                presidente.map((rep) => (
                  <CardRepresentante
                    key={rep.id}
                    nome={nomeExibicao(rep)}
                    partido={rep.partidos?.sigla}
                    uf={rep.uf}
                    cargo={CARGO_LABEL[rep.cargo] ?? rep.cargo}
                    presencaPct={rep.presenca_pct_atual}
                    gastoTotalAno={rep.gasto_total_ano}
                    href={`/politicos/${rep.slug}`}
                  />
                ))
              ) : (
                <CardRepresentante nome="Não identificado" legenda="Dados oficiais em atualização" />
              )}
            </div>
          </SecaoRepresentantes>

          <SecaoRepresentantes titulo={`Deputados Federais (${deputados.length} de ${uf})`} badge="[Federal]" quantidade={deputados.length}>
            <div className="rep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {deputados.length > 0 ? (
                deputados.map((rep) => (
                  <CardRepresentante
                    key={rep.id}
                    nome={nomeExibicao(rep)}
                    partido={rep.partidos?.sigla}
                    uf={rep.uf}
                    cargo={CARGO_LABEL[rep.cargo] ?? rep.cargo}
                    presencaPct={rep.presenca_pct_atual}
                    gastoTotalAno={rep.gasto_total_ano}
                    href={`/politicos/${rep.slug}`}
                  />
                ))
              ) : (
                <CardRepresentante nome="Nenhum deputado encontrado" legenda="Tente outro CEP" />
              )}
            </div>

            {deputados.length > 0 ? (
              <div style={{ marginTop: 12 }}>
                <Link
                  href={`/busca?cargo=deputado_federal&uf=${uf}`}
                  style={{
                    border: '1px solid var(--line-strong)',
                    background: 'transparent',
                    color: 'var(--ink)',
                    padding: '7px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                    display: 'inline-flex',
                  }}
                >
                  Ver todos os {deputados.length} deputados de {uf} →
                </Link>
              </div>
            ) : null}
          </SecaoRepresentantes>

          <SecaoRepresentantes titulo="Governador" badge="[Estadual]" quantidade={governador.length}>
            <div className="rep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {governador.length > 0 ? (
                governador.map((rep) => (
                  <CardRepresentante
                    key={rep.id}
                    nome={nomeExibicao(rep)}
                    partido={rep.partidos?.sigla}
                    uf={rep.uf}
                    cargo={CARGO_LABEL[rep.cargo] ?? rep.cargo}
                    presencaPct={rep.presenca_pct_atual}
                    gastoTotalAno={rep.gasto_total_ano}
                    href={`/politicos/${rep.slug}`}
                  />
                ))
              ) : (
                <CardRepresentante nome="Não identificado" legenda="Dados oficiais em atualização" />
              )}
            </div>
          </SecaoRepresentantes>

          <SecaoRepresentantes titulo={`Senadores (${senadores.length} de ${uf})`} badge="[Estadual]" quantidade={senadores.length}>
            <div className="rep-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 10 }}>
              {senadores.length > 0 ? (
                senadores.map((rep) => (
                  <CardRepresentante
                    key={rep.id}
                    nome={nomeExibicao(rep)}
                    partido={rep.partidos?.sigla}
                    uf={rep.uf}
                    cargo={CARGO_LABEL[rep.cargo] ?? rep.cargo}
                    presencaPct={rep.presenca_pct_atual}
                    gastoTotalAno={rep.gasto_total_ano}
                    href={`/politicos/${rep.slug}`}
                  />
                ))
              ) : (
                <CardRepresentante nome="Não identificado" legenda="Dados oficiais em atualização" />
              )}
            </div>
          </SecaoRepresentantes>
        </section>
      ) : (
        <section style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 24px 34px' }}>
          <div
            style={{
              border: '1px dashed var(--line-strong)',
              background: 'var(--panel)',
              padding: '40px 16px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, lineHeight: 1 }}>📍</div>
            <h2 style={{ margin: '12px 0 0', fontSize: 'clamp(22px, 3.2vw, 30px)', color: 'var(--ink)' }}>
              Digite seu CEP acima para ver seus representantes
            </h2>
          </div>
        </section>
      )}
    </div>
  )
}
