import { redirect } from 'next/navigation'
import { Pool } from 'pg'
import { getCurrentUser } from '@/lib/auth/current-user'
import { AdminPageHeader } from '@/components/admin/AdminCard'
import { PoliticoEditorSection } from '@/components/admin/PoliticoEditorSection'
import { MatchEmendaButton } from '@/components/admin/MatchEmendaButton'

export const metadata = { title: 'Qualidade de Dados — Admin' }

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return '0'
  return n.toLocaleString('pt-BR')
}

function fmtBRL(valor: number | null): string {
  if (!valor) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor)
}

type CountRow = {
  count: number
}

type OrphanEmendaRow = {
  nome_parlamentar: string | null
  tipo_emenda: string | null
  valor_pago: number | string | null
  valor_empenhado: number | string | null
}

type NormalizedOrphanEmendaRow = {
  nome_parlamentar: string | null
  tipo_emenda: string | null
  valor_pago: number | null
  valor_empenhado: number | null
}

type PoliticoEditorRow = {
  id: string
  nome_civil: string | null
  nome_eleitoral: string | null
  foto_url: string | null
  codigo_siafi: string | null
  email: string | null
  partido_id: string | null
  situacao: string | null
  gabinete_nome: string | null
  gabinete_telefone: string | null
  gabinete_email: string | null
  uf: string
  cargo: string
}

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }

  return pool
}

function toNumber(value: number | string | null): number | null {
  if (value === null) return null
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : null
}

