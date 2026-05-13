import Link from 'next/link'
import { Pool } from 'pg'

import { CardPolitico, type PoliticoCard } from '@/components/busca/CardPolitico'
import { CepForm } from '@/components/meu-estado/CepForm'
import { CardRepresentante } from '@/components/meu-estado/CardRepresentante'
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

function parseTexto(valor?: string | string[]) {
  if (!valor) return ''
  const texto = Array.isArray(valor) ? valor[0] : valor
  return texto.trim()
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
  const cep = parseTexto(params.cep).replace(/\D/g, '').slice(0, 8)

  let cidade = ''
  let uf = ''
  let ibge = ''
  let erroCep = ''
  let deputados: PoliticoCard[] = []

  if (cep) {
    if (cep.length !== 8) {
      erroCep = 'CEP invalido. Digite os 8 numeros.'
    } else {
      const viaCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`, {
        cache: 'no-store',
      })

      const local = (await viaCep.json()) as ViaCepResponse

      if (!viaCep.ok || local.erro) {
        erroCep = 'CEP invalido. Tente novamente.'
      } else {
        cidade = local.localidade ?? ''
        uf = local.uf ?? ''
        ibge = local.ibge ?? ''

        if (!uf) {
          erroCep = 'Nao foi possivel identificar a UF para este CEP.'
        }
      }
    }
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
      deputados = (deputadosData as PoliticoCard[]).map((item) => ({
        ...item,
        gasto_total_ano: null,
        mandato_inicio: null,
      }))
    } else {
      deputados = await buscarDeputadosViaPostgres(uf)
    }
  }

  const mostrarSecoes = Boolean(cep && !erroCep && uf)
  const deputadosPreview = deputados.slice(0, 5)

  return (
    <main className="bg-[#f5f6fa] pb-12">
      <section className="bg-[#1a2b5e] text-white">
        <div className="container-shell py-10 sm:py-12">
          <div className="mx-auto max-w-3xl space-y-5">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Quem me representa?</h1>
            <p className="text-base text-white/80 sm:text-lg">
              Digite seu CEP e veja todos os seus representantes politicos
            </p>

            <CepForm defaultCep={cep} />

            {erroCep ? (
              <p className="rounded-lg bg-[#ffd8d8] px-3 py-2 text-sm text-[#7b1d1d]">{erroCep}</p>
            ) : null}

            {mostrarSecoes ? (
              <div className="rounded-lg border border-white/25 bg-white/15 px-3 py-2 text-sm text-white">
                📍 {cidade} · {uf}
                {ibge ? ` (IBGE ${ibge})` : ''}
              </div>
            ) : null}
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
                    <CardPolitico key={deputado.id} politico={deputado} />
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
