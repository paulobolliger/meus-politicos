import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Glossário Político | Meus Políticos',
  description: 'Entenda os termos da política brasileira em linguagem simples: PL, PEC, CEAP, emenda parlamentar e muito mais.',
}

const CATEGORIA_LABEL: Record<string, string> = {
  legislativo: 'Legislativo',
  eleitoral: 'Eleitoral',
  financeiro: 'Financeiro',
  institucional: 'Institucional',
}

const CATEGORIA_COR: Record<string, string> = {
  legislativo: '#2563eb',
  eleitoral: '#7c3aed',
  financeiro: '#059669',
  institucional: '#d97706',
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

  let query = supabase
    .from('glossario')
    .select('slug, termo, definicao_simples, categoria')
    .order('termo', { ascending: true })

  if (categoria) query = query.eq('categoria', categoria)
  if (busca) query = query.ilike('termo', `%${busca}%`)

  const { data: termos } = await query

  // Agrupar por inicial
  const porLetra: Record<string, typeof termos> = {}
  for (const t of termos || []) {
    const inicial = (t.termo[0] || '#').toUpperCase()
    if (!porLetra[inicial]) porLetra[inicial] = []
    porLetra[inicial]!.push(t)
  }
  const letras = Object.keys(porLetra).sort()

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '40px 20px' }}>
      <h1 className="mono" style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: '#0a0e1a' }}>
        Glossário Político
      </h1>
      <p style={{ fontSize: 14, color: '#5a6478', marginBottom: 28, lineHeight: 1.6 }}>
        Termos da política brasileira em linguagem simples. Clique em qualquer termo para ver a explicação completa.
      </p>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <Link
          href="/glossario"
          className="mono"
          style={{
            padding: '5px 12px',
            fontSize: 11,
            border: `1px solid ${!categoria ? '#0a0e1a' : '#d1d5db'}`,
            color: !categoria ? '#0a0e1a' : '#6b7280',
            textDecoration: 'none',
            background: !categoria ? '#f1f5f9' : 'transparent',
          }}
        >
          Todos
        </Link>
        {Object.entries(CATEGORIA_LABEL).map(([cat, label]) => (
          <Link
            key={cat}
            href={`/glossario?categoria=${cat}`}
            className="mono"
            style={{
              padding: '5px 12px',
              fontSize: 11,
              border: `1px solid ${categoria === cat ? CATEGORIA_COR[cat] : '#d1d5db'}`,
              color: categoria === cat ? CATEGORIA_COR[cat] : '#6b7280',
              textDecoration: 'none',
              background: categoria === cat ? `${CATEGORIA_COR[cat]}15` : 'transparent',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      {/* Índice A-Z */}
      {letras.length > 0 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
          {letras.map((l) => (
            <a
              key={l}
              href={`#letra-${l}`}
              className="mono"
              style={{ fontSize: 11, color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}
            >
              {l}
            </a>
          ))}
        </div>
      )}

      {/* Termos por letra */}
      {letras.length === 0 ? (
        <div className="mono" style={{ textAlign: 'center', color: '#9ca3af', padding: '40px 0', fontSize: 13 }}>
          Nenhum termo encontrado.
          <br />
          <span style={{ fontSize: 11 }}>Execute: psql -f supabase/seed_glossario.sql</span>
        </div>
      ) : (
        letras.map((letra) => (
          <div key={letra} id={`letra-${letra}`} style={{ marginBottom: 32 }}>
            <div
              className="mono"
              style={{ fontSize: 11, fontWeight: 700, color: '#9ca3af', marginBottom: 10, letterSpacing: '0.12em' }}
            >
              {letra}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {(porLetra[letra] || []).map((t) => (
                <Link
                  key={t.slug}
                  href={`/glossario/${t.slug}`}
                  style={{ textDecoration: 'none', display: 'block', padding: '12px 16px', border: '1px solid #e5e7eb', background: '#fff' }}
                >
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontSize: 14, fontWeight: 600, color: '#0a0e1a' }}>{t.termo}</span>
                    {t.categoria && (
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          color: CATEGORIA_COR[t.categoria] || '#6b7280',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {CATEGORIA_LABEL[t.categoria] || t.categoria}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: 13, color: '#5a6478', margin: 0, lineHeight: 1.4,
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {t.definicao_simples}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}