export default async function DadosQualidadePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/painel')

  const params = await searchParams
  const busca = params.busca ?? ''
  const db = getPool()

  // Load all parties
  const { rows: partidosRows } = await db.query<{ id: string; sigla: string; nome: string }>(
    'SELECT id, sigla, nome FROM partidos ORDER BY sigla ASC'
  )
  const partidos = partidosRows.map((p) => ({
    id: p.id,
    sigla: p.sigla,
    nome: p.nome,
  }))

  // Section 1: incomplete politicians
  const { rows: semFotoRows } = await db.query<CountRow>(
    'SELECT COUNT(*)::int AS count FROM politicos WHERE foto_url IS NULL'
  )
  const semFoto = semFotoRows[0]?.count ?? 0

  const { rows: semSiafiRows } = await db.query<CountRow>(
    'SELECT COUNT(*)::int AS count FROM politicos WHERE codigo_siafi IS NULL'
  )
  const semSiafi = semSiafiRows[0]?.count ?? 0

  // Section 2: orphan emendas — fetch individual ones only (bancada/comissão are expected orphans)
  const { rows: orphanEmendasRows } = await db.query<OrphanEmendaRow>(`
    SELECT nome_parlamentar, tipo_emenda, valor_pago, valor_empenhado
    FROM emendas
    WHERE politico_id IS NULL
    LIMIT 3000
  `)
  const orphanEmendas: NormalizedOrphanEmendaRow[] = orphanEmendasRows.map((emenda) => ({
    nome_parlamentar: emenda.nome_parlamentar,
    tipo_emenda: emenda.tipo_emenda,
    valor_pago: toNumber(emenda.valor_pago),
    valor_empenhado: toNumber(emenda.valor_empenhado),
  }))

  // Separate individual (fixable) from collective (expected)
  const individualOrphans: NormalizedOrphanEmendaRow[] = []
  const collectiveOrphans: NormalizedOrphanEmendaRow[] = []
  for (const e of orphanEmendas) {
    const nm = (e.nome_parlamentar ?? '').toLowerCase()
    const isBancada = nm.startsWith('bancada') || nm.startsWith('com.') || nm.startsWith('comissão') || nm.startsWith('comissao')
    if (isBancada) collectiveOrphans.push(e)
    else individualOrphans.push(e)
  }

  // Group individual orphans by nome_parlamentar
  const orphanMap = new Map<string, { count: number; total: number }>()
  for (const e of individualOrphans) {
    const key = e.nome_parlamentar ?? '(sem nome)'
    const entry = orphanMap.get(key) ?? { count: 0, total: 0 }
    entry.count++
    entry.total += (e.valor_pago ?? e.valor_empenhado ?? 0)
    orphanMap.set(key, entry)
  }
  const orphanRows = Array.from(orphanMap.entries())
    .sort((a, b) => b[1].total - a[1].total)
    .slice(0, 30)

  // Summary for collective
  const collectiveTotal = collectiveOrphans.reduce((sum, e) => sum + (e.valor_pago ?? e.valor_empenhado ?? 0), 0)

  // Section 3: politician editor search
  let politicosResults: PoliticoEditorRow[] = []
  if (busca.length >= 2) {
    const { rows } = await db.query<PoliticoEditorRow>(
      `
        SELECT id, nome_civil, nome_eleitoral, foto_url, codigo_siafi, email,
               partido_id, situacao, gabinete_nome, gabinete_telefone, gabinete_email,
               uf, cargo
        FROM politicos
        WHERE nome_civil ILIKE $1 OR nome_eleitoral ILIKE $1
        LIMIT 20
      `,
      [`%${busca}%`]
    )
    politicosResults = rows
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000 }}>
      <AdminPageHeader
        title="Qualidade de Dados"
        subtitle="Inconsistências, dados faltantes e editor inline"
      />

      {/* Section 1: Incomplete politicians */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        1 — POLÍTICOS INCOMPLETOS
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 12,
          marginBottom: 32,
        }}
      >
        {[
          { label: 'Sem foto', value: semFoto, icon: '📷' },
          { label: 'Sem código SIAFI', value: semSiafi, icon: '🔢' },
        ].map((item) => (
          <div
            key={item.label}
            style={{
              background: 'var(--panel)',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <span style={{ fontSize: 26 }}>{item.icon}</span>
            <div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  fontFamily: 'var(--font-mono)',
                  color: (item.value ?? 0) > 0 ? 'var(--warn)' : 'var(--pos)',
                  lineHeight: 1,
                }}
              >
                {fmtNum(item.value)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 3 }}>
                {item.label}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Section 2: Orphan emendas */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 8 }}>
        2 — EMENDAS INDIVIDUAIS SEM POLÍTICO VINCULADO
      </h2>
      {collectiveOrphans.length > 0 && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginBottom: 12, padding: '8px 12px', background: 'var(--bg-2)', borderRadius: 6 }}>
          ℹ️ <strong>{collectiveOrphans.length}</strong> emendas coletivas (bancada/comissão, total {fmtBRL(collectiveTotal)}) não aparecem aqui — não mapeiam para um único político. Isso é esperado.
        </div>
      )}

      {orphanRows.length === 0 ? (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '20px 24px',
            color: 'var(--pos)',
            fontSize: 14,
            marginBottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>✓</span> Nenhuma emenda individual órfã. Execute <code>populate_siafi.py</code> após atualizar senadores.
        </div>
      ) : (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            marginBottom: 32,
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
            <thead>
              <tr style={{ background: 'var(--bg-2)' }}>
                {['Parlamentar', 'Emendas', 'Total', ''].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontWeight: 600,
                      fontSize: 12,
                      color: 'var(--ink-3)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {orphanRows.map(([nome, data]) => (
                <tr key={nome} style={{ borderTop: '1px solid var(--line)' }}>
                  <td
                    style={{
                      padding: '9px 14px',
                      fontWeight: 500,
                      color: 'var(--ink)',
                    }}
                  >
                    {nome}
                  </td>
                  <td
                    style={{
                      padding: '9px 14px',
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                    }}
                  >
                    {data.count}
                  </td>
                  <td
                    style={{
                      padding: '9px 14px',
                      color: 'var(--ink-2)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: 13,
                    }}
                  >
                    {fmtBRL(data.total)}
                  </td>
                  <td style={{ padding: '9px 14px' }}>
                    <MatchEmendaButton nomeParlamentar={nome} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Section 3: Politician editor */}
      <h2 style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.06em', color: 'var(--ink-3)', marginBottom: 12 }}>
        3 — EDITOR DE POLÍTICOS
      </h2>

      <PoliticoEditorSection
        busca={busca}
        results={politicosResults}
        partidos={partidos}
      />
    </div>
  )
}
