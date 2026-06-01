import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import Link from 'next/link'

type Props = { params: Promise<{ slug: string }> }

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

// ── Types ─────────────────────────────────────────────────────────────────────
type Verbete = {
  slug: string
  termo: string
  definicao_simples: string
  definicao_tecnica: string | null
  categoria: string
  exemplo: string | null
  termos_relacionados: string[] | null
}

type TermoRelacionado = { slug: string; termo: string }

// ── Categorias ────────────────────────────────────────────────────────────────
const CATS: Record<string, { label: string; color: string; bg: string }> = {
  legislativo:   { label: 'Legislativo',   color: '#0051d5', bg: '#e8eeff' },
  eleitoral:     { label: 'Eleitoral',     color: '#10B981', bg: '#e6faf4' },
  financeiro:    { label: 'Financeiro',    color: '#D97706', bg: '#fef3e2' },
  institucional: { label: 'Institucional', color: '#EF4444', bg: '#feeaea' },
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pool = getPool()
  const { rows } = await pool.query<{ termo: string; definicao_simples: string }>(
    `SELECT termo, definicao_simples FROM glossario WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  if (!rows[0]) return { title: 'Termo não encontrado | Glossário' }
  return {
    title: `${rows[0].termo} | Glossário Político — Meus Políticos`,
    description: rows[0].definicao_simples?.slice(0, 160),
  }
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function VerbetePage({ params }: Props) {
  const { slug } = await params
  const pool = getPool()

  const { rows } = await pool.query<Verbete>(
    `SELECT slug, termo, definicao_simples, definicao_tecnica,
            categoria, exemplo, termos_relacionados
     FROM glossario WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  if (!rows[0]) notFound()
  const verbete = rows[0]

  let relacionados: TermoRelacionado[] = []
  if (verbete.termos_relacionados?.length) {
    const { rows: rel } = await pool.query<TermoRelacionado>(
      `SELECT slug, termo FROM glossario WHERE slug = ANY($1::text[]) ORDER BY termo ASC`,
      [verbete.termos_relacionados]
    )
    relacionados = rel
  }

  const cat = CATS[verbete.categoria]

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 80px' }}>

        {/* ── Breadcrumbs ── */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 6,
          marginBottom: 32,
          fontSize: 13, color: 'var(--ink-3)',
        }}>
          <Link href="/" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}
            className="verbete-bc-link">Início</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <Link href="/glossario" style={{ color: 'var(--ink-3)', textDecoration: 'none' }}
            className="verbete-bc-link">Glossário</Link>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m9 18 6-6-6-6"/>
          </svg>
          <span style={{ color: 'var(--ink)', fontWeight: 600 }}>{verbete.termo}</span>
        </nav>

        {/* ── Grid ── */}
        <div className="verbete-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 340px',
          gap: 48,
          alignItems: 'start',
        }}>

          {/* ════════════ LEFT COLUMN ════════════ */}
          <div>

            {/* Header */}
            <header style={{ marginBottom: 28 }}>
              <h1 style={{
                margin: '0 0 16px',
                fontSize: 'clamp(32px, 4vw, 48px)',
                fontWeight: 800, lineHeight: 1.1,
                letterSpacing: '-0.025em', color: 'var(--ink)',
              }}>
                {verbete.termo}
              </h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {cat && (
                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '4px 14px', borderRadius: 999,
                    background: cat.bg,
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    color: cat.color, fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: cat.color }} />
                    {cat.label}
                  </span>
                )}
              </div>
            </header>

            {/* ── Highlight box: O que é ── */}
            <section style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: '24px 28px',
              marginBottom: 28,
              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                {/* Lightbulb icon */}
                <div style={{
                  width: 40, height: 40, flexShrink: 0,
                  borderRadius: 10,
                  background: '#f0f5ff',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                    stroke="#0051d5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/>
                    <path d="M9 18h6"/><path d="M10 22h4"/>
                  </svg>
                </div>
                <div>
                  <h2 style={{
                    margin: '0 0 10px',
                    fontSize: 16, fontWeight: 700,
                    color: 'var(--ink)',
                  }}>
                    O que é, em poucas palavras
                  </h2>
                  <p style={{
                    margin: 0,
                    fontSize: 15, lineHeight: 1.75,
                    color: 'var(--ink-2)',
                  }}>
                    {verbete.definicao_simples}
                  </p>
                </div>
              </div>
            </section>

            {/* ── Como funciona na prática (exemplo) ── */}
            {verbete.exemplo && (
              <section style={{ marginBottom: 28 }}>
                <h3 style={{
                  margin: '0 0 16px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 20, fontWeight: 700, color: 'var(--ink)',
                }}>
                  {/* Analytics icon */}
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#f0f5ff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#0051d5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
                      <line x1="6" y1="20" x2="6" y2="14"/>
                    </svg>
                  </span>
                  Como funciona na prática
                </h3>
                <div style={{
                  background: '#f8f9ff',
                  border: '1px solid #dce9ff',
                  borderRadius: 12,
                  padding: '20px 24px',
                }}>
                  <p style={{
                    margin: 0,
                    fontSize: 14, lineHeight: 1.75,
                    color: 'var(--ink-2)',
                    fontStyle: 'italic',
                  }}>
                    {verbete.exemplo}
                  </p>
                </div>
              </section>
            )}

            {/* ── Por que isso importa (definição técnica) ── */}
            {verbete.definicao_tecnica && (
              <section style={{
                background: '#f8f9ff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: '24px 28px',
                position: 'relative', overflow: 'hidden',
              }}>
                <h3 style={{
                  margin: '0 0 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  fontSize: 20, fontWeight: 700, color: 'var(--ink)',
                }}>
                  {/* Shield icon */}
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: '#e8eeff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#0051d5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                    </svg>
                  </span>
                  Por que isso importa?
                </h3>
                <p style={{
                  margin: 0,
                  fontSize: 14, lineHeight: 1.8,
                  color: 'var(--ink-2)',
                }}>
                  {verbete.definicao_tecnica}
                </p>
                {/* Decorative blob */}
                <div style={{
                  position: 'absolute', right: -40, bottom: -40,
                  width: 140, height: 140, borderRadius: '50%',
                  background: 'rgba(0,81,213,0.05)',
                  pointerEvents: 'none',
                }} />
              </section>
            )}

          </div>

          {/* ════════════ RIGHT SIDEBAR ════════════ */}
          <aside style={{
            position: 'sticky', top: 24,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>

            {/* Termos Relacionados */}
            {relacionados.length > 0 && (
              <div style={{
                background: '#f8f9ff',
                border: '1px solid #e5e7eb',
                borderRadius: 16,
                padding: '20px 20px',
              }}>
                <div style={{
                  fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                  color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                  textTransform: 'uppercase', marginBottom: 14,
                }}>
                  Termos Relacionados
                </div>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {relacionados.map((r) => (
                    <li key={r.slug}>
                      <Link href={`/glossario/${r.slug}`}
                        className="verbete-rel-item"
                        style={{
                          display: 'flex', alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          background: 'white',
                          borderRadius: 10,
                          border: '1px solid transparent',
                          textDecoration: 'none',
                          transition: 'border-color 0.15s, color 0.15s',
                        }}>
                        <span style={{
                          fontSize: 14, fontWeight: 600,
                          color: 'var(--ink)',
                        }}>
                          {r.termo}
                        </span>
                        {/* Arrow icon */}
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
                          stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                          className="verbete-rel-arrow">
                          <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contexto Legal — placeholder estático */}
            <div style={{
              background: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: 16,
              padding: '20px 20px',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
                color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', marginBottom: 16,
              }}>
                Contexto Legal
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{
                    fontSize: 18, flexShrink: 0, marginTop: 1,
                    color: '#D97706',
                  }}>⚖️</span>
                  <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Constituição Federal</div>
                    <div style={{ color: 'var(--ink-3)' }}>Base legal para termos do direito público e eleitoral brasileiro.</div>
                    <a href="https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm"
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 6, fontSize: 12, fontWeight: 600,
                        color: 'var(--brand-2)', textDecoration: 'none',
                      }}
                      className="verbete-ext-link">
                      Ver no Planalto
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                </div>
                <hr style={{ border: 'none', borderTop: '1px solid #f3f4f6', margin: 0 }} />
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>🏛️</span>
                  <div style={{ fontSize: 13, lineHeight: 1.55 }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)', marginBottom: 2 }}>Portal do TSE</div>
                    <div style={{ color: 'var(--ink-3)' }}>Glossário e definições técnicas do Tribunal Superior Eleitoral.</div>
                    <a href="https://www.tse.jus.br"
                      target="_blank" rel="noopener noreferrer"
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4,
                        marginTop: 6, fontSize: 12, fontWeight: 600,
                        color: 'var(--brand-2)', textDecoration: 'none',
                      }}
                      className="verbete-ext-link">
                      Acessar Portal do TSE
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none"
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                        <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback Widget */}
            <div style={{
              background: '#f0f5ff',
              border: '1px solid #dce9ff',
              borderRadius: 16,
              padding: '20px',
              textAlign: 'center',
            }}>
              <p style={{
                margin: '0 0 16px',
                fontSize: 13, color: 'var(--ink-2)', fontWeight: 500,
                lineHeight: 1.5,
              }}>
                Esta explicação foi clara para você?
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20 }}>
                <button
                  className="verbete-feedback-btn"
                  data-label="Sim"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'white', border: '1px solid #e5e7eb',
                    fontSize: 18,
                    transition: 'background 0.15s',
                  }} className="verbete-feedback-icon">👍</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }} className="verbete-feedback-label">Sim</span>
                </button>
                <button
                  className="verbete-feedback-btn"
                  data-label="Não"
                  style={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                    background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                  }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: 40, height: 40, borderRadius: '50%',
                    background: 'white', border: '1px solid #e5e7eb',
                    fontSize: 18,
                    transition: 'background 0.15s',
                  }} className="verbete-feedback-icon">👎</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.06em',
                    color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase',
                  }} className="verbete-feedback-label">Não</span>
                </button>
              </div>
            </div>

            {/* Back link */}
            <Link href="/glossario" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--brand-2)',
              textDecoration: 'none', fontWeight: 600,
            }}
              className="verbete-back-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
              Ver todos os termos
            </Link>

          </aside>

        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .verbete-bc-link:hover { color: var(--brand-2) !important; }

        .verbete-rel-item:hover {
          border-color: var(--brand-2) !important;
        }
        .verbete-rel-item:hover span { color: var(--brand-2) !important; }
        .verbete-rel-item:hover .verbete-rel-arrow { stroke: var(--brand-2); }

        .verbete-ext-link:hover { text-decoration: underline !important; }
        .verbete-back-link:hover { text-decoration: underline !important; }

        @media (max-width: 960px) {
          .verbete-grid { grid-template-columns: 1fr !important; }
          aside { position: static !important; }
        }
        @media (max-width: 600px) {
          .verbete-grid { padding: 0; }
        }
      ` }} />

      <script dangerouslySetInnerHTML={{ __html: `
        document.querySelectorAll('.verbete-feedback-btn').forEach(btn => {
          btn.addEventListener('click', () => {
            const label = btn.querySelector('.verbete-feedback-label');
            const icon  = btn.querySelector('.verbete-feedback-icon');
            label.textContent = 'Obrigado!';
            icon.style.background = '#e8eeff';
            setTimeout(() => {
              label.textContent = btn.dataset.label;
              icon.style.background = 'white';
            }, 2000);
          });
        });
      ` }} />
    </div>
  )
}
