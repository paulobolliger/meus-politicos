import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

import { createClient } from '@/lib/supabase/server'

type PoliticoBusca = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  mandato_inicio: string | null
  partidos: { sigla: string | null } | null
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
  total_votacoes: number | null
  mandato_inicio: string | null
  partido_sigla: string | null
}

const POR_PAGINA = 20
const CARGOS_VALIDOS = [
  'presidente',
  'vice_presidente',
  'governador',
  'vice_governador',
  'senador',
  'deputado_federal',
  'deputado_estadual',
  'prefeito',
  'vice_prefeito',
  'vereador',
] as const

const UFS_CHIPS = ['SP', 'MG', 'RJ', 'BA']
const PARTIDOS_CHIPS = ['PL', 'PT', 'UNIÃO', 'PP', 'PSD']

type CargoPolitico = (typeof CARGOS_VALIDOS)[number]

function parseCargo(raw: string | null): CargoPolitico | '' {
  if (!raw) return ''
  return CARGOS_VALIDOS.includes(raw as CargoPolitico) ? (raw as CargoPolitico) : ''
}

function parseIntSafe(raw: string | null, fallback: number) {
  if (!raw) return fallback
  const parsed = Number.parseInt(raw, 10)
  if (!Number.isFinite(parsed) || parsed < 1) return fallback
  return parsed
}

async function countIndexados() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('politicos')
    .select('id', { count: 'exact', head: true })
    .eq('dado_estado', 'oficial')
    .is('removido_em', null)

  return count ?? 0
}

async function buscarViaPostgres(
  q: string,
  cargo: string,
  uf: string,
  partido: string,
  ordem: string,
  pagina: number
): Promise<{ data: PoliticoBusca[]; count: number }> {
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
    whereParts.push(`(p.nome_eleitoral ILIKE $${values.length} OR p.nome ILIKE $${values.length})`)
  }

  if (cargo) {
    values.push(cargo)
    whereParts.push(`p.cargo::text = $${values.length}`)
  }

  if (uf) {
    values.push(uf)
    whereParts.push(`p.uf = $${values.length}`)
  }

  if (partido) {
    values.push(partido)
    whereParts.push(`pa.sigla = $${values.length}`)
  }

  const whereClause = whereParts.join(' AND ')

  let orderClause = 'p.nome_eleitoral ASC NULLS LAST'
  if (ordem === 'presenca') orderClause = 'p.presenca_pct_atual DESC NULLS LAST'
  if (ordem === 'gastos') orderClause = 'p.gasto_total_ano DESC NULLS LAST'
  if (ordem === 'votacoes') orderClause = 'p.total_votacoes DESC NULLS LAST'

  try {
    const countResult = await pool.query<{ total: string }>(
      `
        SELECT COUNT(*)::text AS total
        FROM politicos p
        LEFT JOIN partidos pa ON pa.id = p.partido_id
        WHERE ${whereClause}
      `,
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
          p.total_votacoes,
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
        total_votacoes: row.total_votacoes,
        mandato_inicio: row.mandato_inicio,
        partidos: { sigla: row.partido_sigla },
      })),
    }
  } finally {
    await pool.end()
  }
}

export async function GET(request: NextRequest) {
  const startedAt = Date.now()
  const url = new URL(request.url)

  const q = (url.searchParams.get('q') ?? '').trim()
  const cargo = parseCargo(url.searchParams.get('cargo'))
  const uf = (url.searchParams.get('uf') ?? '').trim().toUpperCase()
  const partido = (url.searchParams.get('partido') ?? '').trim().toUpperCase()
  const ordem = (url.searchParams.get('ordem') ?? 'relevancia').trim()
  const pagina = parseIntSafe(url.searchParams.get('pagina'), 1)

  const offset = (pagina - 1) * POR_PAGINA
  const supabase = await createClient()

  let query = supabase
    .from('politicos')
    .select(
      'id, slug, nome, nome_eleitoral, foto_url, cargo, uf, mandato_inicio, presenca_pct_atual, gasto_total_ano, total_votacoes, partidos(sigla)',
      { count: 'exact' }
    )
    .eq('dado_estado', 'oficial')
    .is('removido_em', null)

  if (q) query = query.or(`nome_eleitoral.ilike.%${q}%,nome.ilike.%${q}%`)
  if (cargo) query = query.eq('cargo', cargo)
  if (uf) query = query.eq('uf', uf)

  if (ordem === 'presenca') {
    query = query.order('presenca_pct_atual', { ascending: false, nullsFirst: false })
  } else if (ordem === 'gastos') {
    query = query.order('gasto_total_ano', { ascending: false, nullsFirst: false })
  } else if (ordem === 'votacoes') {
    query = query.order('total_votacoes', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('nome_eleitoral')
  }

  query = query.range(offset, offset + POR_PAGINA - 1)

  const response = await query
  const { data, count } = response
  const errorCode = response.error ? (response.error as { code?: string }).code : undefined

  let politicos: PoliticoBusca[] = (data ?? []) as PoliticoBusca[]
  let totalResultados = count ?? 0

  if (partido) {
    politicos = politicos.filter((item) => (item.partidos?.sigla ?? '').toUpperCase() === partido)
    if (politicos.length < POR_PAGINA || pagina > 1) {
      const fallback = await buscarViaPostgres(q, cargo, uf, partido, ordem, pagina)
      politicos = fallback.data
      totalResultados = fallback.count
    }
  }

  if ((!data || errorCode === '42501') && totalResultados === 0) {
    const fallback = await buscarViaPostgres(q, cargo, uf, partido, ordem, pagina)
    politicos = fallback.data
    totalResultados = fallback.count
  }

  const elapsedMs = Date.now() - startedAt
  const totalPaginas = Math.max(1, Math.ceil(totalResultados / POR_PAGINA))

  return NextResponse.json({
    items: politicos,
    total: totalResultados,
    totalPaginas,
    pagina,
    porPagina: POR_PAGINA,
    elapsedMs,
    totalIndexados: await countIndexados(),
    chips: {
      cargos: [
        { id: '', label: 'Todos', total: null },
        { id: 'deputado_federal', label: 'Dep. Federal', total: null },
        { id: 'senador', label: 'Senador', total: null },
      ],
      ufs: UFS_CHIPS,
      partidos: PARTIDOS_CHIPS,
    },
  })
}
