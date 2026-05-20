import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('glossario')
    .select('termo, definicao_simples')
    .eq('slug', slug)
    .single()

  if (!data) return { title: 'Termo não encontrado | Glossário' }

  return {
    title: `${data.termo} | Glossário Político — Meus Políticos`,
    description: data.definicao_simples?.slice(0, 160),
  }
}

const CATEGORIA_LABEL: Record<string, string> = {
  legislativo: 'Legislativo',
  eleitoral: 'Eleitoral',
  financeiro: 'Financeiro',
  institucional: 'Institucional',
}

export default async function VerbetePage({ params }: Props) {
  const { slug } = await params
  const supabase = await createClient()

  const { data: verbete } = await supabase
    .from('glossario')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!verbete) notFound()

  // Buscar termos relacionados
  let relacionados: { slug: string; termo: string }[] = []
  if (verbete.termos_relacionados?.length) {
    const { data } = await supabase
      .from('glossario')
      .select('slug, termo')
      .in('slug', verbete.termos_relacionados)
    relacionados = data || []
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '40px 20px' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Link href="/glossario" className="mono" style={{ fontSize: 11, color: '#6b7280', textDecoration: 'none' }}>
          ← Glossário
        </Link>
        {verbete.categoria && (
          <>
            <span className="mono" style={{ fontSize: 11, color: '#d1d5db' }}>/</span>
            <span className="mono" style={{ fontSize: 11, color: '#6b7280' }}>
              {CATEGORIA_LABEL[verbete.categoria] || verbete.categoria}
            </span>
          </>
        )}
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, color: '#0a0e1a', marginBottom: 6 }}>
        {verbete.termo}
      </h1>

      {/* Definição simples */}
      <div
        style={{
          padding: '20px 24px',
          border: '1px solid #bfdbfe',
          background: '#eff6ff',
          marginBottom: 24,
        }}
      >
        <div className="mono" style={{ fontSize: 10, color: '#2563eb', marginBottom: 8, letterSpacing: '0.08em' }}>
          EM LINGUAGEM SIMPLES
        </div>
        <p style={{ fontSize: 15, color: '#1e3a5f', lineHeight: 1.7, margin: 0 }}>
          {verbete.definicao_simples}
        </p>
      </div>

      {/* Exemplo */}
      {verbete.exemplo && (
        <div style={{ padding: '14px 18px', borderLeft: '3px solid #d1d5db', background: '#f9fafb', marginBottom: 24 }}>
          <div className="mono" style={{ fontSize: 10, color: '#9ca3af', marginBottom: 6, letterSpacing: '0.08em' }}>
            EXEMPLO
          </div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.6, margin: 0, fontStyle: 'italic' }}>
            {verbete.exemplo}
          </p>
        </div>
      )}

      {/* Definição técnica */}
      {verbete.definicao_tecnica && (
        <div style={{ marginBottom: 28 }}>
          <div className="mono" style={{ fontSize: 10, color: '#6b7280', marginBottom: 10, letterSpacing: '0.08em' }}>
            DEFINIÇÃO TÉCNICA
          </div>
          <p style={{ fontSize: 14, color: '#374151', lineHeight: 1.7, margin: 0 }}>
            {verbete.definicao_tecnica}
          </p>
        </div>
      )}

      {/* Termos relacionados */}
      {relacionados.length > 0 && (
        <div>
          <div className="mono" style={{ fontSize: 10, color: '#9ca3af', marginBottom: 10, letterSpacing: '0.08em' }}>
            TERMOS RELACIONADOS
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {relacionados.map((r) => (
              <Link
                key={r.slug}
                href={`/glossario/${r.slug}`}
                style={{
                  padding: '5px 12px',
                  border: '1px solid #d1d5db',
                  fontSize: 13,
                  color: '#374151',
                  textDecoration: 'none',
                  background: '#fff',
                }}
              >
                {r.termo}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
