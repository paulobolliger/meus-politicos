import type { Metadata } from 'next'
import { Pool } from 'pg'
import Link from 'next/link'
import { CompararClient } from '@/components/comparar/CompararClient'

export const metadata: Metadata = {
  title: 'Comparar Parlamentares | Meus Políticos',
  description: 'Compare gastos, emendas, votações e presença de até 5 parlamentares lado a lado.',
}

type PoliticoCompar = {
  id: string
  slug: string
  nome_eleitoral: string
  nome: string
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partido_sigla: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  total_emendas_ano: number | null
  total_emendas_historico: number | null
  mandato_inicio: string | null
  mandato_fim: string | null
}

type RawRow = {
  id: string
  slug: string
  nome_eleitoral: string | null
  nome: string
  foto_url: string | null
  cargo: string | null
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  total_emendas_ano: number | null
  total_emendas_historico: number | null
  mandato_inicio: string | null
  mandato_fim: string | null
  partido_sigla: string | null
}

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }
  return _pool
}

export default async function CompararPage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>
}) {
  const params = await searchParams
  const slugsParam = params.slugs || ''
  const slugList = slugsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)

  let politicos: PoliticoCompar[] = []

  if (slugList.length > 0) {
    const pool = getPool()
    const result = await pool.query<RawRow>(
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
          p.total_emendas_ano,
          p.total_emendas_historico,
          p.mandato_inicio::text AS mandato_inicio,
          p.mandato_fim::text AS mandato_fim,
          pt.sigla AS partido_sigla
        FROM politicos p
        LEFT JOIN partidos pt ON pt.id = p.partido_id
        WHERE p.slug = ANY($1::text[])
          AND p.removido_em IS NULL
      `,
      [slugList]
    )

    const rows = result.rows

    // Preserve order from slugList
    const bySlug = new Map(rows.map((r) => [r.slug, r]))
    politicos = slugList
      .map((s) => bySlug.get(s))
      .filter((r): r is RawRow => !!r)
      .map((r): PoliticoCompar => ({
        id: r.id,
        slug: r.slug,
        nome_eleitoral: r.nome_eleitoral ?? r.nome,
        nome: r.nome,
        foto_url: r.foto_url,
        cargo: r.cargo,
        uf: r.uf,
        partido_sigla: r.partido_sigla,
        presenca_pct_atual: r.presenca_pct_atual,
        gasto_total_ano: r.gasto_total_ano,
        total_votacoes: r.total_votacoes,
        total_emendas_ano: r.total_emendas_ano,
        total_emendas_historico: r.total_emendas_historico,
        mandato_inicio: r.mandato_inicio,
        mandato_fim: r.mandato_fim,
      }))
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* Header */}
      <div style={{
        background: 'var(--panel)',
        borderBottom: '1px solid var(--line-soft)',
        padding: '28px 24px 22px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link href="/" style={{ fontSize: 13, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>
              ← Início
            </Link>
            <span style={{ color: 'var(--line-strong)', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Comparar</span>
          </div>
          <h1 style={{
            margin: 0,
            fontSize: 'clamp(22px, 3.5vw, 34px)',
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
          }}>
            Comparar Parlamentares
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Selecione até 5 parlamentares para comparar gastos, emendas, votações e presença lado a lado.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px' }}>
        <CompararClient
          politicosIniciais={politicos}
          slugsIniciais={slugList}
        />
      </div>
    </div>
  )
}
