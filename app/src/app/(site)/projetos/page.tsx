import type { Metadata } from 'next'
import { Pool } from 'pg'
import Link from 'next/link'
import Image from 'next/image'
import { ProjetosSearchForm } from '@/components/projetos/ProjetosSearchForm'

export const metadata: Metadata = {
  title: 'Projetos de Lei | Meus Políticos',
  description: 'Acompanhe os projetos de lei em tramitação no Congresso Nacional em linguagem simples.',
}

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

// ── Status ────────────────────────────────────────────────
type SituacaoInfo = { label: string; bg: string; color: string }

function situacaoInfo(s: string | null): SituacaoInfo {
  if (!s) return { label: '—', bg: '#e5e7eb', color: '#6b7280' }
  const lower = s.toLowerCase()
  if (lower.includes('tramit') || lower.includes('andamento') || lower.includes('votaç'))
    return { label: 'Em Votação', bg: '#F59E0B', color: '#fff' }
  if (lower.includes('aprovad') || lower.includes('sancionad') || lower.includes('promulgad'))
    return { label: 'Aprovado',   bg: '#10B981', color: '#fff' }
  if (lower.includes('arquivad') || lower.includes('retirad') || lower.includes('prejudicad'))
    return { label: 'Arquivado',  bg: '#76777d', color: '#fff' }
  if (lower.includes('vetad') || lower.includes('rejeitad'))
    return { label: 'Vetado',     bg: '#EF4444', color: '#fff' }
  return { label: s.length > 22 ? s.slice(0, 22) + '…' : s, bg: '#e5e7eb', color: '#6b7280' }
}

// ── Helpers ───────────────────────────────────────────────
function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

/** Extrai um título curto da ementa para usar como h3 */
function extrairTitulo(ementa: string | null, ementa_simples: string | null): string {
  if (ementa_simples) return ementa_simples.length > 80 ? ementa_simples.slice(0, 80) + '…' : ementa_simples
  if (!ementa) return 'Sem título'
  // Primeira frase, ou primeiros 70 chars
  const dot = ementa.search(/[.;—–]/)
  if (dot > 10 && dot < 90) return ementa.slice(0, dot)
  return ementa.length > 70 ? ementa.slice(0, 70) + '…' : ementa
}

// ── Types ─────────────────────────────────────────────────
type Projeto = {
  id: string
  slug: string | null
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  ementa_simples: string | null
  situacao: string | null
  data_apresentacao: string | null
  atualizado_em: string | null
  autor_nome: string | null
  autor_foto: string | null
}

