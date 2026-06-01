import type { Metadata } from 'next'
import { Pool } from 'pg'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projetos de Lei — Análise | Meus Políticos',
  description: 'Todos os projetos de lei em tramitação no Congresso com dados completos de autoria, situação e histórico.',
}

const TIPO_LABEL: Record<string, string> = {
  PL:  'Projeto de Lei',
  PEC: 'PEC',
  PLP: 'Lei Complementar',
  PDL: 'Decreto Legislativo',
  MPV: 'Medida Provisória',
}

const SITUACAO_STYLE: Record<string, { bg: string; color: string }> = {
  tramitando: { bg: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  aprovada:   { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  arquivada:  { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' },
  vetada:     { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}

function getSituacaoStyle(s: string | null) {
  if (!s) return SITUACAO_STYLE.arquivada
  const lower = s.toLowerCase()
  if (lower.includes('tramit') || lower.includes('andamento')) return SITUACAO_STYLE.tramitando
  if (lower.includes('aprovad') || lower.includes('sancionad')) return SITUACAO_STYLE.aprovada
  if (lower.includes('arquivad') || lower.includes('retirad'))  return SITUACAO_STYLE.arquivada
  if (lower.includes('vetad'))                                   return SITUACAO_STYLE.vetada
  return SITUACAO_STYLE.arquivada
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

type ProposicaoRow = {
  id: string
  slug: string | null
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  ementa_simples: string | null
  situacao: string | null
  data_apresentacao: string | null
  link_camara: string | null
  link_senado: string | null
  casa_origem: string | null
}

const PAGE_SIZE = 30

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

export default async function AppProjetosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const params = await searchParams
  const tipo = params.tipo?.toUpperCase() || null
  const q = params.q?.trim() || null
  const ano = params.ano ? parseInt(params.ano) : null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const offset = (pagina - 1) * PAGE_SIZE

  const pool = getPool()
  const whereParts: string[] = []
  const values: Array<string | number> = []

  if (tipo) {
    values.push(tipo)
    whereParts.push(`tipo = $${values.length}`)
  }
  if (ano) {
    values.push(ano)
    whereParts.push(`ano = $${values.length}`)
  }
  if (q) {
    values.push(`%${q}%`)
    whereParts.push(`ementa ILIKE $${values.length}`)
  }

  const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : ''
  const countResult = await pool.query<{ total: string }>(
    `SELECT COUNT(*)::text AS total FROM proposicoes ${whereClause}`,
    values
  )

  const dataValues = [...values, PAGE_SIZE, offset]
  const limitParam = dataValues.length - 1
  const offsetParam = dataValues.length
  const dataResult = await pool.query<ProposicaoRow>(
    `
      SELECT
        id,
        slug,
        tipo,
        numero,
        ano,
        ementa,
        ementa_simples,
        situacao,
        data_apresentacao::text AS data_apresentacao,
        link_camara,
        link_senado,
        casa_origem
      FROM proposicoes
      ${whereClause}
      ORDER BY data_apresentacao DESC NULLS LAST
      LIMIT $${limitParam} OFFSET $${offsetParam}
    `,
    dataValues
  )

  const projetos = dataResult.rows
  const total = Number(countResult.rows[0]?.total ?? '0')
  const totalPaginas = Math.ceil(total / PAGE_SIZE)

  // ── helpers de URL ──────────────────────────────────────────────────
  function buildHref(overrides: Record<string, string | null>) {
    const p: Record<string, string> = {}
    if (tipo) p.tipo = tipo
    if (q)    p.q    = q
    if (ano)  p.ano  = String(ano)
    Object.entries(overrides).forEach(([k, v]) => {
      if (v === null) delete p[k]
      else p[k] = v
    })
    const qs = new URLSearchParams(p).toString()
    return `/proposicoes${qs ? '?' + qs : ''}`
  }

  const chipBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', height: 28,
    padding: '0 12px', borderRadius: 999, fontSize: 11, fontWeight: 600,
    textDecoration: 'none', whiteSpace: 'nowrap', cursor: 'pointer', border: 'none',
  }

  return (
    <div style={{ padding: '28px 28px 60px', maxWidth: 1140 }}>
      {/* ── Cabeçalho ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
            Projetos de Lei
          </h1>
          {total > 0 && (
            <span style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              {total.toLocaleString('pt-BR')} proposições
            </span>
          )}
        </div>
        <p style={{ margin: '6px 0 0', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          Câmara dos Deputados — todas as proposições em tramitação e arquivadas.
        </p>
      </div>

      {/* ── Filtros ── */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 20 }}>
        {/* Tipo */}
        {['PL', 'PEC', 'PLP', 'PDL', 'MPV'].map((t) => (
          <Link key={t} href={buildHref({ tipo: tipo === t ? null : t, pagina: '1' })}
            style={{ ...chipBase,
              background: tipo === t ? 'var(--ink)' : 'var(--panel)',
              color: tipo === t ? 'var(--bg)' : 'var(--ink-2)',
              border: `1px solid ${tipo === t ? 'transparent' : 'var(--line)'}`,
            }}>
            {t}
          </Link>
        ))}

        <div style={{ width: 1, height: 20, background: 'var(--line)', margin: '0 4px' }} />

        {/* Ano */}
        {[2025, 2024, 2023].map((y) => (
          <Link key={y} href={buildHref({ ano: ano === y ? null : String(y), pagina: '1' })}
            style={{ ...chipBase,
              background: ano === y ? 'var(--ink)' : 'var(--panel)',
              color: ano === y ? 'var(--bg)' : 'var(--ink-2)',
              border: `1px solid ${ano === y ? 'transparent' : 'var(--line)'}`,
              fontFamily: 'var(--font-mono)',
            }}>
            {y}
          </Link>
        ))}

        <div style={{ flex: 1 }} />

        {/* Busca por ementa */}
        <form method="get" action="/proposicoes" style={{ display: 'flex', gap: 6 }}>
          {tipo && <input type="hidden" name="tipo" value={tipo} />}
          {ano  && <input type="hidden" name="ano"  value={ano}  />}
          <input
            name="q"
            type="text"
            defaultValue={q ?? ''}
            placeholder="Buscar na ementa..."
            style={{
              padding: '6px 12px', fontSize: 12, border: '1px solid var(--line)',
              borderRadius: 6, background: 'var(--bg-2)', color: 'var(--ink)',
              fontFamily: 'var(--font-sans)', outline: 'none', width: 220,
            }}
          />
          <button type="submit"
            style={{ ...chipBase, background: 'var(--brand)', color: '#fff', border: 'none', padding: '0 14px', height: 32, borderRadius: 6, fontSize: 12 }}>
            Buscar
          </button>
          {q && (
            <Link href={buildHref({ q: null, pagina: '1' })}
              style={{ ...chipBase, background: 'var(--panel)', color: 'var(--ink-3)', border: '1px solid var(--line)', height: 32, borderRadius: 6 }}>
              ✕
            </Link>
          )}
        </form>
      </div>

      {/* ── Tabela ── */}
      <div style={{ background: 'var(--panel)', borderRadius: 10, boxShadow: '0 1px 4px rgba(0,0,0,0.12)', overflow: 'hidden', marginBottom: 20 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
              {['Proposição', 'Ementa', 'Apresentação', 'Situação', 'Links'].map((h) => (
                <th key={h} style={{
                  padding: '10px 14px', textAlign: 'left', fontWeight: 600,
                  fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.04em',
                  whiteSpace: 'nowrap',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {projetos.length === 0 && (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--ink-3)' }}>
                  Nenhuma proposição encontrada.
                </td>
              </tr>
            )}
            {projetos.map((p) => {
              const sit = getSituacaoStyle(p.situacao)
              const ementa = p.ementa_simples || p.ementa || '—'
              return (
                <tr key={p.id} style={{ borderTop: '1px solid var(--line)' }}>
                  {/* Proposição */}
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
                      color: 'var(--ink-2)', letterSpacing: '0.04em',
                    }}>
                      {p.tipo} {p.numero}/{p.ano}
                    </span>
                  </td>

                  {/* Ementa */}
                  <td style={{ padding: '10px 14px', maxWidth: 520 }}>
                    <p style={{
                      margin: 0, fontSize: 12.5, color: 'var(--ink)', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>
                      {ementa}
                    </p>
                  </td>

                  {/* Data */}
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {fmtDate(p.data_apresentacao)}
                  </td>

                  {/* Situação */}
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    {p.situacao ? (
                      <span style={{
                        fontSize: 10, padding: '3px 8px', borderRadius: 999,
                        background: sit.bg, color: sit.color, fontWeight: 600,
                        maxWidth: 180, display: 'inline-block', overflow: 'hidden',
                        textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {p.situacao.length > 36 ? p.situacao.slice(0, 36) + '…' : p.situacao}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--ink-3)', fontSize: 11 }}>—</span>
                    )}
                  </td>

                  {/* Links */}
                  <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      {p.slug && (
                        <Link
                          href={`/proposicoes/${p.slug}`}
                          style={{ fontSize: 11, color: 'var(--ink-2)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          Detalhe
                        </Link>
                      )}
                      {p.link_camara && (
                        <a
                          href={p.link_camara}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ fontSize: 11, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}
                        >
                          Câmara ↗
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* ── Paginação ── */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {pagina > 1 && (
            <Link href={buildHref({ pagina: String(pagina - 1) })}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, textDecoration: 'none', color: 'var(--ink-2)', background: 'var(--panel)' }}>
              ← Anterior
            </Link>
          )}

          <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
            {pagina} / {totalPaginas} · {total.toLocaleString('pt-BR')} proposições
          </span>

          {pagina < totalPaginas && (
            <Link href={buildHref({ pagina: String(pagina + 1) })}
              style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 12, textDecoration: 'none', color: 'var(--ink-2)', background: 'var(--panel)' }}>
              Próxima →
            </Link>
          )}

          <div style={{ flex: 1 }} />

          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>
            {PAGE_SIZE} por página
          </span>
        </div>
      )}
    </div>
  )
}
