import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Pool } from 'pg'

type PageProps = {
  params: Promise<{ slug: string }>
}

// ── Postgres direto ───────────────────────────────────────────────────────────
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
type ProposicaoPg = {
  id: string
  slug: string
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

type AutorPg = {
  id: string
  nome: string
  politico_id: string | null
  pol_nome_eleitoral: string | null
  pol_slug: string | null
  pol_foto_url: string | null
  pol_cargo: string | null
  pol_uf: string | null
  partido_sigla: string | null
}

type VotacaoPartidoPg = {
  sigla: string | null
  sim: string
  nao: string
  abstencao: string
  total: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  PL:  'Projeto de Lei',
  PEC: 'Proposta de Emenda a Constituicao',
  PLP: 'Projeto de Lei Complementar',
  PDL: 'Projeto de Decreto Legislativo',
  MPV: 'Medida Provisoria',
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal:  'Dep. Federal',
  senador:           'Senador(a)',
  governador:        'Governador(a)',
  deputado_estadual: 'Dep. Estadual',
}

type SituacaoInfo = { bg: string; color: string; label: string; dot: string }

function situacaoInfo(s: string | null): SituacaoInfo {
  const TRAMITANDO: SituacaoInfo = { bg: 'var(--warn-soft)', color: 'var(--warn)', label: 'Em tramitacao', dot: 'var(--accent-gold)' }
  if (!s) return TRAMITANDO
  const lower = s.toLowerCase()
  if (lower.includes('tramit') || lower.includes('andamento')) return TRAMITANDO
  if (lower.includes('aprovad') || lower.includes('sancionad') || lower.includes('promulgad'))
    return { bg: 'var(--pos-soft)', color: 'var(--pos)', label: 'Aprovada', dot: 'var(--pos)' }
  if (lower.includes('arquivad') || lower.includes('retirad') || lower.includes('prejudicad'))
    return { bg: 'var(--bg-2)', color: 'var(--ink-3)', label: 'Arquivada', dot: 'var(--ink-3)' }
  if (lower.includes('vetad') || lower.includes('rejeitad'))
    return { bg: 'var(--neg-soft)', color: 'var(--neg)', label: 'Vetada', dot: 'var(--neg)' }
  return TRAMITANDO
}

// ── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const { rows } = await getPool().query<Pick<ProposicaoPg, 'tipo' | 'numero' | 'ano' | 'ementa'>>(
    `SELECT tipo, numero, ano, ementa FROM proposicoes WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  if (!rows[0]) return { title: 'Projeto nao encontrado' }
  const { tipo, numero, ano, ementa } = rows[0]
  const titulo = `${tipo} ${numero}/${ano}`
  return {
    title: `${titulo} - Meus Politicos`,
    description: ementa?.slice(0, 160) ?? `Detalhes do ${TIPO_LABEL[tipo] ?? tipo}`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ProjetoDetalhe({ params }: PageProps) {
  const { slug } = await params
  const pool = getPool()

  const [propResult, autoresResult] = await Promise.all([
    pool.query<ProposicaoPg>(
      `SELECT id, slug, tipo, numero, ano, ementa, ementa_simples, situacao,
              casa_origem, data_apresentacao, link_camara, link_senado
       FROM proposicoes WHERE slug = $1 LIMIT 1`,
      [slug]
    ),
    pool.query<AutorPg>(
      `SELECT pa.id, pa.nome, pa.politico_id,
              p.nome_eleitoral  AS pol_nome_eleitoral,
              p.slug            AS pol_slug,
              p.foto_url        AS pol_foto_url,
              p.cargo           AS pol_cargo,
              p.uf              AS pol_uf,
              pt.sigla          AS partido_sigla
       FROM proposicao_autores pa
       LEFT JOIN politicos p  ON p.id  = pa.politico_id
       LEFT JOIN partidos  pt ON pt.id = p.partido_id
       WHERE pa.proposicao_id = (SELECT id FROM proposicoes WHERE slug = $1 LIMIT 1)
       LIMIT 10`,
      [slug]
    ),
  ])

  const proposicao = propResult.rows[0]
  if (!proposicao) notFound()

  const autores = autoresResult.rows

  const propRef = `${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}`
  const votacoesResult = await pool.query<VotacaoPartidoPg>(
    `SELECT pt.sigla,
            COUNT(*) FILTER (WHERE v.voto = 'sim')        AS sim,
            COUNT(*) FILTER (WHERE v.voto = 'nao')        AS nao,
            COUNT(*) FILTER (WHERE v.voto = 'abstencao')  AS abstencao,
            COUNT(*)                                        AS total
     FROM votacoes v
     JOIN politicos pol ON pol.id = v.politico_id
     LEFT JOIN partidos pt ON pt.id = pol.partido_id
     WHERE v.proposicao = $1
     GROUP BY pt.sigla
     ORDER BY COUNT(*) DESC
     LIMIT 20`,
    [propRef]
  )
  const votacoesPartido = votacoesResult.rows

  const sit = situacaoInfo(proposicao.situacao)
  const tipoLabel = TIPO_LABEL[proposicao.tipo] ?? proposicao.tipo
  const tituloCompleto = `${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}`
  const casaLabel =
    proposicao.casa_origem === 'camara' ? 'Camara dos Deputados' :
    proposicao.casa_origem === 'senado' ? 'Senado Federal' : null
  const dataApresentacao = proposicao.data_apresentacao
    ? new Date(proposicao.data_apresentacao).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : null

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)',
        borderBottom: '1px solid var(--line-soft)',
        padding: '40px 24px 32px',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
            <Link href="/" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>Inicio</Link>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/</span>
            <Link href="/projetos" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>Projetos de Lei</Link>
            <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/</span>
            <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{tituloCompleto}</span>
          </div>

          {/* Grid 2fr/1fr */}
          <div className="projeto-hero-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(260px,1fr)', gap: 24, alignItems: 'start' }}>

            {/* Esquerda */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <span className="mono" style={{
                  fontSize: 11, padding: '3px 10px',
                  background: 'var(--brand-soft)', color: 'var(--brand)',
                  letterSpacing: '0.08em', fontWeight: 700,
                }}>
                  {tipoLabel.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500 }}>{tituloCompleto}</span>
              </div>

              <h1 style={{
                margin: '0 0 20px',
                fontSize: 'clamp(20px, 3vw, 30px)',
                lineHeight: 1.25,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
                fontWeight: 700,
              }}>
                {proposicao.ementa ?? tituloCompleto}
              </h1>

              {/* AI box */}
              <div style={{
                background: 'var(--panel)',
                border: '1px solid var(--line)',
                borderLeft: '4px solid var(--brand-2)',
                borderRadius: '0 8px 8px 0',
                padding: '18px 20px',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: 16 }}>&#129504;</span>
                  <span className="label" style={{ color: 'var(--brand-2)' }}>INTELIGENCIA CIVICA</span>
                </div>
                <p style={{ margin: '0 0 16px', fontSize: 15, lineHeight: 1.7, color: 'var(--ink)', fontWeight: 500 }}>
                  {proposicao.ementa_simples ?? proposicao.ementa ?? 'Descricao nao disponivel.'}
                </p>
                <div style={{ borderTop: '1px solid var(--line-soft)', paddingTop: 12 }}>
                  <Link
                    href="/glossario"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      fontSize: 13, color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none',
                    }}
                  >
                    Tem duvidas? Consulte o Glossario Politico
                  </Link>
                </div>
              </div>
            </div>

            {/* Direita - status card */}
            <div style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}>
              <div>
                <div className="label" style={{ color: 'var(--ink-3)', marginBottom: 12 }}>STATUS ATUAL</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{
                    width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
                    background: sit.dot,
                    boxShadow: `0 0 0 3px ${sit.bg}`,
                  }} />
                  <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.2 }}>
                    {sit.label}
                  </span>
                </div>
                {proposicao.situacao && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    {proposicao.situacao.length > 120 ? proposicao.situacao.slice(0, 120) + '...' : proposicao.situacao}
                  </p>
                )}
                {dataApresentacao && (
                  <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--mute)' }}>
                    Apresentado em {dataApresentacao}{casaLabel ? ` - ${casaLabel}` : ''}
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {/* Seguir Projeto - stub ate acompanhamentos_proposicoes existir */}
                <Link
                  href="/login"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 16px', background: 'var(--brand)', color: '#fff',
                    borderRadius: 7, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                  }}
                >
                  Seguir Projeto
                </Link>
                {(proposicao.link_camara ?? proposicao.link_senado) ? (
                  <a
                    href={(proposicao.link_camara ?? proposicao.link_senado)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '10px 16px', background: 'var(--bg-2)', color: 'var(--ink-2)',
                      borderRadius: 7, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      border: '1px solid var(--line)',
                    }}
                  >
                    Ver Documento Original
                  </a>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Conteudo principal */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px 80px' }}>
        <div className="projeto-content-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(260px,1fr)', gap: 24, alignItems: 'start' }}>

          {/* Coluna principal */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Timeline */}
            <section style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '24px 24px 20px',
            }}>
              <h2 style={{ margin: '0 0 24px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>
                Tramitacao do Projeto
              </h2>
              <div style={{ position: 'relative', paddingLeft: 40 }}>
                <div style={{ position: 'absolute', left: 16, top: 0, bottom: 0, width: 2, background: 'var(--line)' }} />

                {dataApresentacao && (
                  <TimelineItem
                    data={dataApresentacao}
                    titulo="Apresentacao do Projeto"
                    descricao={`Leitura em plenario${casaLabel ? ` da ${casaLabel}` : ''} e distribuicao as comissoes tecnicas.`}
                    status="done"
                  />
                )}

                <TimelineItem
                  data="EM ANDAMENTO"
                  titulo={sit.label}
                  descricao={proposicao.situacao ?? 'Situacao atual do projeto.'}
                  status="current"
                  dotColor={sit.dot}
                />
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>
                Historico completo de despachos disponivel em breve.
              </p>
            </section>

            {/* Votacoes por partido */}
            {votacoesPartido.length > 0 && (
              <VotacoesTable rows={votacoesPartido} tituloCompleto={tituloCompleto} />
            )}
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {autores.length > 0 && (
              <section style={{ background: 'var(--brand)', borderRadius: 10, padding: '20px' }}>
                <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, color: '#fff' }}>
                  {autores.length === 1 ? 'Autoria' : `Autoria (${autores.length})`}
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {autores.map((a) => {
                    const nome = a.pol_nome_eleitoral ?? a.nome
                    const href = a.pol_slug ? `/politicos/${a.pol_slug}` : null
                    const cargo = a.pol_cargo ? (CARGO_LABEL[a.pol_cargo] ?? a.pol_cargo) : null
                    const info = [a.partido_sigla, a.pol_uf].filter(Boolean).join(' - ')

                    const inner = (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 8px', borderRadius: 8 }}>
                        {a.pol_foto_url ? (
                          <Image
                            src={a.pol_foto_url}
                            alt={nome}
                            width={56}
                            height={56}
                            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.4)' }}
                          />
                        ) : (
                          <div style={{
                            width: 56, height: 56, borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(255,255,255,0.15)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 20, fontWeight: 800, color: '#fff',
                          }}>
                            {nome.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{nome}</div>
                          {(cargo ?? info) && (
                            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.72)' }}>
                              {[cargo, info].filter(Boolean).join(' - ')}
                            </div>
                          )}
                        </div>
                      </div>
                    )

                    return href ? (
                      <Link key={a.id} href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
                    ) : (
                      <div key={a.id}>{inner}</div>
                    )
                  })}
                </div>
              </section>
            )}

            <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, padding: '18px 20px' }}>
              <div className="label" style={{ marginBottom: 12, color: 'var(--ink-3)' }}>DOCUMENTOS OFICIAIS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {proposicao.link_camara && (
                  <DocLink href={proposicao.link_camara} icon="edificio" label="Ver na Camara dos Deputados" />
                )}
                {proposicao.link_senado && (
                  <DocLink href={proposicao.link_senado} icon="balanca" label="Ver no Senado Federal" />
                )}
                {!proposicao.link_camara && !proposicao.link_senado && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--mute)' }}>Sem links disponiveis.</p>
                )}
              </div>
            </section>

            <Link
              href="/projetos"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none', fontWeight: 500 }}
            >
              Todos os projetos
            </Link>
          </aside>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 860px) {
          .projeto-hero-grid, .projeto-content-grid { grid-template-columns: 1fr !important; }
        }
      ` }} />
    </div>
  )
}

