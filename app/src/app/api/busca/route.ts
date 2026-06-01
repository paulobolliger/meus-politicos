import { NextRequest, NextResponse } from 'next/server'
import { Pool } from 'pg'

// Singleton — evita criar/destruir pool a cada request
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? '5432'),
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      ssl: false,
      max: 3,
      idleTimeoutMillis: 30000,
    })
  }
  return _pool
}

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

const UFS_CHIPS = ['AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO']
const PARTIDOS_CHIPS = ['PL','PT','UNIÃO','PP','PSD','MDB','REPUBLICANOS','PDT','PSB','PODE','SOLIDARIEDADE','AVANTE','PRD','PV','PSOL']

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
  const pool = getPool()
  const result = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total
     FROM politicos
     WHERE dado_estado = 'oficial'
       AND removido_em IS NULL`
  )

  return Number(result.rows[0]?.total ?? '0')
}

async function buscarPoliticos(
  q: string,
  cargo: string,
  uf: string,
  partido: string,
  ordem: string,
  pagina: number
): Promise<{ data: PoliticoBusca[]; count: number }> {
  const pool = getPool()

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
      presenca_pct_atual: row.presenca_pct_atual != null ? Number(row.presenca_pct_atual) : null,
      gasto_total_ano: row.gasto_total_ano != null ? Number(row.gasto_total_ano) : null,
      total_votacoes: row.total_votacoes != null ? Number(row.total_votacoes) : null,
      mandato_inicio: row.mandato_inicio,
      partidos: { sigla: row.partido_sigla },
    })),
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

  const { data: politicos, count: totalResultados } =
    await buscarPoliticos(q, cargo, uf, partido, ordem, pagina)

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
        { id: 'governador', label: 'Governador', total: null },
        { id: 'deputado_estadual', label: 'Dep. Estadual', total: null },
      ],
      ufs: UFS_CHIPS,
      partidos: PARTIDOS_CHIPS,
    },
  })
}
