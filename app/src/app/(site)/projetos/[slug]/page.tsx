import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPgPool } from '@/lib/db/pool'
import { IAPerguntaProjeto } from '@/components/projetos/IAPerguntaProjeto'
import { TabelaVotosIndividuais } from '@/components/projetos/TabelaVotosIndividuais'
import { GlossaryHighlighter } from '@/components/glossario/GlossaryHighlighter'

type PageProps = {
  params: Promise<{ slug: string }>
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
  titulo_simplificado: string | null
  frases_chave: string[] | null
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

type TramitacaoPg = {
  sequencia: number
  data_hora: string | null
  sigla_orgao: string | null
  descricao_tramitacao: string | null
  descricao_situacao: string | null
  despacho: string | null
  url_documento: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TIPO_LABEL: Record<string, string> = {
  PL:  'Projeto de Lei',
  PEC: 'Proposta de Emenda à Constituição',
  PLP: 'Projeto de Lei Complementar',
  PDL: 'Projeto de Decreto Legislativo',
  MPV: 'Medida Provisória',
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
  const { rows } = await getPgPool().query<Pick<ProposicaoPg, 'tipo' | 'numero' | 'ano' | 'ementa'>>(
    `SELECT tipo, numero, ano, ementa FROM proposicoes WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  if (!rows[0]) return { title: 'Projeto não encontrado' }
  const { tipo, numero, ano, ementa } = rows[0]
  const titulo = `${tipo} ${numero}/${ano}`
  return {
    title: `${titulo} - Meus Políticos`,
    description: ementa?.slice(0, 160) ?? `Detalhes do ${TIPO_LABEL[tipo] ?? tipo}`,
  }
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function ProjetoDetalhe({ params }: PageProps) {
  const { slug } = await params
  const pool = getPgPool()

  const [propResult, autoresResult, tramitacoesResult] = await Promise.all([
    pool.query<ProposicaoPg>(
      `SELECT id, slug, tipo, numero, ano, ementa, ementa_simples,
              titulo_simplificado, frases_chave,
              situacao, casa_origem, data_apresentacao, link_camara, link_senado
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
    pool.query<TramitacaoPg>(
      `SELECT t.sequencia, t.data_hora, t.sigla_orgao,
              t.descricao_tramitacao, t.descricao_situacao,
              t.despacho, t.url_documento
       FROM proposicao_tramitacoes t
       JOIN proposicoes p ON p.id_camara = t.id_camara
       WHERE p.slug = $1
       ORDER BY t.sequencia ASC`,
      [slug]
    ),
  ])

  const proposicao = propResult.rows[0]
  if (!proposicao) notFound()

  const autores       = autoresResult.rows
  const tramitacoes   = tramitacoesResult.rows

  const propRef = `${proposicao.tipo} ${proposicao.numero}/${proposicao.ano}`

  // Pega a sessão de votação mais recente (maior data + maior proposicao_id)
  // para não somar múltiplas rodadas do mesmo PL
  const ultimaSessaoResult = await pool.query<{ proposicao_id: string; data: string }>(
    `SELECT proposicao_id, data
     FROM votacoes
     WHERE proposicao = $1
     GROUP BY proposicao_id, data
     ORDER BY data DESC, proposicao_id DESC
     LIMIT 1`,
    [propRef]
  )
  const ultimaSessao = ultimaSessaoResult.rows[0]

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
       AND v.proposicao_id = $2
     GROUP BY pt.sigla
     ORDER BY COUNT(*) DESC
     LIMIT 20`,
    [propRef, ultimaSessao?.proposicao_id ?? '']
  )
  const votacoesPartido = votacoesResult.rows

  const votosIndividuaisResult = await pool.query<{
    politico_id: string
    nome_eleitoral: string
    partido: string | null
    uf: string | null
    foto_url: string | null
    voto: string
    slug: string
  }>(
    `SELECT pol.id AS politico_id, pol.nome_eleitoral, pt.sigla AS partido, pol.uf, pol.foto_url, v.voto, pol.slug
     FROM votacoes v
     JOIN politicos pol ON pol.id = v.politico_id
     LEFT JOIN partidos pt ON pt.id = pol.partido_id
     WHERE v.proposicao = $1
       AND v.proposicao_id = $2
     ORDER BY pol.nome_eleitoral ASC`,
    [propRef, ultimaSessao?.proposicao_id ?? '']
  )
  const votosIndividuais = votosIndividuaisResult.rows.map((row) => ({
    politico_id: row.politico_id,
    nome_eleitoral: row.nome_eleitoral,
    partido: row.partido,
    uf: row.uf,
    foto_url: row.foto_url,
    voto: row.voto,
    slug: row.slug,
  }))

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
    <div style={{ background: 'var(--bg)', minHeight: '100vh', position: 'relative', overflow: 'hidden' }}>
      {/* Ambient top glow */}
      <div style={{
        position: 'absolute',
        top: 0, left: '50%',
        transform: 'translateX(-50%)',
        width: '100%', maxWidth: 1200, height: 400,
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px 80px', position: 'relative', zIndex: 1 }}>

        {/* ── Grid único: conteúdo principal + sidebar sticky ─────────────────── */}
        <div className="projeto-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0,1fr) 320px',
          gap: 32,
          alignItems: 'start',
        }}>

          {/* ══ COLUNA PRINCIPAL ══════════════════════════════════════════════ */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <Link href="/projetos" style={{ fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none' }} className="hover:text-white transition-colors">
                Projetos
              </Link>
              <span style={{ fontSize: 11, color: 'var(--line-strong)', userSelect: 'none' }}>/</span>
              <span style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>
                {proposicao.tipo} {proposicao.numero}/{proposicao.ano}
              </span>
            </div>

            {/* ── Hero: badge + h1 + ementa + resumo + IA ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <span style={{
                  fontSize: 11, padding: '3px 10px', borderRadius: 4,
                  background: '#131b2e', color: '#7c839b',
                  letterSpacing: '0.08em', fontWeight: 700,
                  fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                }}>{tipoLabel}</span>
                <span style={{ fontSize: 13, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                  {tituloCompleto}
                </span>
              </div>

              {/* Título */}
              <h1 style={{
                margin: '0 0 12px',
                fontSize: 'clamp(22px, 2.6vw, 34px)',
                lineHeight: 1.2, letterSpacing: '-0.02em',
                color: 'var(--ink)', fontWeight: 800,
              }}>
                {proposicao.titulo_simplificado ?? (
                  proposicao.ementa && proposicao.ementa.length > 100
                    ? proposicao.ementa.slice(0, 100) + '…'
                    : (proposicao.ementa ?? tituloCompleto)
                )}
              </h1>

              {/* Ementa original */}
              {proposicao.ementa && (
                <p style={{
                  margin: '0 0 20px', fontSize: 13, lineHeight: 1.65,
                  color: 'var(--ink-3)', fontStyle: 'italic',
                }}>
                  <GlossaryHighlighter>{proposicao.ementa}</GlossaryHighlighter>
                </p>
              )}

              {/* Em Resumo */}
              {proposicao.frases_chave && proposicao.frases_chave.length > 0 && (
                <div style={{
                  background: 'var(--panel)', border: '1px solid var(--line)',
                  borderRadius: 12, padding: '20px 22px', marginBottom: 16,
                }}>
                  <div style={{
                    fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                    color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase', marginBottom: 14,
                  }}>Em Resumo</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {proposicao.frases_chave.map((frase, i) => (
                      <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 14, lineHeight: 1.5, color: 'var(--ink)' }}>
                        <span style={{
                          flexShrink: 0, marginTop: 1, width: 22, height: 22, borderRadius: '50%',
                          background: 'var(--brand-soft)', color: 'var(--brand)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 800,
                        }}>{i + 1}</span>
                        <GlossaryHighlighter>{frase}</GlossaryHighlighter>
                      </li>
                    ))}
                  </ul>
                </div>
              )}


            </div>

            {/* ── Tramitação ── */}
            <section style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '28px 28px 12px',
            }}>
              <h2 style={{ margin: '0 0 28px', fontSize: 18, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
                🗺 Tramitação do Projeto
              </h2>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 20, top: 0, bottom: 0,
                  width: 2, background: 'var(--line)',
                  transform: 'translateX(-50%)', zIndex: 0,
                }} />
                {tramitacoes.length > 0 ? (
                  tramitacoes.map((t, idx) => {
                    const isLast  = idx === tramitacoes.length - 1
                    const dataFmt = t.data_hora
                      ? new Date(t.data_hora).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).toUpperCase()
                      : ''
                    const titulo  = t.descricao_tramitacao ?? t.descricao_situacao ?? 'Despacho'
                    const orgao   = t.sigla_orgao ? `[${t.sigla_orgao}] ` : ''
                    return (
                      <TimelineItem key={t.sequencia}
                        data={dataFmt}
                        titulo={`${orgao}${titulo}`}
                        descricao={t.despacho ?? t.descricao_situacao ?? ''}
                        status={isLast ? 'current' : 'done'}
                        dotColor={isLast ? sit.dot : undefined}
                        urlDocumento={t.url_documento ?? undefined}
                      />
                    )
                  })
                ) : (
                  <>
                    {dataApresentacao && (
                      <TimelineItem data={dataApresentacao}
                        titulo="Apresentação do Projeto"
                        descricao={`Projeto lido em plenário${casaLabel ? ` da ${casaLabel}` : ''} e enviado para comissões técnicas da casa legislativa.`}
                        status="done"
                      />
                    )}
                    <TimelineItem data="EM ANDAMENTO"
                      titulo={proposicao.situacao && proposicao.situacao.length < 60 ? proposicao.situacao : sit.label}
                      descricao={proposicao.situacao && proposicao.situacao.length >= 60 ? proposicao.situacao : 'Aguardando próximos passos na tramitação.'}
                      status="current" dotColor={sit.dot}
                    />
                    <p style={{ margin: '4px 0 20px 56px', fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>
                      Histórico detalhado disponível em breve.
                    </p>
                  </>
                )}
              </div>
              {tramitacoes.length > 0 && (
                <p style={{ margin: '4px 0 16px', fontSize: 11, color: 'var(--ink-3)', fontStyle: 'italic', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                  {tramitacoes.length} despachos · Câmara dos Deputados
                </p>
              )}
            </section>

            {/* ── Votação ── */}
            {votacoesPartido.length > 0 ? (
              <div className="space-y-6">
                <VotacoesTable rows={votacoesPartido} tituloCompleto={tituloCompleto} dataSessao={ultimaSessao?.data ?? null} />
                <TabelaVotosIndividuais votos={votosIndividuais} />
              </div>
            ) : (
              <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{
                  background: 'var(--bg-2)', borderBottom: '1px solid var(--line)',
                  padding: '20px 28px', display: 'flex',
                  alignItems: 'center', justifyContent: 'space-between', gap: 16,
                }}>
                  <div>
                    <h2 style={{ margin: '0 0 2px', fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>Votação Final</h2>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>{tituloCompleto}</p>
                  </div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {['SIM','NÃO','ABS'].map(label => (
                      <div key={label} style={{ textAlign: 'center' }}>
                        <span style={{ display: 'block', fontSize: 28, fontWeight: 800, color: '#e5e7eb', lineHeight: 1 }}>—</span>
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 32 }}>🗳️</div>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>Dados de votação não disponíveis</p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', maxWidth: 440, lineHeight: 1.6 }}>
                    O histórico nominal de votos para este projeto ainda não foi coletado.
                  </p>
                  <a href={proposicao.link_camara ?? proposicao.link_senado ?? 'https://dadosabertos.camara.leg.br'}
                    target="_blank" rel="noopener noreferrer"
                    style={{ marginTop: 4, fontSize: 13, color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none' }}
                  >Ver votações na fonte oficial ↗</a>
                </div>
              </section>
            )}

          </div>{/* fim coluna principal */}

          {/* ══ SIDEBAR STICKY ════════════════════════════════════════════════ */}
          <aside style={{
            position: 'sticky', top: 24,
            display: 'flex', flexDirection: 'column', gap: 16,
          }}>

            {/* Inteligência Cívica (IA) */}
            <IAPerguntaProjeto projetoId={proposicao.id} tituloProjeto={propRef} />

            {/* Autoria */}
            <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '22px' }}>
              <h2 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '0.02em' }}>
                {autores.length > 1 ? `Autoria (${autores.length})` : 'Autoria'}
              </h2>
              {autores.length === 0 ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0' }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, color: 'rgba(255,255,255,0.3)',
                  }}>?</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.45)', marginBottom: 2 }}>Autor não identificado</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', lineHeight: 1.4 }}>Dados de autoria não disponíveis.</div>
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {autores.map((a) => {
                    const nome    = a.pol_nome_eleitoral ?? a.nome
                    const href    = a.pol_slug ? `/politicos/${a.pol_slug}` : null
                    const partido = a.partido_sigla ? `${a.partido_sigla}${a.pol_uf ? ` · ${a.pol_uf}` : ''}` : null
                    const inner = (
                      <div className="autor-row" style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '8px 8px', borderRadius: 8, transition: 'background 0.15s',
                      }}>
                        {a.pol_foto_url ? (
                          <Image src={a.pol_foto_url} alt={nome} width={48} height={48}
                            style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: '2px solid rgba(255,255,255,0.25)' }}
                            unoptimized />
                        ) : (
                          <div style={{
                            width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(255,255,255,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, fontWeight: 800, color: '#fff',
                          }}>{nome.charAt(0).toUpperCase()}</div>
                        )}
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 2 }}>{nome}</div>
                          {partido && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)' }}>{partido}</div>}
                        </div>
                      </div>
                    )
                    return href
                      ? <Link key={a.id} href={href} style={{ textDecoration: 'none' }}>{inner}</Link>
                      : <div key={a.id}>{inner}</div>
                  })}
                </div>
              )}
            </section>

            {/* Status */}
            <section style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 12, padding: '22px',
            }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', marginBottom: 14,
              }}>Status Atual</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', flexShrink: 0, background: sit.dot }} />
                <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.25 }}>
                  {proposicao.situacao && proposicao.situacao.length < 60 ? proposicao.situacao : sit.label}
                </span>
              </div>

              {proposicao.situacao && proposicao.situacao.length >= 60 && (
                <p style={{ margin: '0 0 10px', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                  {proposicao.situacao.length > 140 ? proposicao.situacao.slice(0, 140) + '…' : proposicao.situacao}
                </p>
              )}
              {dataApresentacao && (
                <p style={{ margin: '0 0 18px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.4 }}>
                  Apresentado em {dataApresentacao}{casaLabel ? ` — ${casaLabel}` : ''}
                </p>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Link href="/login" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  padding: '12px 16px', background: 'var(--brand-2)', color: '#fff',
                  borderRadius: 8, fontSize: 14, fontWeight: 700, textDecoration: 'none',
                }}>🔔 Seguir Projeto</Link>
                {(proposicao.link_camara ?? proposicao.link_senado) && (
                  <a href={(proposicao.link_camara ?? proposicao.link_senado)!}
                    target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '10px 16px', background: 'transparent', color: 'var(--ink-2)',
                      borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
                      border: '1px solid var(--line)',
                    }}
                  >Ver Documento Original</a>
                )}
              </div>
            </section>

            {/* Documentos */}
            <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: '20px 22px' }}>
              <div style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
                color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                textTransform: 'uppercase', marginBottom: 12,
              }}>Documentos Oficiais</div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {proposicao.link_camara && <DocLink href={proposicao.link_camara} label="Íntegra do Projeto (PDF)" />}
                {proposicao.link_senado && <DocLink href={proposicao.link_senado} label="Ver no Senado Federal" />}
                {proposicao.link_camara && <DocLink href={proposicao.link_camara + '/historico'} label="Histórico de Pareceres" />}
                <DocLink href="https://dadosabertos.camara.leg.br" label="Dados via API Cívica" />
                {!proposicao.link_camara && !proposicao.link_senado && (
                  <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>Sem links disponíveis.</p>
                )}
              </div>
            </section>

            <Link href="/projetos" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none', fontWeight: 500,
            }}>← Todos os projetos</Link>

          </aside>{/* fim sidebar */}

        </div>{/* fim grid */}
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 960px) {
          .projeto-grid { grid-template-columns: 1fr !important; }
          .projeto-grid aside { position: static !important; }
        }
        .autor-row:hover { background: rgba(255,255,255,0.08) !important; }
        .vot-row {
          transition: background 0.15s ease;
        }
        .vot-row:hover {
          background: rgba(255, 255, 255, 0.02) !important;
        }
      ` }} />
    </div>
  )
}

