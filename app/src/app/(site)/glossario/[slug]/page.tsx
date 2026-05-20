import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Props = { params: Promise<{ slug: string }> }

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

const CATEGORIA_LABEL: Record<string, string> = {
  legislativo:  'Legislativo',
  eleitoral:    'Eleitoral',
  financeiro:   'Financeiro',
  institucional:'Institucional',
}

const CATEGORIA_DOT: Record<string, string> = {
  legislativo:  'var(--brand)',
  eleitoral:    '#7c3aed',
  financeiro:   'var(--pos)',
  institucional:'var(--warn)',
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('glossario')
    .select('termo, definicao_simples')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Termo não encontrado | Glossário' }

  return {
    title: `${(data as { termo: string }).termo} | Glossário Político — Meus Políticos`,
    description: (data as { definicao_simples: string }).definicao_simples?.slice(0, 160),
  }
}

export default async function VerbetePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw } = await (supabase as any)
    .from('glossario')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!raw) notFound()
  const verbete = raw as Verbete

  let relacionados: TermoRelacionado[] = []
  if (verbete.termos_relacionados?.length) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('glossario')
      .select('slug, termo')
      .in('slug', verbete.termos_relacionados)
    relacionados = (data as TermoRelacionado[]) || []
  }

  const dot = CATEGORIA_DOT[verbete.categoria] ?? 'var(--ink-3)'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Breadcrumb header ── */}
      <div style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line-soft)', padding: '14px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Link href="/glossario" style={{ fontSize: 13, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>
            ← Glossário
          </Link>
          {verbete.categoria && (
            <>
              <span style={{ color: 'var(--line-strong)' }}>/</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: dot }} />
                <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                  {CATEGORIA_LABEL[verbete.categoria] || verbete.categoria}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '36px 24px 72px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(28px, 5vw, 44px)', lineHeight: 1.1, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          {verbete.termo}
        </h1>

        {/* ── Definição simples ── */}
        <div style={{ margin: '24px 0', padding: '20px 24px', background: 'var(--brand-soft)', borderLeft: '3px solid var(--brand)', borderRadius: '0 8px 8px 0' }}>
          <div className="label" style={{ marginBottom: 10, color: 'var(--brand)' }}>EM LINGUAGEM SIMPLES</div>
          <p style={{ fontSize: 16, color: 'var(--ink)', lineHeight: 1.7, margin: 0 }}>
            {verbete.definicao_simples}
          </p>
        </div>

        {/* ── Exemplo ── */}
        {verbete.exemplo && (
          <div style={{ margin: '0 0 24px', padding: '14px 18px', background: 'var(--panel)', borderLeft: '3px solid var(--line-strong)', borderRadius: '0 6px 6px 0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div className="label" style={{ marginBottom: 8, color: 'var(--mute)' }}>EXEMPLO</div>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
              {verbete.exemplo}
            </p>
          </div>
        )}

        {/* ── Definição técnica ── */}
        {verbete.definicao_tecnica && (
          <div style={{ margin: '0 0 28px' }}>
            <div className="label" style={{ marginBottom: 10 }}>DEFINIÇÃO TÉCNICA</div>
            <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.75, margin: 0 }}>
              {verbete.definicao_tecnica}
            </p>
          </div>
        )}

        {/* ── Termos relacionados ── */}
        {relacionados.length > 0 && (
          <div style={{ paddingTop: 24, borderTop: '1px solid var(--line-soft)' }}>
            <div className="label" style={{ marginBottom: 12 }}>TERMOS RELACIONADOS</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {relacionados.map((r) => (
                <Link key={r.slug} href={`/glossario/${r.slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', height: 32, padding: '0 12px',
                    borderRadius: 999, background: 'var(--panel)', border: '1px solid var(--line)',
                    fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none', fontWeight: 500,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                  }}>
                  {r.termo}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Back link ── */}
        <div style={{ marginTop: 48 }}>
          <Link href="/glossario" style={{ fontSize: 13, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}>
            ← Ver todos os termos
          </Link>
        </div>
      </div>
    </div>
  )
}
