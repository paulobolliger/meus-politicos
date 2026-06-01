import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Pool } from 'pg'

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
  source_id: string | null
  source_record_id: string | null
  collected_at: string | null
}

type AutorPgRow = {
  id: string
  nome: string
  politico_id: string | null
  nome_eleitoral: string | null
  slug: string | null
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partido_sigla: string | null
}

let _pool: Pool | null = null

function getPool(): Pool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }
  return _pool
}

const TIPO_FULL: Record<string, string> = {
  PL:  'Projeto de Lei',
  PEC: 'Proposta de Emenda à Constituição',
  PLP: 'Projeto de Lei Complementar',
  PDL: 'Projeto de Decreto Legislativo',
  MPV: 'Medida Provisória',
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal:  'Dep. Federal',
  senador:           'Senador(a)',
  governador:        'Governador(a)',
  deputado_estadual: 'Dep. Estadual',
}

const SITUACAO_COLOR: Record<string, { bg: string; color: string }> = {
  tramitando: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6' },
  aprovada:   { bg: 'rgba(34,197,94,0.12)',   color: '#22c55e' },
  arquivada:  { bg: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.35)' },
  vetada:     { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444' },
}
function getSit(s: string | null) {
  if (!s) return SITUACAO_COLOR.arquivada
  const l = s.toLowerCase()
  if (l.includes('tramit') || l.includes('andamento')) return SITUACAO_COLOR.tramitando
  if (l.includes('aprovad') || l.includes('sancionad')) return SITUACAO_COLOR.aprovada
  if (l.includes('arquivad') || l.includes('retirad'))  return SITUACAO_COLOR.arquivada
  if (l.includes('vetad'))                               return SITUACAO_COLOR.vetada
  return SITUACAO_COLOR.arquivada
}

function fmtDate(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const pool = getPool()
  const result = await pool.query<Pick<Proposicao, 'tipo' | 'numero' | 'ano'>>(
    'SELECT tipo, numero, ano FROM proposicoes WHERE slug = $1 LIMIT 1',
    [slug]
  )
  const data = result.rows[0] ?? null

  if (!data) return { title: 'Proposição não encontrada' }
  return { title: `${data.tipo} ${data.numero}/${data.ano} · Análise | Meus Políticos` }
}

export default async function AppProjetoDetalhe({ params }: PageProps) {
  const { slug } = await params
  const pool = getPool()
  const proposicaoResult = await pool.query<Proposicao>(
    `
      SELECT
        id,
        slug,
        tipo,
        numero,
        ano,
        ementa,
        ementa_simples,
        situacao,
        casa_origem,
        data_apresentacao::text AS data_apresentacao,
        link_camara,
        link_senado,
        source_id,
        source_record_id,
        collected_at::text AS collected_at
      FROM proposicoes
      WHERE slug = $1
      LIMIT 1
    `,
    [slug]
  )
  const p = proposicaoResult.rows[0] ?? null

  if (!p) notFound()

  const autoresResult = await pool.query<AutorPgRow>(
    `
      SELECT
        pa.id,
        pa.nome,
        pa.politico_id,
        pol.nome_eleitoral,
        pol.slug,
        pol.foto_url,
        pol.cargo::text AS cargo,
        pol.uf,
        pt.sigla AS partido_sigla
      FROM proposicao_autores pa
      LEFT JOIN politicos pol ON pol.id = pa.politico_id
      LEFT JOIN partidos pt ON pt.id = pol.partido_id
      WHERE pa.proposicao_id = $1
      ORDER BY pa.nome ASC NULLS LAST
    `,
    [p.id]
  )

  const autores: Autor[] = autoresResult.rows.map((a) => ({
    id: a.id,
    nome: a.nome,
    politico_id: a.politico_id,
    politico: a.politico_id
      ? {
          nome_eleitoral: a.nome_eleitoral ?? a.nome,
          slug: a.slug,
          foto_url: a.foto_url,
          cargo: a.cargo,
          uf: a.uf,
          partido: a.partido_sigla ? { sigla: a.partido_sigla } : null,
        }
      : null,
  }))
  const sit = getSit(p.situacao)
  const tipoLabel = TIPO_FULL[p.tipo] ?? p.tipo

  const metaStyle: React.CSSProperties = {
    fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
  }
  const metaLabel: React.CSSProperties = {
    fontWeight: 600, color: 'var(--ink-2)', fontSize: 11, letterSpacing: '0.05em',
  }

  return (
    <div style={{ padding: '24px 28px 64px', maxWidth: 960 }}>
      {/* ── Breadcrumb ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 18, flexWrap: 'wrap' }}>
        <Link href="/proposicoes" style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}>Projetos de Lei</Link>
        <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>/</span>
        <span className="mono" style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600 }}>{p.tipo} {p.numero}/{p.ano}</span>
      </div>

      {/* ── Header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
          <span className="mono" style={{
            fontSize: 10, padding: '3px 8px', borderRadius: 4,
            background: 'var(--bg-2)', color: 'var(--ink-2)',
            letterSpacing: '0.08em', fontWeight: 700,
          }}>
            {p.tipo}
          </span>
          <span style={{
            fontSize: 10, padding: '3px 10px', borderRadius: 999,
            background: sit.bg, color: sit.color, fontWeight: 600,
          }}>
            {p.situacao ? (p.situacao.length > 60 ? p.situacao.slice(0, 60) + '…' : p.situacao) : 'Sem situação'}
          </span>
        </div>
        <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, letterSpacing: '-0.025em', color: 'var(--ink)' }}>
          {tipoLabel} nº {p.numero}/{p.ano}
        </h1>
        <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>
          {p.casa_origem === 'camara' ? 'Câmara dos Deputados' : p.casa_origem === 'senado' ? 'Senado Federal' : 'Congresso Nacional'}
          {p.data_apresentacao && <> · Apresentado em {fmtDate(p.data_apresentacao)}</>}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        {/* ── Coluna principal ── */}
        <div style={{ flex: '1 1 520px', minWidth: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Ementa técnica */}
          <section style={{
            background: 'var(--panel)', borderRadius: 8,
            padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <div className="label" style={{ marginBottom: 10 }}>EMENTA TÉCNICA</div>
            <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink)' }}>
              {p.ementa ?? '—'}
            </p>
          </section>

          {/* Ementa simplificada (se disponível) */}
          {p.ementa_simples && (
            <section style={{
              background: 'var(--panel)', borderRadius: 8,
              padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
              borderLeft: '3px solid var(--brand-2)',
            }}>
              <div className="label" style={{ marginBottom: 10, color: 'var(--brand-2)' }}>RESUMO SIMPLIFICADO</div>
              <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.65, color: 'var(--ink-2)' }}>
                {p.ementa_simples}
              </p>
            </section>
          )}

          {/* Metadados técnicos */}
          <section style={{
            background: 'var(--panel)', borderRadius: 8,
            padding: '14px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <div className="label" style={{ marginBottom: 12 }}>METADADOS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '10px 24px' }}>
              <div>
                <div style={metaLabel}>TIPO</div>
                <div style={metaStyle}>{tipoLabel}</div>
              </div>
              <div>
                <div style={metaLabel}>NÚMERO</div>
                <div style={metaStyle}>{p.numero}/{p.ano}</div>
              </div>
              <div>
                <div style={metaLabel}>CASA ORIGEM</div>
                <div style={metaStyle}>{p.casa_origem ?? '—'}</div>
              </div>
              <div>
                <div style={metaLabel}>APRESENTAÇÃO</div>
                <div style={metaStyle}>{fmtDate(p.data_apresentacao)}</div>
              </div>
              <div>
                <div style={metaLabel}>FONTE</div>
                <div style={metaStyle}>{p.source_id ?? '—'}</div>
              </div>
              <div>
                <div style={metaLabel}>COLETADO EM</div>
                <div style={metaStyle}>{fmtDate(p.collected_at)}</div>
              </div>
            </div>
          </section>
        </div>

        {/* ── Sidebar ── */}
        <aside style={{ flex: '0 0 240px', minWidth: 220, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Autores */}
          <section style={{
            background: 'var(--panel)', borderRadius: 8,
            padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <div className="label" style={{ marginBottom: 12 }}>
              {autores.length === 1 ? 'AUTOR' : `AUTORES (${autores.length})`}
            </div>

            {autores.length === 0 ? (
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>Nenhum autor registrado</p>
            ) : (
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
                          width={34}
                          height={34}
                          style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                      ) : (
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%',
                          background: 'var(--bg-2)', display: 'flex',
                          alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, color: 'var(--ink-3)',
                          flexShrink: 0,
                        }}>
                          {nome.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div style={{ minWidth: 0 }}>
                        <div style={{
                          fontSize: 12.5, fontWeight: 600,
                          color: href ? 'var(--brand-2)' : 'var(--ink)',
                          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        }}>
                          {nome}
                        </div>
                        {(cargo || sigla || uf) && (
                          <div style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 1, fontFamily: 'var(--font-mono)' }}>
                            {[sigla, cargo, uf].filter(Boolean).join(' · ')}
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
            )}
          </section>

          {/* Links */}
          <section style={{
            background: 'var(--panel)', borderRadius: 8,
            padding: '14px 16px', boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
          }}>
            <div className="label" style={{ marginBottom: 12 }}>FONTES OFICIAIS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {p.link_camara && (
                <a href={p.link_camara} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)',
                    background: 'var(--bg-2)', textDecoration: 'none',
                    fontSize: 12, color: 'var(--ink-2)', fontWeight: 500,
                  }}>
                  <span>🏛️</span> Câmara ↗
                </a>
              )}
              {p.link_senado && (
                <a href={p.link_senado} target="_blank" rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 10px', borderRadius: 6, border: '1px solid var(--line)',
                    background: 'var(--bg-2)', textDecoration: 'none',
                    fontSize: 12, color: 'var(--ink-2)', fontWeight: 500,
                  }}>
                  <span>⚖️</span> Senado ↗
                </a>
              )}
              {!p.link_camara && !p.link_senado && (
                <p style={{ margin: 0, fontSize: 12, color: 'var(--mute)' }}>Nenhum link disponível</p>
              )}
            </div>
          </section>

          {/* ID interno */}
          <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', lineHeight: 1.5 }}>
            ID: {p.id}<br />
            {p.source_record_id && <>Fonte: #{p.source_record_id}</>}
          </div>
        </aside>
      </div>
    </div>
  )
}
