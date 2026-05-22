import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'

type PageProps = {
  params: Promise<{ slug: string }>
}

type Autor = {
  id: string
  nome: string
  politico_id: string | null
  politico: {
    nome_eleitoral: string
    slug: string | null
    foto_url: string | null
    cargo: string | null
    uf: string | null
    partido: { sigla: string } | null
  } | null
}

type Proposicao = {
  id: string
  slug: string | null
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  ementa_simples: string | null
  situacao: string | null
  casa_origem: string | null
  data_apresentacao: string | null
  link_camara: string | null
  link_senado: string | null
}

const TIPO_LABEL: Record<string, string> = {
  PL:  'Projeto de Lei',
  PEC: 'Proposta de Emenda à Constituição',
  PLP: 'Projeto de Lei Complementar',
  PDL: 'Projeto de Decreto Legislativo',
  MPV: 'Medida Provisória',
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Dep. Federal',
  senador:          'Senador(a)',
  governador:       'Governador(a)',
  deputado_estadual:'Dep. Estadual',
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

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data } = await (supabase as any)
    .from('proposicoes')
    .select('tipo, numero, ano, ementa')
    .eq('slug', slug)
    .maybeSingle()

  if (!data) return { title: 'Projeto não encontrado' }
  const titulo = `${data.tipo} ${data.numero}/${data.ano}`
  return {
    title: `${titulo} · Meus Políticos`,
    description: data.ementa?.slice(0, 160) ?? `Detalhes do ${TIPO_LABEL[data.tipo] ?? data.tipo}`,
  }
}

