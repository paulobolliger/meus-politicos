import type { Metadata } from 'next'
import { Pool } from 'pg'
import Link from 'next/link'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Candidatos 2026 | Meus Políticos',
  description: 'Quem vai concorrer nas eleições de outubro de 2026? Candidatos registrados no TSE com situação atualizada.',
}

// ─── Pool singleton ───────────────────────────────────────────────────────────
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5433),
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5, idleTimeoutMillis: 30_000,
  })
  return _pool
}

// ─── Types ────────────────────────────────────────────────────────────────────
type CandidatoRow = {
  id: string
  nome: string
  nome_urna: string | null
  slug: string | null
  cargo: string
  uf: string
  situacao: string | null
  genero: string | null
  cor_raca: string | null
  foto_url: string | null
  partido_sigla: string | null
  partido_nome: string | null
  politico_slug: string | null
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CARGO_LABEL: Record<string, string> = {
  presidente:        'Presidente',
  vice_presidente:   'Vice-Pres.',
  governador:        'Governador',
  vice_governador:   'Vice-Gov.',
  senador:           'Senador',
  deputado_federal:  'Dep. Federal',
  deputado_estadual: 'Dep. Estadual',
  vereador:          'Vereador',
}

const CARGO_FILTROS = [
  { k: 'presidente',       l: 'Presidente' },
  { k: 'governador',       l: 'Governador' },
  { k: 'senador',          l: 'Senador' },
  { k: 'deputado_federal', l: 'Dep. Federal' },
  { k: 'deputado_estadual',l: 'Dep. Estadual' },
]

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG',
  'MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR',
  'RS','SC','SE','SP','TO',
]

// Situação → badge style
type BadgeStyle = { bg: string; color: string; border: string; label: string }
function getSituacaoBadge(situacao: string | null): BadgeStyle {
  const s = (situacao ?? '').toLowerCase()
  if (s.includes('deferido') && !s.includes('in')) {
    return { bg: 'var(--pos-soft)', color: 'var(--pos)', border: 'rgba(4,108,78,0.2)', label: '✓ Deferida' }
  }
  if (s.includes('indeferido') || s.includes('cassado') || s.includes('cancelado')) {
    return { bg: 'var(--neg-soft)', color: 'var(--neg)', border: 'rgba(177,39,28,0.2)', label: '✗ Indeferida' }
  }
  if (s.includes('julgamento') || s.includes('pendente') || s.includes('aguardando')) {
    return { bg: 'var(--warn-soft)', color: 'var(--warn)', border: 'rgba(138,90,10,0.2)', label: 'Em Julgamento' }
  }
  return { bg: 'var(--bg-2)', color: 'var(--ink-3)', border: 'var(--line)', label: situacao ?? 'Pendente' }
}

