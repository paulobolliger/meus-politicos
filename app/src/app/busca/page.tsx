import Link from 'next/link'
import { Pool } from 'pg'

import { CardPolitico, type PoliticoCard } from '@/components/busca/CardPolitico'
import { FiltrosChips } from '@/components/busca/FiltrosChips'
import { Paginacao } from '@/components/busca/Paginacao'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/server'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type BuscaPageProps = {
  searchParams: SearchParams
}

type PoliticoPgRow = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  mandato_inicio: string | null
  partido_sigla: string | null
}

const POR_PAGINA = 20

function parseTexto(valor?: string | string[]) {
  if (!valor) return ''
  const texto = Array.isArray(valor) ? valor[0] : valor
  return texto.trim()
}

function moeda(valor: number | null) {
  if (valor == null) return '–'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(valor)
}

function construirUrlLimpar(cargo: string, uf: string, ordem: string) {
  const params = new URLSearchParams()

  if (cargo) params.set('cargo', cargo)
  if (uf) params.set('uf', uf)
  if (ordem && ordem !== 'relevancia') params.set('ordem', ordem)

  const query = params.toString()
  return query ? `/busca?${query}` : '/busca'
}

async function buscarViaPostgres(
  q: string,
  cargo: string,
  uf: string,
  ordem: string,
  pagina: number
): Promise<{ data: PoliticoCard[]; count: number }> {
  const host = process.env.SUPABASE_DB_HOST
  const password = process.env.SUPABASE_DB_PASSWORD

  if (!host || !password) {
    return { data: [], count: 0 }
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

  const whereParts = ["p.dado_estado = 'oficial'", 'p.removido_em IS NULL']
  const values: Array<string | number> = []

  if (q) {
    values.push(`%${q}%`)
    whereParts.push(`p.nome_eleitoral ILIKE $${values.length}`)
  }

  if (cargo) {
    values.push(cargo)
    whereParts.push(`p.cargo::text = $${values.length}`)
  }

  if (uf) {
    values.push(uf)
    whereParts.push(`p.uf = $${values.length}`)
  }

  const whereClause = whereParts.join(' AND ')

  let orderClause = 'p.nome_eleitoral ASC NULLS LAST'

  if (ordem === 'presenca') {
    orderClause = 'p.presenca_pct_atual DESC NULLS LAST'
  }

  if (ordem === 'gastos') {
    orderClause = 'p.gasto_total_ano DESC NULLS LAST'
  }

  try {
    const countResult = await pool.query<{ total: string }>(
      `SELECT COUNT(*)::text AS total FROM politicos p WHERE ${whereClause}`,
      values
    )

    const count = Number(countResult.rows[0]?.total ?? '0')
    const offset = (pagina - 1) * POR_PAGINA

    values.push(POR_PAGINA)
    values.push(offset)

    const dataResult = await pool.query<PoliticoPgRow>(
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
          p.gasto_total_ano,
          p.mandato_inicio::text AS mandato_inicio,
          pa.sigla AS partido_sigla
        FROM politicos p
        LEFT JOIN partidos pa ON pa.id = p.partido_id
        WHERE ${whereClause}
        ORDER BY ${orderClause}
        LIMIT $${values.length - 1}
        OFFSET $${values.length}
      `,
      values
    )

    return {
      count,
      data: dataResult.rows.map((row) => ({
        id: row.id,
        slug: row.slug,
        nome: row.nome,
        nome_eleitoral: row.nome_eleitoral,
        foto_url: row.foto_url,
        cargo: row.cargo,
        uf: row.uf,
        presenca_pct_atual: row.presenca_pct_atual,
        gasto_total_ano: row.gasto_total_ano,
        mandato_inicio: row.mandato_inicio,
        partidos: { sigla: row.partido_sigla },
      })),
    }
  } finally {
    await pool.end()
  }
}

export default async function BuscaPage({ searchParams }: BuscaPageProps) {
  const params = await searchParams

  const q = parseTexto(params.q)
  const cargo = parseTexto(params.cargo)
  const uf = parseTexto(params.uf)
  const ordem = parseTexto(params.ordem) || 'relevancia'
  const pagina = Math.max(1, Number.parseInt(parseTexto(params.pagina) || '1', 10) || 1)

  const offset = (pagina - 1) * POR_PAGINA
  const supabase = await createClient()

  let query = supabase
    .from('politicos')
    .select(
      'id, slug, nome, nome_eleitoral, foto_url, cargo, uf, mandato_inicio, partido_id, presenca_pct_atual, gasto_total_ano, partidos(sigla)',
      { count: 'exact' }
    )
    .eq('dado_estado', 'oficial')
    .is('removido_em', null)

  if (q) query = query.ilike('nome_eleitoral', `%${q}%`)
  if (cargo) query = query.eq('cargo', cargo)
  if (uf) query = query.eq('uf', uf)

  if (ordem === 'presenca') {
    query = query.order('presenca_pct_atual', { ascending: false, nullsFirst: false })
  } else if (ordem === 'gastos') {
    query = query.order('gasto_total_ano', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('nome_eleitoral')
  }

  query = query.range(offset, offset + 19)

  const { data, count, error } = await query

  let politicos: PoliticoCard[] = (data ?? []) as PoliticoCard[]
  let totalResultados = count ?? 0

  if ((!data || error?.code === '42501') && totalResultados === 0) {
    const fallback = await buscarViaPostgres(q, cargo, uf, ordem, pagina)
    politicos = fallback.data
    totalResultados = fallback.count
  }

  const totalPaginas = Math.max(1, Math.ceil(totalResultados / POR_PAGINA))
  const titulo = q ? `Resultados para "${q}"` : 'Explorar políticos'
  const limparHref = construirUrlLimpar(cargo, uf, ordem)

  return (
    <main className="bg-[#f5f6fa] pb-12">
      <section className="border-b border-slate-200 bg-white">
        <div className="container-shell py-6 sm:py-8">
          <div className="space-y-4">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{titulo}</h1>

            <form action="/busca" className="flex flex-col gap-2 sm:flex-row">
              <Input name="q" defaultValue={q} placeholder="Buscar por nome eleitoral" className="h-10 bg-white" />
              {cargo ? <input type="hidden" name="cargo" value={cargo} /> : null}
              {uf ? <input type="hidden" name="uf" value={uf} /> : null}
              {ordem ? <input type="hidden" name="ordem" value={ordem} /> : null}
              <div className="flex gap-2">
                <Button type="submit" className="h-10 bg-[#2952cc] text-white hover:bg-[#264ab7]">
                  Buscar
                </Button>
                <Link href={limparHref} className="inline-flex h-10 items-center rounded-lg border border-slate-300 px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
                  Limpar
                </Link>
              </div>
            </form>
          </div>
        </div>
      </section>

      <section className="container-shell py-5 sm:py-6">
        <FiltrosChips cargoAtual={cargo} ufAtual={uf} />
      </section>

      <section className="container-shell pb-6">
        <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-700">
            {totalResultados > 0 ? `${totalResultados} resultados` : 'Nenhum resultado encontrado'}
          </p>

          <form action="/busca" className="flex items-center gap-2">
            {q ? <input type="hidden" name="q" value={q} /> : null}
            {cargo ? <input type="hidden" name="cargo" value={cargo} /> : null}
            {uf ? <input type="hidden" name="uf" value={uf} /> : null}
            <input type="hidden" name="pagina" value="1" />
            <label htmlFor="ordem" className="text-sm text-slate-600">Ordenação</label>
            <select
              id="ordem"
              name="ordem"
              defaultValue={ordem}
              className="h-9 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700"
            >
              <option value="relevancia">Relevância</option>
              <option value="presenca">Presença</option>
              <option value="gastos">Gastos</option>
            </select>
            <Button type="submit" variant="outline" className="h-9">Aplicar</Button>
          </form>
        </div>

        {politicos.length > 0 ? (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {politicos.map((politico) => (
                <CardPolitico key={politico.id} politico={politico} />
              ))}
            </div>

            <Paginacao paginaAtual={pagina} totalPaginas={totalPaginas} />
          </>
        ) : (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
            <p className="text-lg font-semibold text-slate-800">Nenhum político encontrado</p>
            <p className="mt-2 text-sm text-slate-500">Tente ajustar o termo de busca ou remover filtros.</p>
            <p className="mt-3 text-sm text-slate-400">Gasto cota médio exibido como referência: {moeda(null)}</p>
          </div>
        )}
      </section>
    </main>
  )
}
