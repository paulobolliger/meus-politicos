import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projetos de Lei | Meus Políticos',
  description: 'Acompanhe os projetos de lei em tramitação no Congresso Nacional em linguagem simples.',
}

const TIPO_LABEL: Record<string, string> = {
  PL:  'Projeto de Lei',
  PEC: 'Emenda Constitucional',
  PLP: 'Lei Complementar',
  PDL: 'Decreto Legislativo',
  MPV: 'Medida Provisória',
}

type SituacaoKey = 'tramitando' | 'aprovada' | 'arquivada' | 'vetada'

const SITUACAO_STYLE: Record<SituacaoKey, { bg: string; color: string }> = {
  tramitando: { bg: 'var(--info-soft)', color: 'var(--info)' },
  aprovada:   { bg: 'var(--pos-soft)',  color: 'var(--pos)'  },
  arquivada:  { bg: 'var(--bg-2)',      color: 'var(--ink-3)'},
  vetada:     { bg: 'var(--neg-soft)',  color: 'var(--neg)'  },
}

function situacaoStyle(s: string | null) {
  if (!s) return { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
  const lower = s.toLowerCase()
  if (lower.includes('tramit') || lower.includes('andamento')) return SITUACAO_STYLE.tramitando
  if (lower.includes('aprovad') || lower.includes('sancionad')) return SITUACAO_STYLE.aprovada
  if (lower.includes('arquivad') || lower.includes('retirad'))  return SITUACAO_STYLE.arquivada
  if (lower.includes('vetad'))                                   return SITUACAO_STYLE.vetada
  return { bg: 'var(--bg-2)', color: 'var(--ink-3)' }
}

export default async function ProjetosSitePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; pagina?: string }>
}) {
  const params = await searchParams
  const tipo = params.tipo?.toUpperCase() || null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const porPagina = 20
  const offset = (pagina - 1) * porPagina

  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase as any)
    .from('proposicoes')
    .select('id, slug, tipo, numero, ano, ementa, ementa_simples, situacao, data_apresentacao', { count: 'exact' })
    .order('data_apresentacao', { ascending: false })
    .range(offset, offset + porPagina - 1)

  if (tipo) query = query.eq('tipo', tipo)

  const { data: projetos, count } = await query

  const totalPaginas = Math.ceil(((count as number) || 0) / porPagina)

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 32,
    padding: '0 14px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Hero compacto ── */}
      <section style={{ background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)', borderBottom: '1px solid var(--line-soft)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 860, margin: '0 auto' }}>
          <div className="label" style={{ marginBottom: 12 }}>CONGRESSO NACIONAL</div>
          <h1 style={{ margin: 0, fontSize: 'clamp(30px, 5vw, 52px)', lineHeight: 1.1, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            Projetos de Lei
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 560 }}>
            Propostas em tramitação no Congresso.{' '}
            {count != null && (
              <strong style={{ color: 'var(--ink-2)' }}>{(count as number).toLocaleString('pt-BR')} projetos</strong>
            )}{' '}
            <Link href="/glossario/projeto-de-lei" style={{ color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 500 }}>
              O que é um PL? ↗
            </Link>
          </p>

          {/* Filtros tipo */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 20 }}>
            <Link href="/projetos"
              style={{ ...chipBase, background: !tipo ? 'var(--ink)' : 'var(--panel)', color: !tipo ? 'var(--bg)' : 'var(--ink-2)', border: `1px solid ${!tipo ? 'var(--ink)' : 'var(--line)'}` }}>
              Todos
            </Link>
            {Object.entries(TIPO_LABEL).map(([t, label]) => (
              <Link key={t} href={`/projetos?tipo=${t}`}
                style={{ ...chipBase, background: tipo === t ? 'var(--ink)' : 'var(--panel)', color: tipo === t ? 'var(--bg)' : 'var(--ink-2)', border: `1px solid ${tipo === t ? 'var(--ink)' : 'var(--line)'}` }}>
                <span className="mono" style={{ fontSize: 11, fontWeight: 700, marginRight: 6 }}>{t}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '28px 24px 60px' }}>
        {/* ── Lista ── */}
        {!projetos || (projetos as []).length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>📜</div>
            <p style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>Nenhum projeto encontrado.</p>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>Execute o ETL Câmara para importar os dados.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(projetos as {
              id: string; slug: string | null; tipo: string; numero: string; ano: number;
              ementa: string | null; ementa_simples: string | null; situacao: string | null;
              data_apresentacao: string | null;
            }[]).map((p) => {
              const sit = situacaoStyle(p.situacao)
              const texto = p.ementa_simples || p.ementa || 'Sem descrição disponível.'
              const href = p.slug ? `/projetos/${p.slug}` : null

              return (
                <article
                  key={p.id}
                  style={{
                    background: 'var(--panel)',
                    borderRadius: 10,
                    padding: '16px 18px',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)',
                    cursor: href ? 'pointer' : 'default',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
                    <span className="mono" style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'var(--bg-2)', color: 'var(--ink-2)', letterSpacing: '0.06em', fontWeight: 600, flexShrink: 0 }}>
                      {p.tipo} {p.numero}/{p.ano}
                    </span>
                    {p.situacao && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: sit.bg, color: sit.color, fontWeight: 600, flexShrink: 0 }}>
                        {p.situacao.length > 42 ? p.situacao.slice(0, 42) + '…' : p.situacao}
                      </span>
                    )}
                  </div>

                  <p style={{ margin: '0 0 10px', fontSize: 14.5, color: 'var(--ink)', lineHeight: 1.55, fontWeight: 500 }}>
                    {texto}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    {p.data_apresentacao && (
                      <span className="mono" style={{ fontSize: 10, color: 'var(--ink-3)' }}>
                        Apresentado em {new Date(p.data_apresentacao).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                    {href && (
                      <Link href={href} style={{ fontSize: 12, color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none' }}>
                        Ver tramitação →
                      </Link>
                    )}
                  </div>
                </article>
              )
            })}
          </div>
        )}

        {/* ── Paginação ── */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 32, flexWrap: 'wrap' }}>
            {pagina > 1 && (
              <Link href={`/projetos?${tipo ? `tipo=${tipo}&` : ''}pagina=${pagina - 1}`}
                style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, textDecoration: 'none', color: 'var(--ink-2)', background: 'var(--panel)' }}>
                ← Anterior
              </Link>
            )}
            <span style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', fontSize: 13, color: 'var(--ink-3)' }}>
              {pagina} / {totalPaginas}
            </span>
            {pagina < totalPaginas && (
              <Link href={`/projetos?${tipo ? `tipo=${tipo}&` : ''}pagina=${pagina + 1}`}
                style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, textDecoration: 'none', color: 'var(--ink-2)', background: 'var(--panel)' }}>
                Próxima →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
