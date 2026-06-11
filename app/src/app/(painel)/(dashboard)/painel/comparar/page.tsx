import type { Metadata } from 'next'
import { getPgPool } from '@/lib/db/pool'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { CompararClient } from '@/components/comparar/CompararClient'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isFeatureActive } from '@/lib/flags'

export const metadata: Metadata = {
  title: 'Comparar Parlamentares | Painel Meus Políticos',
}

import { normalizarPoliticoComparar, type PoliticoCompar, type RawPoliticoComparDb } from '@/lib/utils/politicos'

export default async function PrivateCompararPage({
  searchParams,
}: {
  searchParams: Promise<{ slugs?: string }>
}) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')

  if (!(await isFeatureActive('comparativo_parlamentares', currentUser.perfilId))) {
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
    <div style={{ background: 'var(--bg)', minHeight: '100vh', padding: 24 }}>
      {/* Header */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <Link href="/painel" style={{ fontSize: 13, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>
            ← Painel
          </Link>
          <span style={{ color: 'var(--line-strong)', fontSize: 13 }}>/</span>
          <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Comparar</span>
        </div>
        <h1 style={{
          margin: 0,
          fontSize: '28px',
          letterSpacing: '-0.02em',
          color: 'var(--ink)',
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
        }}>
          Comparar Parlamentares
        </h1>
        <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Compare gastos, emendas, votações e presença de até 5 parlamentares no painel interno.
        </p>
      </div>

      <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: 20 }}>
        <CompararClient
          politicosIniciais={politicos}
          slugsIniciais={slugList}
        />
      </div>
    </div>
  )
}
