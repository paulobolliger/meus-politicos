import { redirect } from 'next/navigation'
import Link from 'next/link'

import { getPgPool } from '@/lib/db/pool'
import { getCurrentUser } from '@/lib/auth/current-user'
import { isFeatureActive } from '@/lib/flags'
import { MeusPoliticosClient, type SeguidoPolitico } from '@/components/painel/MeusPoliticosClient'
import { normalizarPolitico } from '@/lib/utils/politicos'

type AcompanhamentoRow = {
  politico_id: string
  tipo: string
}

type PoliticoResumoRow = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  presenca_pct_atual: number | null
  partido_sigla: string | null
}

export default async function MeusPoliticosPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')

  const db = getPgPool()

  let acompanhamentosRows: AcompanhamentoRow[] = []
  try {
    const { rows } = await db.query<AcompanhamentoRow>(
      'SELECT politico_id, tipo FROM acompanhamentos WHERE usuario_id = $1',
      [currentUser.perfilId],
    )
    acompanhamentosRows = rows
  } catch (err) {
    console.error('Erro ao consultar acompanhamentos:', err)
  }

  const acompanhamentos = acompanhamentosRows ?? []
  const idsAcompanhados = Array.from(new Set(acompanhamentos.map((a) => a.politico_id).filter(Boolean)))
  const acompanhamentosTipoMap = new Map(acompanhamentos.map((a) => [a.politico_id, a.tipo]))

  let politicosRows: PoliticoResumoRow[] = []
  if (idsAcompanhados.length) {
    try {
      const { rows } = await db.query<PoliticoResumoRow>(
        `SELECT
           p.id,
           p.slug,
           p.nome,
           p.nome_eleitoral,
           p.cargo,
           p.uf,
           p.foto_url,
           p.presenca_pct_atual,
           pa.sigla AS partido_sigla
         FROM politicos p
         LEFT JOIN partidos pa ON pa.id = p.partido_id
         WHERE p.id = ANY($1::uuid[])`,
        [idsAcompanhados],
      )
      politicosRows = rows
    } catch (err) {
      console.error('Erro ao consultar politicos acompanhados:', err)
    }
  }

  const politicosMap = new Map(politicosRows.map((p) => [p.id, p] as const))

  const seguindo: SeguidoPolitico[] = idsAcompanhados
    .map((id) => {
      const politico = politicosMap.get(id)
      if (!politico) return null
      const item = normalizarPolitico(politico)
      if (!item) return null
      item.tipo = (acompanhamentosTipoMap.get(id) || 'seguir') as 'voto' | 'seguir'
      return item
    })
    .filter((p): p is SeguidoPolitico => p !== null)

  const isPremium = await isFeatureActive('plano_premium')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%', padding: 24 }}>
      {/* Header */}
      <div style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 14,
        padding: '24px 28px',
        marginBottom: 24,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Link href="/painel" style={{ fontSize: 13, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>
              ← Painel
            </Link>
            <span style={{ color: 'var(--line-strong)', fontSize: 13 }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>Meus Políticos</span>
          </div>
          <h1 style={{
            margin: 0,
            fontSize: '28px',
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
          }}>
            Meus Políticos Acompanhados
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
            Monitore o desempenho, votações and gastos dos parlamentares que você segue.
          </p>
        </div>

        <Link href="/busca" style={{
          display: 'inline-flex',
          alignItems: 'center',
          height: 40,
          padding: '0 18px',
          borderRadius: 8,
          background: 'var(--brand-2)',
          color: 'white',
          fontSize: 13,
          fontWeight: 600,
          textDecoration: 'none',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
        }}>
          Adicionar Político +
        </Link>
      </div>

      <MeusPoliticosClient initialSeguindo={seguindo} isPremium={isPremium} />
    </div>
  )
}
