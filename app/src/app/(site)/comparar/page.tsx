import type { Metadata } from 'next'
import { getPgPool } from '@/lib/db/pool'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { CompararClient } from '@/components/comparar/CompararClient'
import { isFeatureActive } from '@/lib/flags'

export const metadata: Metadata = {
  title: 'Comparar Parlamentares | Meus Políticos',
  description: 'Compare gastos, emendas, votações e presença de até 5 parlamentares lado a lado.',
}

import { normalizarPoliticoComparar, type PoliticoCompar, type RawPoliticoComparDb } from '@/lib/utils/politicos'

export default async function PublicCompararPage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>
}) {
  if (!(await isFeatureActive('comparativo_parlamentares'))) {
    redirect('/busca')
  }

  const params = await searchParams
  const slugsParam = params.slugs || ''
  const slugList = slugsParam
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5)

  let politicos: PoliticoCompar[] = []

  if (slugList.length > 0) {
    const pool = getPgPool()
    const result = await pool.query<RawPoliticoComparDb>(
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
      .filter((r): r is RawPoliticoComparDb => !!r)
      .map((r) => normalizarPoliticoComparar(r))
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
