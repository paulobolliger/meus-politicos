import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Glossário Político | Meus Políticos',
  description: 'Entenda os termos da política brasileira em linguagem simples: PL, PEC, CEAP, emenda parlamentar e muito mais.',
}

type Categoria = 'legislativo' | 'eleitoral' | 'financeiro' | 'institucional'

const CATEGORIA_LABEL: Record<Categoria, string> = {
  legislativo:  'Legislativo',
  eleitoral:    'Eleitoral',
  financeiro:   'Financeiro',
  institucional:'Institucional',
}

const CATEGORIA_DOT: Record<Categoria, string> = {
  legislativo:  'var(--brand)',
  eleitoral:    '#7c3aed',
  financeiro:   'var(--pos)',
  institucional:'var(--warn)',
}

type TermoRow = {
  slug: string
  termo: string
  definicao_simples: string
  categoria: string
}

export default async function GlossarioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string }>
}) {
  const params = await searchParams
  const categoria = params.categoria || null
  const busca = params.q?.trim() || null

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('glossario')
    .select('slug, termo, definicao_simples, categoria')
    .order('termo', { ascending: true })

  if (categoria) query = query.eq('categoria', categoria)
  if (busca) query = query.ilike('termo', `%${busca}%`)

  const { data: termos } = await query
  const rows: TermoRow[] = termos || []

  // Group by first letter
  const porLetra: Record<string, TermoRow[]> = {}
  for (const t of rows) {
    const inicial = (t.termo[0] || '#').toUpperCase()
    if (!porLetra[inicial]) porLetra[inicial] = []
    porLetra[inicial]!.push(t)
  }
  const letras = Object.keys(porLetra).sort()

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 32,
    padding: '0 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <section style={{ background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)', borderBottom: '1px solid var(--line-soft)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="label" style={{ marginBottom: 12 }}>POLÍTICA EM LINGUAGEM SIMPLES</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            Glossário Político
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 560 }}>
            {rows.length > 0
              ? <><strong style={{ color: 'var(--ink-2)' }}>{rows.length} termos</strong> explicados em linguagem cidadã — sem jargão, com exemplos reais.</>
              : 'Termos da política brasileira explicados em linguagem simples.'}
          </p>

          {/* Categoria filter */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href="/glossario"
              style={{ ...chipBase, background: !categoria ? 'var(--ink)' : 'var(--panel)', color: !categoria ? 'var(--bg)' : 'var(--ink-2)', border: `1px solid ${!categoria ? 'var(--ink)' : 'var(--line)'}` }}>
              Todos
            </Link>
            {(Object.entries(CATEGORIA_LABEL) as [Categoria, string][]).map(([cat, label]) => (
              <Link key={cat} href={`/glossario?categoria=${cat}`}
                style={{ ...chipBase, background: categoria === cat ? 'var(--ink)' : 'var(--panel)', color: categoria === cat ? 'var(--bg)' : 'var(--ink-2)', border: `1px solid ${categoria === cat ? 'var(--ink)' : 'var(--line)'}` }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: CATEGORIA_DOT[cat], marginRight: 8, flexShrink: 0 }} />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* A–Z jump bar */}
        {letras.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 28, paddingBottom: 20, borderBottom: '1px solid var(--line-soft)' }}>
            {letras.map((l) => (
              <a key={l} href={`#letra-${l}`}
                style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand-2)', textDecoration: 'none', fontFamily: 'var(--font-mono)' }}>
                {l}
              </a>
            ))}
          </div>
        )}

        {/* Empty state */}
        {letras.length === 0 && (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📖</div>
            <p style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>Nenhum termo encontrado.</p>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>
              Execute a migration e o seed: <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--bg-2)', padding: '2px 6px', borderRadius: 4 }}>psql -f supabase/seed_glossario.sql</code>
            </p>
          </div>
        )}

        {/* Terms by letter */}
        {letras.map((letra) => (
          <div key={letra} id={`letra-${letra}`} style={{ marginBottom: 36 }}>
            <div className="label" style={{ marginBottom: 12, color: 'var(--mute)' }}>{letra}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(porLetra[letra] || []).map((t) => {
                const dot = CATEGORIA_DOT[t.categoria as Categoria] ?? 'var(--ink-3)'
                return (
                  <Link key={t.slug} href={`/glossario/${t.slug}`}
                    style={{
                      textDecoration: 'none',
                      display: 'block',
                      background: 'var(--panel)',
                      borderRadius: 8,
                      padding: '14px 16px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 6px rgba(0,0,0,0.03)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 5 }}>
                      <span style={{ width: 8, height: 8, borderRadius: 2, background: dot, flexShrink: 0 }} />
                      <span style={{ fontSize: 14.5, fontWeight: 600, color: 'var(--ink)' }}>{t.termo}</span>
                      {t.categoria && (
                        <span className="mono" style={{ fontSize: 9, color: 'var(--ink-3)', letterSpacing: '0.08em', marginLeft: 'auto' }}>
                          {CATEGORIA_LABEL[t.categoria as Categoria] || t.categoria}
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5, paddingLeft: 18,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.definicao_simples}
                    </p>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