// Avatar fallback
function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const AVATAR_PALETTE = ['#1d3a8a','#5b21b6','#065f46','#92400e','#1e3a5f','#7c2d12','#164e63','#3b0764']
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function Candidatos2026Page({
  searchParams,
}: {
  searchParams: Promise<{ cargo?: string; uf?: string; pagina?: string; q?: string }>
}) {
  const params = await searchParams
  const cargo  = params.cargo?.toLowerCase() || null
  const uf     = params.uf?.toUpperCase() || null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const q      = params.q?.trim() || null
  const porPagina = 24
  const offset = (pagina - 1) * porPagina

  const pool = getPool()

  // Build query conditions
  const conditions: string[] = ['c.eleicao_ano = 2026']
  const values: (string | number)[] = []
  let idx = 1

  if (cargo) { conditions.push(`c.cargo = $${idx++}`); values.push(cargo) }
  if (uf)    { conditions.push(`c.uf = $${idx++}`);    values.push(uf) }
  if (q)     {
    conditions.push(`(c.nome_urna ILIKE $${idx} OR c.nome ILIKE $${idx})`)
    values.push(`%${q}%`); idx++
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  let candidatos: CandidatoRow[] = []
  let total = 0

  try {
    const [rowsRes, countRes] = await Promise.all([
      pool.query<CandidatoRow>(
        `SELECT
           c.id, c.nome, c.nome_urna, c.slug, c.cargo, c.uf,
           c.situacao, c.genero, c.cor_raca,
           pol.foto_url,
           pt.sigla  AS partido_sigla,
           pt.nome   AS partido_nome,
           p.slug    AS politico_slug
         FROM candidatos c
         LEFT JOIN partidos  pt  ON pt.id  = c.partido_id
         LEFT JOIN politicos p   ON p.id   = c.politico_id
         LEFT JOIN politicos pol ON pol.id = c.politico_id
         ${where}
         ORDER BY c.nome_urna, c.nome
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, porPagina, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM candidatos c ${where}`,
        values
      ),
    ])
    candidatos = rowsRes.rows
    total = parseInt(countRes.rows[0]?.total ?? '0', 10)
  } catch {
    // candidatos table may not exist yet (ETL not run) — render empty state
  }

  const totalPaginas = Math.ceil(total / porPagina)
  const inicio = total > 0 ? offset + 1 : 0
  const fim    = Math.min(offset + porPagina, total)

  // ─── URL helpers ────────────────────────────────────────────────────────────
  const qs = (extra: Record<string, string | null>) => {
    const p: Record<string, string> = {}
    if (cargo) p.cargo = cargo
    if (uf)    p.uf    = uf
    if (q)     p.q     = q
    Object.entries(extra).forEach(([k, v]) => { if (v != null) p[k] = v; else delete p[k] })
    return Object.keys(p).length ? '?' + new URLSearchParams(p).toString() : ''
  }

  const chip = (active: boolean): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center',
    height: 32, padding: '0 14px', borderRadius: 999,
    fontSize: 12, fontWeight: 600, textDecoration: 'none',
    whiteSpace: 'nowrap', transition: 'all 0.12s ease', cursor: 'pointer',
    background: active ? 'var(--ink)' : 'var(--panel)',
    color:      active ? 'var(--bg)' : 'var(--ink-2)',
    border:     `1px solid ${active ? 'var(--ink)' : 'var(--line)'}`,
  })

  const ufChip = (active: boolean): React.CSSProperties => ({
    ...chip(active),
    height: 28, padding: '0 10px', fontSize: 11,
    color: active ? 'var(--bg)' : 'var(--ink-3)',
    fontFamily: 'var(--font-mono)',
  })

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(155deg, #070d1a 0%, #0f1e3d 55%, #1a3066 100%)',
        padding: '56px 24px 48px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: 'radial-gradient(ellipse 50% 70% at 75% 30%, rgba(41,82,204,0.25), transparent)',
        }} />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          {/* Tag */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '4px 12px', borderRadius: 999, marginBottom: 18,
            background: 'rgba(41,82,204,0.25)', border: '1px solid rgba(107,140,255,0.35)',
          }}>
            <span style={{ fontSize: 10 }}>🗳️</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#a5b8ff' }}>
              ELEIÇÕES GERAIS · OUTUBRO 2026
            </span>
          </div>

          <h1 style={{
            margin: 0, fontSize: 'clamp(30px, 5vw, 54px)',
            lineHeight: 1.06, letterSpacing: '-0.03em', color: '#fff',
            fontFamily: 'var(--font-display)',
          }}>
            Candidatos 2026
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.6)', maxWidth: 560, lineHeight: 1.65 }}>
            Candidaturas registradas na Justiça Eleitoral com situação em tempo real.
            {total > 0 && (
              <> <strong style={{ color: '#a5b8ff' }}>{total.toLocaleString('pt-BR')} candidatos</strong> encontrados.</>
            )}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>

        {/* ── FILTROS ──────────────────────────────────────────────────────── */}
        <div style={{
          padding: '20px 0 0',
          borderBottom: '1px solid var(--line-soft)',
          marginBottom: 20,
        }}>
          {/* Cargo chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--ink-3)', marginRight: 2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              Cargo
            </span>
            <Link href={`/candidatos-2026${qs({ cargo: null, pagina: null })}`} style={chip(!cargo)}>
              Todos os Cargos
            </Link>
            {CARGO_FILTROS.map(({ k, l }) => (
              <Link key={k} href={`/candidatos-2026${qs({ cargo: k, pagina: null })}`} style={chip(cargo === k)}>
                {l}
              </Link>
            ))}
          </div>

          {/* UF grid */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 10, color: 'var(--ink-3)', marginRight: 2, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
              Estado
            </span>
            <Link href={`/candidatos-2026${qs({ uf: null, pagina: null })}`} style={ufChip(!uf)}>BR</Link>
            {UFS.map((u) => (
              <Link key={u} href={`/candidatos-2026${qs({ uf: u, pagina: null })}`} style={ufChip(uf === u)}>{u}</Link>
            ))}
          </div>
        </div>

        {/* ── NOTA DE NEUTRALIDADE ─────────────────────────────────────────── */}
        <div style={{
          marginBottom: 24,
          borderRadius: 10, overflow: 'hidden',
          background: 'var(--ink)',
          display: 'flex', alignItems: 'stretch',
          position: 'relative',
        }}>
          {/* Left accent bar */}
          <div style={{ width: 4, background: 'var(--brand-2)', flexShrink: 0 }} />
          {/* Gradient overlay */}
          <div style={{
            position: 'absolute', inset: 0, pointerEvents: 'none',
            background: 'linear-gradient(90deg, rgba(41,82,204,0.3) 0%, transparent 60%)',
          }} />
          <div style={{ padding: '14px 18px', display: 'flex', gap: 12, alignItems: 'flex-start', position: 'relative' }}>
            <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>⚖️</span>
            <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.6, color: 'rgba(255,255,255,0.8)' }}>
              <strong style={{ color: '#fff' }}>Nota de neutralidade.</strong>{' '}
              Os dados são da Justiça Eleitoral (TSE) e não refletem posicionamento político desta plataforma.
              A situação da candidatura pode mudar durante o processo eleitoral.
              A plataforma <strong style={{ color: '#fff' }}>não avalia, ranqueia ou recomenda</strong> candidatos.
            </p>
          </div>
        </div>

        {/* ── CONTAGEM ──────────────────────────────────────────────────────── */}
        {total > 0 && (
          <div style={{ marginBottom: 16, fontSize: 13, color: 'var(--ink-3)' }}>
            Exibindo <strong style={{ color: 'var(--ink-2)' }}>{inicio}–{fim}</strong> de{' '}
            <strong style={{ color: 'var(--ink-2)' }}>{total.toLocaleString('pt-BR')}</strong> candidatos
          </div>
        )}

        {/* ── GRID ─────────────────────────────────────────────────────────── */}
        {candidatos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 52, marginBottom: 16 }}>🗳️</div>
            <p style={{ fontSize: 16, color: 'var(--ink-2)', fontWeight: 600 }}>
              Nenhum candidato encontrado.
            </p>
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, maxWidth: 380, margin: '8px auto 0' }}>
              Os dados serão exibidos após a execução do ETL do TSE.
              {(cargo || uf) && (
                <> <Link href="/candidatos-2026" style={{ color: 'var(--brand)', textDecoration: 'none' }}>Limpar filtros</Link></>
              )}
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
            gap: 14,
            paddingBottom: 40,
          }}>
            {candidatos.map((c) => {
              const nome    = c.nome_urna || c.nome
              const nomeCivil = c.nome_urna ? c.nome : null
              const badge   = getSituacaoBadge(c.situacao)
              const href    = c.politico_slug ? `/p/${c.politico_slug}` : null
              const bg      = avatarBg(nome)
              const cargo_l = CARGO_LABEL[c.cargo] ?? c.cargo

              const cardInner = (
                <div style={{
                  background: 'var(--panel)',
                  borderRadius: 10,
                  overflow: 'hidden',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.07), 0 1px 8px rgba(0,0,0,0.03)',
                  display: 'flex', flexDirection: 'column',
                  transition: 'box-shadow 0.15s ease, transform 0.15s ease',
                  cursor: href ? 'pointer' : 'default',
                  position: 'relative',
                }}>
                  {/* Photo / Avatar */}
                  <div style={{
                    height: 160, position: 'relative',
                    background: bg, overflow: 'hidden',
                    flexShrink: 0,
                  }}>
                    {c.foto_url ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={c.foto_url}
                        alt={nome}
                        style={{
                          width: '100%', height: '100%',
                          objectFit: 'cover', objectPosition: 'top center',
                          filter: 'grayscale(15%)',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 42, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                        fontFamily: 'var(--font-display)',
                        letterSpacing: '-0.03em',
                      }}>
                        {initials(nome)}
                      </div>
                    )}

                    {/* Gradient bottom fade */}
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0, height: 60,
                      background: 'linear-gradient(transparent, rgba(0,0,0,0.35))',
                      pointerEvents: 'none',
                    }} />

                    {/* Partido badge (bottom-left over photo) */}
                    {c.partido_sigla && (
                      <div style={{
                        position: 'absolute', bottom: 8, left: 10,
                        fontSize: 10, fontWeight: 800, fontFamily: 'var(--font-mono)',
                        padding: '2px 8px', borderRadius: 6,
                        background: 'rgba(0,0,0,0.65)', color: '#fff',
                        letterSpacing: '0.05em',
                      }}>
                        {c.partido_sigla}
                      </div>
                    )}

                    {/* Situação badge (top-right) */}
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      fontSize: 9.5, fontWeight: 700, padding: '3px 8px',
                      borderRadius: 999, background: badge.bg,
                      color: badge.color, border: `1px solid ${badge.border}`,
                      backdropFilter: 'blur(4px)', lineHeight: 1.3,
                    }}>
                      {badge.label}
                    </div>
                  </div>

                  {/* Content */}
                  <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {/* Nome */}
                    <div style={{
                      fontSize: 14, fontWeight: 700, color: 'var(--ink)',
                      lineHeight: 1.25, letterSpacing: '-0.01em',
                      whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                    }}>
                      {nome}
                    </div>

                    {/* Nome civil */}
                    {nomeCivil && (
                      <div style={{
                        fontSize: 11, color: 'var(--ink-3)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {nomeCivil}
                      </div>
                    )}

                    {/* Chips row */}
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 4 }}>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        background: 'var(--brand-soft)', color: 'var(--brand)',
                        fontWeight: 600, whiteSpace: 'nowrap',
                      }}>
                        {cargo_l}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '2px 8px', borderRadius: 999,
                        background: 'var(--bg-2)', color: 'var(--ink-3)',
                        fontFamily: 'var(--font-mono)',
                      }}>
                        {c.uf}
                      </span>
                    </div>

                    {/* Footer: Seguir button */}
                    <div style={{ marginTop: 'auto', paddingTop: 10 }}>
                      <Link
                        href="/painel"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          height: 30, borderRadius: 6, width: '100%',
                          fontSize: 11.5, fontWeight: 600, textDecoration: 'none',
                          border: '1px solid var(--line)',
                          background: 'var(--bg)', color: 'var(--ink-2)',
                          transition: 'background 0.12s ease, color 0.12s ease',
                        }}
                      >
                        + Seguir
                      </Link>
                    </div>
                  </div>
                </div>
              )

              return href ? (
                <Link key={c.id} href={href} style={{ textDecoration: 'none', display: 'block' }}>
                  {cardInner}
                </Link>
              ) : (
                <div key={c.id}>{cardInner}</div>
              )
            })}
          </div>
        )}

        {/* ── PAGINAÇÃO ─────────────────────────────────────────────────────── */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 6, marginBottom: 56, flexWrap: 'wrap' }}>
            {pagina > 1 && (
              <Link href={`/candidatos-2026${qs({ pagina: String(pagina - 1) })}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 36, padding: '0 16px', borderRadius: 8,
                border: '1px solid var(--line)', fontSize: 13, textDecoration: 'none',
                color: 'var(--ink-2)', background: 'var(--panel)',
              }}>
                ← Anterior
              </Link>
            )}

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .slice(Math.max(0, pagina - 3), Math.min(totalPaginas, Math.max(0, pagina - 3) + 5))
              .map((p) => (
                <Link key={p} href={`/candidatos-2026${qs({ pagina: String(p) })}`} style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  width: 36, height: 36, borderRadius: 8,
                  border: `1px solid ${p === pagina ? 'var(--ink)' : 'var(--line)'}`,
                  fontSize: 13, textDecoration: 'none',
                  color: p === pagina ? 'var(--bg)' : 'var(--ink-2)',
                  background: p === pagina ? 'var(--ink)' : 'var(--panel)',
                  fontWeight: p === pagina ? 700 : 400,
                }}>
                  {p}
                </Link>
              ))}

            {pagina < totalPaginas && (
              <Link href={`/candidatos-2026${qs({ pagina: String(pagina + 1) })}`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                height: 36, padding: '0 16px', borderRadius: 8,
                border: '1px solid var(--line)', fontSize: 13, textDecoration: 'none',
                color: 'var(--ink-2)', background: 'var(--panel)',
              }}>
                Próxima →
              </Link>
            )}
          </div>
        )}

      </div>
    </div>
  )
}
