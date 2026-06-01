import type { Metadata } from 'next'
import Link from 'next/link'
import { Pool } from 'pg'

export const metadata: Metadata = {
  title: 'Glossário Político | Meus Políticos',
  description: 'Entenda os termos fundamentais da democracia brasileira em linguagem simples: PL, PEC, CEAP, quórum e muito mais.',
}

// ── Postgres ──────────────────────────────────────────────────────────────────
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? '5433'),
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    connectionTimeoutMillis: 4000,
  })
  return _pool
}

// ── Categorias ────────────────────────────────────────────────────────────────
const CATS: Record<string, { label: string; color: string }> = {
  legislativo:   { label: 'Legislativo',   color: '#0051d5' },
  eleitoral:     { label: 'Eleitoral',     color: '#10B981' },
  financeiro:    { label: 'Financeiro',    color: '#D97706' },
  institucional: { label: 'Institucional', color: '#EF4444' },
}

// ── Types ─────────────────────────────────────────────────────────────────────
type TermoRow = {
  slug: string
  termo: string
  definicao_simples: string
  categoria: string
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function GlossarioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; letra?: string }>
}) {
  const params    = await searchParams
  const categoria = params.categoria?.toLowerCase() || null
  const q         = params.q?.trim() || null
  const letraFiltro = params.letra?.toUpperCase() || null

  const pool = getPool()

  const conditions: string[] = []
  const values: unknown[]    = []
  let idx = 1

  if (categoria) { conditions.push(`categoria = $${idx++}`); values.push(categoria) }
  if (q)         { conditions.push(`(termo ILIKE $${idx} OR definicao_simples ILIKE $${idx})`); values.push(`%${q}%`); idx++ }
  if (letraFiltro) { conditions.push(`UPPER(LEFT(termo, 1)) = $${idx++}`); values.push(letraFiltro) }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query<TermoRow>(
    `SELECT slug, termo, definicao_simples, categoria
     FROM glossario ${where}
     ORDER BY termo ASC`,
    values
  )

  // Todas as letras com termos (para o nav A-Z, sem filtro de letra)
  const { rows: letrasRows } = await pool.query<{ letra: string }>(
    `SELECT DISTINCT UPPER(LEFT(termo, 1)) AS letra FROM glossario ORDER BY 1`
  )
  const letrasDisponiveis = letrasRows.map(r => r.letra)

  // Agrupar por letra
  const porLetra: Record<string, TermoRow[]> = {}
  for (const t of rows) {
    const inicial = (t.termo[0] || '#').toUpperCase()
    if (!porLetra[inicial]) porLetra[inicial] = []
    porLetra[inicial]!.push(t)
  }
  const letras = Object.keys(porLetra).sort()

  const totalTermos = rows.length
  const TODAS_LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 80px' }}>

        {/* ── Hero ── */}
        <section style={{ marginBottom: 40 }}>
          <h1 style={{
            margin: '0 0 12px',
            fontSize: 'clamp(32px, 4vw, 48px)',
            fontWeight: 800, lineHeight: 1.15,
            letterSpacing: '-0.02em', color: 'var(--ink)',
          }}>
            Glossário Político
          </h1>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 600 }}>
            Entenda os termos fundamentais da democracia brasileira.
            Descomplicamos a linguagem técnica para fortalecer a transparência e a cidadania.
            {totalTermos > 0 && (
              <> <strong style={{ color: 'var(--ink-2)' }}>{totalTermos} termos</strong> explicados em linguagem simples.</>
            )}
          </p>
        </section>

        {/* ── Busca + Filtros ── */}
        <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Search */}
          <form method="GET" action="/glossario" style={{ position: 'relative', maxWidth: 480 }}>
            {categoria && <input type="hidden" name="categoria" value={categoria} />}
            <svg style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              name="q"
              defaultValue={q ?? ''}
              type="text"
              placeholder="Buscar termo..."
              autoComplete="off"
              style={{
                width: '100%', boxSizing: 'border-box',
                background: 'white', border: '1px solid #c6c6cd',
                borderRadius: 12, padding: '11px 16px 11px 42px',
                fontSize: 14, color: 'var(--ink)', outline: 'none',
                fontFamily: 'var(--font-sans)',
              }}
            />
          </form>

          {/* A–Z nav */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            background: 'white', border: '1px solid #c6c6cd',
            borderRadius: 12, padding: '6px 8px',
            overflowX: 'auto',
          }} className="glossario-az-nav">
            {/* ALL */}
            <Link href={categoria ? `/glossario?categoria=${categoria}` : '/glossario'}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 44, height: 36, borderRadius: 8,
                background: !letraFiltro ? 'var(--brand-2)' : 'transparent',
                color: !letraFiltro ? '#fff' : 'var(--ink-3)',
                fontSize: 11, fontWeight: 700, textDecoration: 'none',
                fontFamily: 'var(--font-mono)', flexShrink: 0,
              }}>
              ALL
            </Link>

            {TODAS_LETRAS.map(letra => {
              const temTermos = letrasDisponiveis.includes(letra)
              const ativa    = letraFiltro === letra
              const href     = temTermos
                ? `/glossario?letra=${letra}${categoria ? `&categoria=${categoria}` : ''}${q ? `&q=${q}` : ''}`
                : '#'
              return (
                <Link key={letra} href={href}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    minWidth: 36, height: 36, borderRadius: 8,
                    background: ativa ? 'var(--brand-2)' : 'transparent',
                    color: ativa ? '#fff' : temTermos ? 'var(--ink-2)' : '#d1d5db',
                    fontSize: 13, fontWeight: ativa ? 700 : 500,
                    textDecoration: 'none', flexShrink: 0,
                    pointerEvents: temTermos ? 'auto' : 'none',
                    fontFamily: 'var(--font-mono)',
                    transition: 'background 0.15s',
                  }}
                  className={temTermos ? 'glossario-letra-btn' : ''}
                >
                  {letra}
                </Link>
              )
            })}
          </div>

          {/* Category chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
              color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
              textTransform: 'uppercase', marginRight: 4,
            }}>Filtrar por:</span>

            <Link href={`/glossario${q ? `?q=${q}` : ''}${letraFiltro ? `${q ? '&' : '?'}letra=${letraFiltro}` : ''}`}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '6px 14px', borderRadius: 999,
                background: !categoria ? 'var(--ink)' : '#f3f4f6',
                color: !categoria ? '#fff' : 'var(--ink-2)',
                fontSize: 13, fontWeight: 600, textDecoration: 'none',
                border: `1px solid ${!categoria ? 'var(--ink)' : '#e5e7eb'}`,
                transition: 'all 0.15s',
              }}>
              Todos
            </Link>

            {Object.entries(CATS).map(([cat, { label, color }]) => {
              const ativo = categoria === cat
              const href  = `/glossario?categoria=${cat}${q ? `&q=${q}` : ''}${letraFiltro ? `&letra=${letraFiltro}` : ''}`
              return (
                <Link key={cat} href={href}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '6px 14px', borderRadius: 999,
                    background: ativo ? 'var(--ink)' : '#f3f4f6',
                    color: ativo ? '#fff' : 'var(--ink-2)',
                    fontSize: 13, fontWeight: 600, textDecoration: 'none',
                    border: `1px solid ${ativo ? 'var(--ink)' : '#e5e7eb'}`,
                    transition: 'all 0.15s',
                  }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  {label}
                </Link>
              )
            })}
          </div>
        </div>

        {/* ── Conteúdo ── */}
        {letras.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <p style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink-2)', margin: '0 0 8px' }}>
              {q ? `Nenhum resultado para "${q}".` : 'Nenhum termo encontrado.'}
            </p>
            <Link href="/glossario" style={{ fontSize: 14, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}>
              Ver todos os termos →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {letras.map(letra => (
              <div key={letra} id={`letra-${letra}`} style={{
                borderTop: '1px solid #e5e7eb',
                paddingTop: 28, paddingBottom: 40,
              }}>
                {/* Letra header */}
                <h2 style={{
                  margin: '0 0 24px',
                  fontSize: 'clamp(36px, 4vw, 48px)',
                  fontWeight: 800, lineHeight: 1,
                  letterSpacing: '-0.02em',
                  color: 'var(--brand-2)',
                }}>
                  {letra}
                </h2>

                {/* Grid 3 colunas */}
                <div className="glossario-grid" style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 20,
                }}>
                  {(porLetra[letra] || []).map(t => {
                    const cat = CATS[t.categoria]
                    return (
                      <Link key={t.slug} href={`/glossario/${t.slug}`}
                        style={{ textDecoration: 'none' }}
                        className="glossario-card-link"
                      >
                        <div className="glossario-card" style={{
                          background: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: 12,
                          padding: '20px 22px',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: 12,
                          transition: 'border-color 0.15s, box-shadow 0.15s',
                        }}>
                          <div>
                            {/* Dot + termo */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                              <span style={{
                                width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                                background: cat?.color ?? 'var(--ink-3)',
                              }} />
                              <h3 style={{
                                margin: 0, fontSize: 16, fontWeight: 700,
                                lineHeight: 1.3, color: 'var(--ink)',
                              }}>
                                {t.termo}
                              </h3>
                            </div>

                            {/* Descrição — 2 linhas */}
                            <p style={{
                              margin: 0, fontSize: 13, lineHeight: 1.55,
                              color: 'var(--ink-3)',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}>
                              {t.definicao_simples}
                            </p>
                          </div>

                          {/* Ver detalhes */}
                          <div style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 13, fontWeight: 700, color: 'var(--brand-2)',
                          }}>
                            Ver detalhes
                            <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .glossario-az-nav { scrollbar-width: none; }
        .glossario-az-nav::-webkit-scrollbar { display: none; }
        .glossario-letra-btn:hover { background: #e5eeff !important; color: var(--brand-2) !important; }
        .glossario-card:hover {
          border-color: var(--brand-2) !important;
          box-shadow: 0 4px 16px rgba(0,81,213,0.08) !important;
        }
        .glossario-card:hover h3 { color: var(--brand-2); }
        @media (max-width: 960px) {
          .glossario-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
        @media (max-width: 600px) {
          .glossario-grid { grid-template-columns: 1fr !important; }
        }
      ` }} />
    </div>
  )
}