export default async function ProjetoDetalhe({ params }: PageProps) {
  const { slug } = await params
  const supabase = await createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: proposicao } = await (supabase as any)
    .from('proposicoes')
    .select('id, slug, tipo, numero, ano, ementa, ementa_simples, situacao, casa_origem, data_apresentacao, link_camara, link_senado')
    .eq('slug', slug)
    .maybeSingle() as { data: Proposicao | null }

  if (!proposicao) notFound()

  // Buscar autores com join em politicos + partidos
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: autoresRaw } = await (supabase as any)
    .from('proposicao_autores')
    .select('id, nome, politico_id, politico:politicos(nome_eleitoral, slug, foto_url, cargo, uf, partido:partidos(sigla))')
    .eq('proposicao_id', proposicao.id)
    .limit(10) as { data: Autor[] | null }

  const autores = autoresRaw ?? []
  const sit = situacaoStyle(proposicao.situacao)
  const tipoLabel = TIPO_LABEL[proposicao.tipo] ?? proposicao.tipo
  const tituloCompleto = `${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}`
  const textoPublico = proposicao.ementa_simples || proposicao.ementa || 'Sem descrição disponível.'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Breadcrumb + hero ── */}
      <section style={{
        background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)',
        borderBottom: '1px solid var(--line-soft)',
        padding: '36px 24px 28px',
      }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
            <Link href="/" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>Início</Link>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/</span>
            <Link href="/projetos" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>Projetos de Lei</Link>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/</span>
            <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{tituloCompleto}</span>
          </div>

          {/* Tipo badge + título */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
            <span className="mono" style={{
              fontSize: 11, padding: '3px 10px', borderRadius: 5,
              background: 'var(--bg-2)', color: 'var(--ink-2)',
              letterSpacing: '0.08em', fontWeight: 700, flexShrink: 0,
            }}>
              {proposicao.tipo}
            </span>
            {proposicao.situacao && (
              <span style={{
                fontSize: 11, padding: '3px 10px', borderRadius: 999,
                background: sit.bg, color: sit.color, fontWeight: 600, flexShrink: 0,
              }}>
                {proposicao.situacao.length > 50 ? proposicao.situacao.slice(0, 50) + '…' : proposicao.situacao}
              </span>
            )}
          </div>

          <h1 style={{ margin: '0 0 6px', fontSize: 'clamp(22px, 4vw, 34px)', lineHeight: 1.15, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
            {tituloCompleto}
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
            {tipoLabel}
            {proposicao.data_apresentacao && (
              <> · apresentado em {new Date(proposicao.data_apresentacao).toLocaleDateString('pt-BR')}</>
            )}
            {proposicao.casa_origem && (
              <> · <span style={{ textTransform: 'capitalize' }}>{proposicao.casa_origem === 'camara' ? 'Câmara dos Deputados' : 'Senado Federal'}</span></>
            )}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 800, margin: '0 auto', padding: '28px 24px 72px' }}>
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {/* ── Coluna principal ── */}
          <div style={{ flex: '1 1 480px', minWidth: 0 }}>

            {/* Ementa simplificada */}
            {proposicao.ementa_simples && (
              <section style={{
                background: 'var(--panel)',
                borderRadius: 10,
                padding: '18px 20px',
                marginBottom: 14,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                borderLeft: '3px solid var(--brand-2)',
              }}>
                <div className="label" style={{ marginBottom: 8, color: 'var(--brand-2)' }}>EM LINGUAGEM SIMPLES</div>
                <p style={{ margin: 0, fontSize: 15, lineHeight: 1.65, color: 'var(--ink)', fontWeight: 500 }}>
                  {proposicao.ementa_simples}
                </p>
              </section>
            )}

            {/* Ementa técnica */}
            <section style={{
              background: 'var(--panel)',
              borderRadius: 10,
              padding: '18px 20px',
              marginBottom: 14,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div className="label" style={{ marginBottom: 8 }}>
                {proposicao.ementa_simples ? 'EMENTA TÉCNICA' : 'EMENTA'}
              </div>
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.65, color: proposicao.ementa_simples ? 'var(--ink-3)' : 'var(--ink)' }}>
                {proposicao.ementa ?? 'Não disponível.'}
              </p>
            </section>

            {/* Glossário CTA */}
            <div style={{
              background: 'var(--bg-2)',
              borderRadius: 8,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 14,
            }}>
              <span style={{ fontSize: 18 }}>❓</span>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                Quer entender mais? Veja nosso{' '}
                <Link href="/glossario" style={{ color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none' }}>
                  Glossário Político
                </Link>{' '}
                com termos explicados em linguagem simples.
              </p>
            </div>
          </div>

          {/* ── Sidebar ── */}
          <aside style={{ flex: '0 0 220px', minWidth: 200 }}>

            {/* Autores */}
            {autores.length > 0 && (
              <section style={{
                background: 'var(--panel)',
                borderRadius: 10,
                padding: '16px 16px',
                marginBottom: 12,
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              }}>
                <div className="label" style={{ marginBottom: 12 }}>
                  {autores.length === 1 ? 'AUTOR' : `AUTORES (${autores.length})`}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {autores.map((a) => {
                    const pol = a.politico
                    const href = pol?.slug ? `/politicos/${pol.slug}` : null
                    const nome = pol?.nome_eleitoral ?? a.nome
                    const cargo = pol?.cargo ? CARGO_LABEL[pol.cargo] ?? pol.cargo : null
                    const sigla = pol?.partido?.sigla ?? null
                    const uf = pol?.uf ?? null

                    const inner = (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {pol?.foto_url ? (
                          <Image
                            src={pol.foto_url}
                            alt={nome}
                            width={36}
                            height={36}
                            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{
                            width: 36, height: 36, borderRadius: '50%',
                            background: 'var(--bg-2)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: 'var(--ink-3)',
                            flexShrink: 0,
                          }}>
                            {nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontSize: 13, fontWeight: 600, color: href ? 'var(--brand-2)' : 'var(--ink)',
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                          }}>
                            {nome}
                          </div>
                          {(cargo || sigla || uf) && (
                            <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 1 }}>
                              {[cargo, sigla, uf].filter(Boolean).join(' · ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )

                    return href ? (
                      <Link key={a.id} href={href} style={{ textDecoration: 'none' }}>
                        {inner}
                      </Link>
                    ) : (
                      <div key={a.id}>{inner}</div>
                    )
                  })}
                </div>
              </section>
            )}

            {/* Links externos */}
            <section style={{
              background: 'var(--panel)',
              borderRadius: 10,
              padding: '16px 16px',
              marginBottom: 12,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            }}>
              <div className="label" style={{ marginBottom: 12 }}>FONTES OFICIAIS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {proposicao.link_camara && (
                  <a
                    href={proposicao.link_camara}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 7, border: '1px solid var(--line)',
                      background: 'var(--bg)', textDecoration: 'none',
                      fontSize: 13, color: 'var(--ink-2)', fontWeight: 500,
                      transition: 'background 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 16 }}>🏛️</span>
                    <span>Câmara dos Deputados ↗</span>
                  </a>
                )}
                {proposicao.link_senado && (
                  <a
                    href={proposicao.link_senado}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 12px', borderRadius: 7, border: '1px solid var(--line)',
                      background: 'var(--bg)', textDecoration: 'none',
                      fontSize: 13, color: 'var(--ink-2)', fontWeight: 500,
                    }}
                  >
                    <span style={{ fontSize: 16 }}>⚖️</span>
                    <span>Senado Federal ↗</span>
                  </a>
                )}
                {!proposicao.link_camara && !proposicao.link_senado && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--mute)' }}>
                    Nenhum link disponível
                  </p>
                )}
              </div>
            </section>

            {/* Voltar */}
            <Link
              href="/projetos"
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none', fontWeight: 500,
              }}
            >
              ← Todos os projetos
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