// Sub-componentes

function TimelineItem({ data, titulo, descricao, status, dotColor, urlDocumento }: {
  data: string
  titulo: string
  descricao: string
  status: 'done' | 'current'
  dotColor?: string
  urlDocumento?: string
}) {
  const bg = status === 'done' ? 'var(--brand-2)' : (dotColor ?? '#F59E0B')
  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', paddingBottom: 28 }}>
      <div style={{
        position: 'absolute', left: 0, top: 0,
        width: 40, height: 40, borderRadius: '50%',
        background: bg,
        border: '4px solid var(--bg)',
        boxShadow: status === 'current'
          ? `0 0 0 2px var(--line), 0 0 12px ${bg}`
          : '0 0 0 2px var(--line)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, zIndex: 1,
      }}>
        <span style={{ fontSize: 16, color: 'white', fontWeight: 900, lineHeight: 1 }}>
          {status === 'done' ? '✓' : '↻'}
        </span>
      </div>
      <div style={{ marginLeft: 56, paddingTop: 2 }}>
        <span style={{
          display: 'block', marginBottom: 4,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
          fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
          color: status === 'current' ? bg : 'var(--ink-3)',
        }}>
          {data}
        </span>
        <h4 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', lineHeight: 1.3 }}>
          {titulo}
        </h4>
        {descricao && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
            <GlossaryHighlighter>{descricao}</GlossaryHighlighter>
          </p>
        )}
        {urlDocumento && (
          <a href={urlDocumento} target="_blank" rel="noopener noreferrer"
            style={{ display: 'inline-block', marginTop: 6, fontSize: 12, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}>
            Ver documento ↗
          </a>
        )}
      </div>
    </div>
  )
}