// Sub-componentes

function TimelineItem({ data, titulo, descricao, status, dotColor }: {
  data: string
  titulo: string
  descricao: string
  status: 'done' | 'current'
  dotColor?: string
}) {
  const bg = status === 'done' ? 'var(--brand-2)' : (dotColor ?? 'var(--accent-gold)')
  return (
    <div style={{ position: 'relative', marginBottom: 28 }}>
      <div style={{
        position: 'absolute', left: -32, top: 4,
        width: 20, height: 20, borderRadius: '50%',
        background: bg, border: '3px solid var(--panel)',
        boxShadow: '0 0 0 2px var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 9, color: '#fff', fontWeight: 900 }}>
          {status === 'done' ? 'v' : 'o'}
        </span>
      </div>
      <span className="label" style={{ display: 'block', marginBottom: 4, color: status === 'current' ? bg : 'var(--ink-3)' }}>
        {data}
      </span>
      <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{titulo}</h4>
      <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>{descricao}</p>
    </div>
  )
}

function VotacoesTable({ rows, tituloCompleto }: { rows: VotacaoPartidoPg[]; tituloCompleto: string }) {
  const totalSim = rows.reduce((s, r) => s + Number(r.sim), 0)
  const totalNao = rows.reduce((s, r) => s + Number(r.nao), 0)
  const totalAbs = rows.reduce((s, r) => s + Number(r.abstencao), 0)
  return (
    <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
      <div style={{
        background: 'var(--bg-2)', borderBottom: '1px solid var(--line)',
        padding: '16px 24px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 12,
      }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Historico de Votacao</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>{tituloCompleto}</p>
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[
            { label: 'SIM', value: totalSim, color: '#10B981' },
            { label: 'NAO', value: totalNao, color: '#EF4444' },
            { label: 'ABS', value: totalAbs, color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 28, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
              <span className="label" style={{ color: 'var(--ink-3)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr>
              {['Partido', 'Sim', 'Nao', 'Abs', 'Engajamento'].map(h => (
                <th key={h} className="label" style={{
                  padding: '10px 20px',
                  textAlign: h === 'Partido' ? 'left' : 'center',
                  color: 'var(--ink-3)',
                  borderBottom: '1px solid var(--line)',
                  background: 'rgba(0,0,0,0.02)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tot = Number(row.total)
              const pct = tot > 0 ? Math.round((Number(row.sim) / tot) * 100) : 0
              return (
                <tr key={row.sigla ?? 'sem-partido'} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                  <td style={{ padding: '12px 20px', fontWeight: 700, color: 'var(--ink)' }}>{row.sigla ?? 'Sem partido'}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'center', color: '#10B981', fontWeight: 600 }}>{row.sim}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'center', color: '#EF4444', fontWeight: 600 }}>{row.nao}</td>
                  <td style={{ padding: '12px 20px', textAlign: 'center', color: '#F59E0B', fontWeight: 600 }}>{row.abstencao}</td>
                  <td style={{ padding: '12px 20px' }}>
                    <div style={{ background: 'var(--line)', height: 6, borderRadius: 3, overflow: 'hidden', minWidth: 80 }}>
                      <div style={{ background: 'var(--brand-2)', height: '100%', width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}

function DocLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  void icon
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px', borderRadius: 7,
        fontSize: 13, color: 'var(--brand-2)', fontWeight: 500,
        textDecoration: 'none',
      }}
    >
      {label} &rarr;
    </a>
  )
}
