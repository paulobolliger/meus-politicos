import type { Metadata } from 'next'
import Link from 'next/link'
import { ProjetosSearchForm } from '@/components/projetos/ProjetosSearchForm'
import { ProjetosViewSelector } from '@/components/projetos/ProjetosViewSelector'
import { getPgPool } from '@/lib/db/pool'

export const metadata: Metadata = {
  title: 'Projetos de Lei | Meus Políticos',
  description: 'Acompanhe os projetos de lei em tramitação no Congresso Nacional em linguagem simples.',
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
  titulo_simplificado: string | null
  situacao: string | null
  data_apresentacao: string | null
  atualizado_em: string | null
  autor_nome: string | null
  autor_foto: string | null
  autor_slug: string | null
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
    const pool = getPgPool()

    const conditions: string[] = []
    const values: unknown[]    = []
    let idx = 1

    if (tipo) { conditions.push(`p.tipo = $${idx++}`); values.push(tipo) }
    if (q)    {
      const accentFrom = 'áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ'
      const accentTo   = 'aaaaaeeeeiiiiooooouuuucAAAAAEEEEIIIIOOOOOUUUUC'
      const sqlTrans = (col: string) => `translate(${col}, '${accentFrom}', '${accentTo}')`
      
      conditions.push(`(${sqlTrans('p.ementa')} ILIKE ${sqlTrans(`$${idx}`)} OR ${sqlTrans('p.ementa_simples')} ILIKE ${sqlTrans(`$${idx}`)} OR ${sqlTrans('p.titulo_simplificado')} ILIKE ${sqlTrans(`$${idx}`)})`)
      values.push(`%${q}%`)
      idx++
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countRes = await pool.query(`SELECT COUNT(*) FROM proposicoes p ${where}`, values)
    total = parseInt(countRes.rows[0].count, 10)

    const dataRes = await pool.query<Projeto>(
      `SELECT
         p.id, p.slug, p.tipo, p.numero, p.ano,
         p.ementa, p.ementa_simples, p.titulo_simplificado, p.situacao,
         p.data_apresentacao, p.atualizado_em,
         a.autor_nome, a.autor_foto, a.autor_slug
       FROM proposicoes p
       LEFT JOIN LATERAL (
         SELECT
           COALESCE(pol.nome_eleitoral, pa.nome) AS autor_nome,
           pol.foto_url AS autor_foto,
           pol.slug AS autor_slug
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
    <div style={{ background: '#0F172A', minHeight: '100vh', color: '#CBD5E1' }}>
      <main style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px' }}>

        {/* ── Hero ── */}
        <section style={{ marginBottom: 48 }}>
          <h2 style={{
            margin: '0 0 16px',
            fontSize: 'clamp(32px, 4vw, 40px)',
            fontWeight: 800,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
            color: '#F8FAFC',
          }}>
            Projetos de Lei em Foco
          </h2>
          <p style={{
            margin: 0,
            fontSize: 16, lineHeight: 1.6,
            color: '#94A3B8',
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

        {/* ── Grid/List ── */}
        {projetos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📜</div>
            <p style={{ fontSize: 16, color: '#94A3B8', fontWeight: 500 }}>
              {q ? `Nenhum resultado para "${q}".` : 'Nenhum projeto encontrado.'}
            </p>
            {!q && (
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 6 }}>
                Execute o ETL Câmara para importar os dados.
              </p>
            )}
          </div>
        ) : (
          <ProjetosViewSelector projetos={projetos} />
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
    </div>
  )
}

const paginaBtnBase: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  width: 40, height: 40, borderRadius: 8,
  border: '1px solid var(--line)',
  fontSize: 15, fontWeight: 500,
  textDecoration: 'none',
  color: 'var(--ink-2)',
  background: 'var(--panel)',
  transition: 'background 0.15s, border-color 0.15s',
}

const paginaBtnAtivo: React.CSSProperties = {
  ...paginaBtnBase,
  background: 'var(--brand)',
  color: 'white',
  border: '1px solid var(--brand)',
  fontWeight: 700,
}