function VotacoesTable({ rows, tituloCompleto, dataSessao }: { rows: VotacaoPartidoPg[]; tituloCompleto: string; dataSessao: string | null }) {
  const totalSim = rows.reduce((s, r) => s + Number(r.sim), 0)
  const totalNao = rows.reduce((s, r) => s + Number(r.nao), 0)
  const totalAbs = rows.reduce((s, r) => s + Number(r.abstencao), 0)

  function orientacao(row: VotacaoPartidoPg) {
    const sim = Number(row.sim), nao = Number(row.nao)
    if (sim > nao * 2) return { label: 'Liberado', bg: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'rgba(16,185,129,0.2)' }
    if (nao > sim * 2) return { label: 'Não',      bg: 'rgba(239,68,68,0.1)',  color: '#EF4444', border: 'rgba(239,68,68,0.2)' }
    return                     { label: 'Sim',      bg: 'rgba(16,185,129,0.1)', color: '#10B981', border: 'rgba(16,185,129,0.2)' }
  }

  return (
    <section style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{
        background: 'var(--bg-2)', borderBottom: '1px solid var(--line)',
        padding: '20px 28px', display: 'flex', flexWrap: 'wrap',
        alignItems: 'center', justifyContent: 'space-between', gap: 16,
      }}>
        <div>
          <h2 style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 700, color: 'var(--ink)' }}>Votação Final</h2>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', fontStyle: 'italic' }}>
            {tituloCompleto}
            {dataSessao && ` · ${new Date(dataSessao).toLocaleDateString('pt-BR')}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 28 }}>
          {[
            { label: 'SIM', value: totalSim, color: '#10B981' },
            { label: 'NÃO', value: totalNao, color: '#EF4444' },
            { label: 'ABS', value: totalAbs, color: '#F59E0B' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <span style={{ display: 'block', fontSize: 36, fontWeight: 800, color, lineHeight: 1 }}>{value}</span>
              <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tabela */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)' }}>
              {['Bancada / Partido', 'Orientação', 'Sim', 'Não', 'Abs', 'Engajamento'].map(h => (
                <th key={h} style={{
                  padding: '10px 20px',
                  textAlign: h === 'Bancada / Partido' || h === 'Orientação' ? 'left' : 'center',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.06em',
                  color: 'var(--ink)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase',
                  borderBottom: '1px solid var(--line)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const tot = Number(row.total)
              const pct = tot > 0 ? Math.round((Number(row.sim) / tot) * 100) : 0
              const ori = orientacao(row)
              return (
                <tr key={row.sigla ?? 'sem-partido'} style={{ borderBottom: '1px solid var(--line)' }}
                  className="vot-row">
                  <td style={{ padding: '13px 20px', fontWeight: 700, color: 'var(--ink)' }}>
                    {row.sigla ?? 'Sem partido'}
                  </td>
                  <td style={{ padding: '13px 20px' }}>
                    <span style={{
                      display: 'inline-block', padding: '3px 10px', borderRadius: 4,
                      background: ori.bg, color: ori.color,
                      border: `1px solid ${ori.border}`,
                      fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    }}>
                      {ori.label}
                    </span>
                  </td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', color: '#10B981', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{row.sim}</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', color: '#EF4444', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{row.nao}</td>
                  <td style={{ padding: '13px 20px', textAlign: 'center', color: '#F59E0B', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>{row.abstencao}</td>
                  <td style={{ padding: '13px 20px' }}>
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

function DocLink({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '10px 4px', borderRadius: 6,
        fontSize: 13, color: 'var(--brand-2)', fontWeight: 500,
        textDecoration: 'none',
        borderBottom: '1px solid var(--line)',
      }}
    >
      📄 <span style={{ textDecoration: 'underline' }}>{label}</span>
    </a>
  )
}