// ── Page ─────────────────────────────────────────────────
export default async function ProjetosSitePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; q?: string; pagina?: string }>
}) {
  const params    = await searchParams
  const tipo      = params.tipo?.toUpperCase() || null
  const q         = params.q?.trim() || null
  const pagina    = Math.max(1, parseInt(params.pagina || '1', 10))
  const porPagina = 21
  const offset    = (pagina - 1) * porPagina

  let projetos: Projeto[] = []
  let total = 0

  try {
    const pool = getPool()

    const conditions: string[] = []
    const values: unknown[]    = []
    let idx = 1

    if (tipo) { conditions.push(`p.tipo = $${idx++}`); values.push(tipo) }
    if (q)    { conditions.push(`(p.ementa ILIKE $${idx} OR p.ementa_simples ILIKE $${idx})`); values.push(`%${q}%`); idx++ }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await pool.query(`SELECT COUNT(*) FROM proposicoes p ${where}`, values)
    total = parseInt(countRes.rows[0].count, 10)

    const dataRes = await pool.query<Projeto>(
      `SELECT
         p.id, p.slug, p.tipo, p.numero, p.ano,
         p.ementa, p.ementa_simples, p.situacao,
         p.data_apresentacao, p.atualizado_em,
         a.autor_nome, a.autor_foto
       FROM proposicoes p
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(pol.nome_eleitoral, pa.nome) AS autor_nome,
           pol.foto_url AS autor_foto
         FROM proposicao_autores pa
         LEFT JOIN politicos pol ON pol.id = pa.politico_id
         WHERE pa.proposicao_id = p.id
         LIMIT 1
       ) a ON true
       ${where}
       ORDER BY p.data_apresentacao DESC NULLS LAST
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...values, porPagina, offset]
    )
    projetos = dataRes.rows
  } catch (err) {
    console.error('[projetos] erro:', err)
  }

  const totalPaginas = Math.ceil(total / porPagina)

  function paginaHref(p: number) {
    const ps = new URLSearchParams()
    if (tipo) ps.set('tipo', tipo)
    if (q)    ps.set('q', q)
    if (p > 1) ps.set('pagina', String(p))
    const qs = ps.toString()
    return qs ? `/projetos?${qs}` : '/projetos'
  }

  const maxVisible = 3
  let pageStart = Math.max(1, pagina - Math.floor(maxVisible / 2))
  const pageEnd  = Math.min(totalPaginas, pageStart + maxVisible - 1)
  if (pageEnd - pageStart + 1 < maxVisible) pageStart = Math.max(1, pageEnd - maxVisible + 1)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px' }}>

        {/* ── Hero ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(32px, 4vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: 'var(--ink)',
          }}>
            Projetos de Lei em Foco
          </h2>
          <p style={{
            margin: 0,
            fontSize: 16, lineHeight: 1.6,
            color: 'var(--ink-3)',
            maxWidth: 640,
          }}>
            Acompanhe o que está sendo discutido no Congresso Nacional de forma simples.
            Entenda como cada projeto pode mudar o seu dia a dia.
          </p>
        </section>

        {/* ── Search + Filter ── */}
        <section style={{ marginBottom: 32 }}>
          <ProjetosSearchForm defaultQ={q ?? ''} defaultTipo={tipo ?? ''} />
        </section>

        {/* ── Grid ── */}
        {projetos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📜</div>
            <p style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>
              {q ? `Nenhum resultado para "${q}".` : 'Nenhum projeto encontrado.'}
            </p>
            {!q && (
              <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6 }}>
                Execute o ETL Câmara para importar os dados.
              </p>
            )}
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: 24,
          }}>
            {projetos.map((p) => {
              const sit     = situacaoInfo(p.situacao)
              const titulo  = extrairTitulo(p.ementa, p.ementa_simples)
              const descricao = p.ementa_simples ? p.ementa : null
              const href    = p.slug ? `/projetos/${p.slug}` : null
              const dataUlt = p.atualizado_em ?? p.data_apresentacao
              const dataStr = dataUlt
                ? new Date(dataUlt).toLocaleDateString('pt-BR')
                : null

              const card = (
                <div style={{
                  background: 'white',
                  border: '1px solid #c6c6cd',
                  borderRadius: 12,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                  transition: 'box-shadow 0.2s ease',
                }} className="projeto-card">

                  {/* Top */}
                  <div>
                    {/* Tipo badge + Status pill */}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 16,
                      gap: 8,
                    }}>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        background: '#e5eeff',
                        color: 'var(--ink)',
                        padding: '3px 8px',
                        borderRadius: 4,
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {p.tipo} {p.numero}/{p.ano}
                      </span>
                      <span style={{
                        fontSize: 10, fontWeight: 700,
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        background: sit.bg,
                        color: sit.color,
                        padding: '3px 10px',
                        borderRadius: 999,
                        fontFamily: 'var(--font-mono)',
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}>
                        {sit.label}
                      </span>
                    </div>

                    {/* Título */}
                    <h3 style={{
                      margin: '0 0 8px',
                      fontSize: 18, fontWeight: 700,
                      lineHeight: 1.35,
                      color: 'var(--ink)',
                    }}>
                      {titulo}
                    </h3>

                    {/* Descrição */}
                    {descricao && (
                      <p style={{
                        margin: '0 0 16px',
                        fontSize: 14, lineHeight: 1.55,
                        color: 'var(--ink-3)',
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {descricao}
                      </p>
                    )}
                  </div>

                  {/* Bottom — border-top */}
                  <div style={{
                    borderTop: '1px solid #e5e7eb',
                    paddingTop: 16,
                    marginTop: 16,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}>
                    {/* Author */}
                    {p.autor_nome && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        {p.autor_foto ? (
                          <Image
                            src={p.autor_foto}
                            alt={p.autor_nome}
                            width={32} height={32}
                            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                            unoptimized
                          />
                        ) : (
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: '#dce9ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700, color: 'var(--ink-2)',
                            flexShrink: 0,
                          }}>
                            {iniciais(p.autor_nome)}
                          </div>
                        )}
                        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                          {p.autor_nome}
                        </span>
                      </div>
                    )}

                    {/* Última atualização + data */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{
                        fontSize: 10, letterSpacing: '0.05em',
                        textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                        color: 'var(--ink-3)',
                      }}>
                        Última atualização
                      </span>
                      {dataStr && (
                        <span style={{
                          fontSize: 13, fontFamily: 'var(--font-mono)',
                          color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums',
                        }}>
                          {dataStr}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )

              if (href) {
                return (
                  <Link key={p.id} href={href}
                    style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}
                  >
                    {card}
                  </Link>
                )
              }
              return <div key={p.id} style={{ display: 'flex', flexDirection: 'column' }}>{card}</div>
            })}
          </div>
        )}

        {/* ── Paginação ── */}
        {totalPaginas > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: 8, marginTop: 48,
          }}>
            {/* ‹ */}
            <Link
              href={paginaHref(pagina - 1)}
              aria-disabled={pagina <= 1}
              style={{
                ...paginaBtnBase,
                pointerEvents: pagina <= 1 ? 'none' : 'auto',
                opacity: pagina <= 1 ? 0.35 : 1,
              }}
            >
              ‹
            </Link>

            {/* Páginas */}
            {pageStart > 1 && (
              <>
                <Link href={paginaHref(1)} style={paginaBtnBase}>{1}</Link>
                {pageStart > 2 && <span style={{ padding: '0 4px', color: 'var(--ink-3)' }}>...</span>}
              </>
            )}

            {Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i).map((n) => (
              <Link key={n} href={paginaHref(n)} style={n === pagina ? paginaBtnAtivo : paginaBtnBase}>
                {n}
              </Link>
            ))}

            {pageEnd < totalPaginas && (
              <>
                {pageEnd < totalPaginas - 1 && <span style={{ padding: '0 4px', color: 'var(--ink-3)' }}>...</span>}
                <Link href={paginaHref(totalPaginas)} style={paginaBtnBase}>{totalPaginas}</Link>
              </>
            )}

            {/* › */}
            <Link
              href={paginaHref(pagina + 1)}
              aria-disabled={pagina >= totalPaginas}
              style={{
                ...paginaBtnBase,
                pointerEvents: pagina >= totalPaginas ? 'none' : 'auto',
                opacity: pagina >= totalPaginas ? 0.35 : 1,
              }}
            >
              ›
            </Link>
          </div>
        )}

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        .projeto-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
        }
      ` }} />
    </div>
  )
}

const paginaBtnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 40, height: 40, borderRadius: 8,
  border: '1px solid #c6c6cd',
  fontSize: 15, fontWeight: 500,
  textDecoration: 'none',
  color: 'var(--ink-2)',
  background: 'white',
  transition: 'background 0.15s',
}

const paginaBtnAtivo: React.CSSProperties = {
  ...paginaBtnBase,
  background: 'var(--ink)',
  color: 'white',
  border: '1px solid var(--ink)',
  fontWeight: 700,
}
