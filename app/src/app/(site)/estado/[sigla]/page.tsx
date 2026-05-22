import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { getEstado, ESTADOS } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import {
  StateAnchorNav,
  HemicycleChart,
  PartyBar,
  EconSetoresBar,
  PactoFederativoFlow,
  TimelinePolitica,
} from './StatePageClient'

export const revalidate = 86400

// ─── Static params ─────────────────────────────────────────────────────────────
export function generateStaticParams() {
  return Object.keys(ESTADOS).map((s) => ({ sigla: s.toLowerCase() }))
}

// ─── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string }> }
): Promise<Metadata> {
  const { sigla } = await params
  const cfg = getEstado(sigla)
  if (!cfg) return { title: 'Estado não encontrado' }
  return {
    title: `${cfg.nome} — Inteligência Política | Meus Políticos`,
    description: `Governança, economia, pacto federativo, bancada e transparência de ${cfg.nome}. Dados do IBGE, STN e TSE.`,
    openGraph: {
      title: `${cfg.nome} — Painel Político`,
      description: `PIB, IDH, emendas, bancada federal e governador de ${cfg.nome}.`,
      type: 'website',
    },
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────
type GovernadorRow = {
  nome_governador: string
  partido_sigla: string | null
  mandato_inicio: string
  mandato_fim: string | null
  foto_url: string | null
  situacao: string | null
}

type EconomiaRow = {
  pib_total_mi: number | null
  pib_per_capita: number | null
  pib_variacao_pct: number | null
  pib_agro_pct: number | null
  pib_industria_pct: number | null
  pib_servicos_pct: number | null
  populacao: number | null
  idh: number | null
  idh_ranking_nacional: number | null
  ranking_pib_nacional: number | null
  arrecadacao_icms_mi: number | null
  desemprego_pct: number | null
  gini: number | null
}

type PactoRow = {
  fpe_mi: number
  sus_mi: number
  fundeb_mi: number
  total_recebido_mi: number
  ir_arrecadado_mi: number
  ipi_arrecadado_mi: number
  previdencia_mi: number
  total_enviado_mi: number
  saldo_federativo_mi: number
  tipo: 'doador' | 'receptor'
}

type TribunalRow = {
  tipo: string
  nome_completo: string
  presidente: string | null
  sede: string | null
  site_oficial: string | null
}

type PoliticoRow = {
  id: string
  slug: string
  nome_eleitoral: string
  foto_url: string | null
  cargo: string
  partidos: { sigla: string } | null
}

type TimelineRow = {
  ano: number
  mes: number | null
  titulo: string
  descricao: string | null
  tipo: string | null
  impacto: string | null
}

type AleRow = {
  total_deputados: number | null
  presidente_nome: string | null
  presidente_partido: string | null
  site_oficial: string | null
  legislatura: number
}

type MunicipioRow = {
  codigo_ibge: number
  nome: string
  populacao: number | null
}

type EmendaMunRow = {
  municipio_ibge: string | null
  municipio_nome: string | null
  total_pago: number
  qtd_emendas: number
}

// ─── Helpers ───────────────────────────────────────────────────────────────────
function fmtMi(v: number | null | undefined): string {
  if (v == null) return '—'
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(2)}tri`
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}bi`
  return `R$ ${v.toFixed(0)}mi`
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR')
}

function fmtPop(v: number | null | undefined): string {
  if (v == null) return '—'
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}mi`
  if (v >= 1000) return `${(v / 1000).toFixed(0)}k`
  return String(v)
}

// ─── Sub-components (Server) ───────────────────────────────────────────────────
function SectionHeader({ title, subtitle, cor }: { title: string; subtitle?: string; cor: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 22, fontWeight: 700, color: 'var(--ink)',
        fontFamily: 'var(--font-display)', margin: 0,
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <span style={{ width: 4, height: 22, borderRadius: 2, background: cor, display: 'inline-block', flexShrink: 0 }} />
        {title}
      </h2>
      {subtitle && (
        <p style={{ margin: '6px 0 0 14px', fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{
      padding: '32px 24px', textAlign: 'center',
      border: '1px dashed var(--line-soft)', borderRadius: 12,
      color: 'var(--mute)', fontSize: 13, lineHeight: 1.6,
    }}>
      {msg}
    </div>
  )
}

function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line-soft)',
      borderRadius: 10,
      padding: '24px 28px',
      ...style,
    }}>
      {children}
    </div>
  )
}

const TRIBUNAL_LABEL: Record<string, string> = {
  tj: 'Tribunal de Justiça',
  tce: 'Tribunal de Contas',
  mp: 'Ministério Público',
  dp: 'Defensoria Pública',
  trt: 'Tribunal Regional do Trabalho',
  tre: 'Tribunal Regional Eleitoral',
}

const TRIBUNAL_ICON: Record<string, string> = {
  tj: '⚖️', tce: '🔍', mp: '🏛️', dp: '🤝', trt: '👷', tre: '🗳️',
}

const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#d97706', PRD: '#1d4ed8', PV: '#16a34a',
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function EstadoPage(
  { params }: { params: Promise<{ sigla: string }> }
) {
  const { sigla } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const sb = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  ) as unknown as any

  // ─── Parallel data fetching ─────────────────────────────────────────────────
  const [
    govRes,
    econRes,
    pactoRes,
    tribunaisRes,
    depFedRes,
    senadoresRes,
    depEstRes,
    municipiosRes,
    emendasMunRes,
    timelineRes,
    aleRes,
  ] = await Promise.all([
    // Governador atual
    sb.from('estados_governos')
      .select('nome_governador, partido_sigla, mandato_inicio, mandato_fim, foto_url, situacao')
      .eq('sigla', siglaUp)
      .eq('is_atual', true)
      .limit(1)
      .maybeSingle(),

    // Economia mais recente
    sb.from('estados_economia')
      .select('pib_total_mi, pib_per_capita, pib_variacao_pct, pib_agro_pct, pib_industria_pct, pib_servicos_pct, populacao, idh, idh_ranking_nacional, ranking_pib_nacional, arrecadacao_icms_mi, desemprego_pct, gini')
      .eq('sigla', siglaUp)
      .order('ano', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Pacto federativo mais recente
    sb.from('estados_pacto_federativo')
      .select('fpe_mi, sus_mi, fundeb_mi, total_recebido_mi, ir_arrecadado_mi, ipi_arrecadado_mi, previdencia_mi, total_enviado_mi, saldo_federativo_mi, tipo')
      .eq('sigla', siglaUp)
      .order('ano', { ascending: false })
      .limit(1)
      .maybeSingle(),

    // Tribunais
    sb.from('estados_tribunais')
      .select('tipo, nome_completo, presidente, sede, site_oficial')
      .eq('sigla', siglaUp)
      .order('tipo'),

    // Deputados federais
    sb.from('politicos')
      .select('id, slug, nome_eleitoral, foto_url, cargo, partidos(sigla)')
      .eq('cargo', 'deputado_federal')
      .eq('uf', siglaUp)
      .is('removido_em', null)
      .order('nome_eleitoral')
      .limit(80),

    // Senadores
    sb.from('politicos')
      .select('id, slug, nome_eleitoral, foto_url, cargo, partidos(sigla)')
      .eq('cargo', 'senador')
      .eq('uf', siglaUp)
      .is('removido_em', null)
      .order('nome_eleitoral')
      .limit(4),

    // Deputados estaduais (para composição ALE)
    sb.from('politicos')
      .select('id, nome_eleitoral, partidos(sigla)')
      .eq('cargo', 'deputado_estadual')
      .eq('uf', siglaUp)
      .is('removido_em', null)
      .limit(200),

    // Municípios do estado (top 10 por população)
    sb.from('municipios')
      .select('codigo_ibge, nome, populacao')
      .eq('uf', siglaUp)
      .order('populacao', { ascending: false, nullsFirst: false })
      .limit(10),

    // Top emendas por município no estado
    sb.from('emendas')
      .select('municipio_ibge, municipio_nome, valor_pago.sum()')
      .eq('uf_municipio', siglaUp)
      .not('municipio_ibge', 'is', null)
      .order('valor_pago.sum()', { ascending: false })
      .limit(8),

    // Timeline histórica
    sb.from('estados_timeline')
      .select('ano, mes, titulo, descricao, tipo, impacto')
      .eq('sigla', siglaUp)
      .order('ano', { ascending: false })
      .limit(20),

    // ALE info
    sb.from('estados_ale')
      .select('total_deputados, presidente_nome, presidente_partido, site_oficial, legislatura')
      .eq('sigla', siglaUp)
      .order('legislatura', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  // ─── Data extraction ──────────────────────────────────────────────────────
  const governador = govRes.data as GovernadorRow | null
  const economia = econRes.data as EconomiaRow | null
  const pacto = pactoRes.data as PactoRow | null
  const tribunais = (tribunaisRes.data ?? []) as TribunalRow[]
  const depFederais = (depFedRes.data ?? []) as PoliticoRow[]
  const senadores = (senadoresRes.data ?? []) as PoliticoRow[]
  const depEstaduais = (depEstRes.data ?? []) as Array<{ id: string; nome_eleitoral: string; partidos: { sigla: string } | null }>
  const municipios = (municipiosRes.data ?? []) as MunicipioRow[]
  const emendasMun = (emendasMunRes.data ?? []) as EmendaMunRow[]
  const timeline = (timelineRes.data ?? []) as TimelineRow[]
  const ale = aleRes.data as AleRow | null

  // ─── ALE party composition ────────────────────────────────────────────────
  const alePartyMap = new Map<string, number>()
  depEstaduais.forEach((d) => {
    const sigPart = d.partidos?.sigla ?? 'Outros'
    alePartyMap.set(sigPart, (alePartyMap.get(sigPart) ?? 0) + 1)
  })
  const alePartidos = Array.from(alePartyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sigla, qtd]) => ({
      sigla,
      qtd,
      cor: PARTIDO_COR[sigla] ?? '#94a3b8',
    }))
  const aleTotalParlamentares = depEstaduais.length || ale?.total_deputados || cfg.depu_estaduais

  // ─── Bancada federal party grouping ──────────────────────────────────────
  const bancadaPartyMap = new Map<string, number>()
  depFederais.forEach((d) => {
    const sp = d.partidos?.sigla ?? 'Outros'
    bancadaPartyMap.set(sp, (bancadaPartyMap.get(sp) ?? 0) + 1)
  })
  const bancadaPartidos = Array.from(bancadaPartyMap.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([sigla, qtd]) => ({
      sigla,
      qtd,
      cor: PARTIDO_COR[sigla] ?? '#94a3b8',
    }))

  // ─── Colors ───────────────────────────────────────────────────────────────
  const cor = cfg.cor

  // ─── PIB Hero KPIs ────────────────────────────────────────────────────────
  const popDisplay = economia?.populacao ?? null
  const pibDisplay = economia?.pib_total_mi ?? null
  const idhDisplay = economia?.idh ?? null

  return (
    <>
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          HERO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{
        background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)',
        borderBottom: '1px solid var(--line-soft)',
        padding: '40px 24px 32px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Breadcrumb */}
          <div style={{ marginBottom: 20, fontSize: 13, color: 'var(--mute)' }}>
            <Link href="/" style={{ color: 'inherit', textDecoration: 'none' }}>Início</Link>
            {' / '}
            <Link href="/estado" style={{ color: 'inherit', textDecoration: 'none' }}>Estados</Link>
            {' / '}
            <span style={{ color: 'var(--ink-3)' }}>{cfg.nome}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            {/* Sigla badge */}
            <div style={{
              width: 64, height: 64, borderRadius: 10,
              background: `${cor}18`,
              border: `2px solid ${cor}44`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, fontWeight: 800, color: cor,
              fontFamily: 'var(--font-mono)', flexShrink: 0,
            }}>
              {siglaUp}
            </div>

            <div style={{ flex: 1 }}>
              <div className="label" style={{ marginBottom: 8, color: 'var(--mute)' }}>
                {cfg.regiao} · {cfg.gentilico}
              </div>
              <h1 style={{
                fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800,
                color: 'var(--ink)', margin: '0 0 8px',
                lineHeight: 1.1, letterSpacing: '-0.02em',
              }}>
                {cfg.nome}
              </h1>
              <p style={{ margin: '0 0 24px', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Capital: <strong style={{ color: 'var(--ink-2)' }}>{cfg.capital}</strong>
                {cfg.area_km2 && ` · ${cfg.area_km2.toLocaleString('pt-BR')} km²`}
                {' · '}{cfg.municipios.toLocaleString('pt-BR')} municípios
              </p>

              {/* Hero KPIs */}
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[
                  { label: 'POPULAÇÃO', value: popDisplay != null ? fmtPop(popDisplay) : '—' },
                  { label: 'PIB', value: fmtMi(pibDisplay) },
                  { label: 'IDH', value: idhDisplay != null ? idhDisplay.toFixed(3) : '—' },
                  { label: 'RANKING PIB', value: economia?.ranking_pib_nacional ? `#${economia.ranking_pib_nacional}` : '—' },
                ].map((kpi) => (
                  <div key={kpi.label} style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line-soft)',
                    borderRadius: 8, padding: '10px 16px',
                    minWidth: 100,
                  }}>
                    <div style={{ fontSize: 9, letterSpacing: '0.1em', color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      {kpi.label}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                      {kpi.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ANCHOR NAV (sticky)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <StateAnchorNav cor={cor} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          RAIO-X RÁPIDO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 0' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: 16,
        }}>
          {[
            { label: 'Área', value: `${cfg.area_km2.toLocaleString('pt-BR')} km²`, icon: '🗺️' },
            { label: 'Municípios', value: cfg.municipios.toLocaleString('pt-BR'), icon: '🏙️' },
            { label: 'Dep. Estaduais', value: cfg.depu_estaduais, icon: '🏛️' },
            { label: 'Dep. Federais', value: cfg.depu_federais, icon: '🇧🇷' },
            { label: 'Senadores', value: cfg.senadores || '—', icon: '⚖️' },
            { label: 'Fuso Horário', value: cfg.fuso, icon: '🕐' },
            ...(economia?.desemprego_pct != null ? [{ label: 'Desemprego', value: `${economia.desemprego_pct}%`, icon: '📊' }] : []),
            ...(economia?.gini != null ? [{ label: 'Gini', value: economia.gini.toFixed(3), icon: '📈' }] : []),
          ].map((item) => (
            <div key={item.label} style={{
              background: 'var(--panel)',
              border: '1px solid var(--line-soft)',
              borderRadius: 12, padding: '16px 20px',
            }}>
              <div style={{ fontSize: 20, marginBottom: 8 }}>{item.icon}</div>
              <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 4 }}>
                {item.label.toUpperCase()}
              </div>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          GOVERNANÇA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="governanca" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Governança"
          subtitle="Poder Executivo estadual — governador e vice-governador"
          cor={cor}
        />
        {governador ? (
          <Card>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24, flexWrap: 'wrap' }}>
              {/* Foto */}
              <div style={{
                width: 80, height: 80, borderRadius: 16, overflow: 'hidden',
                background: 'var(--bg)',
                border: '2px solid var(--line-soft)',
                flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>
                {governador.foto_url
                  ? <img src={governador.foto_url} alt={governador.nome_governador} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '👤'
                }
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                  GOVERNADOR(A) DO ESTADO
                </div>
                <h3 style={{ margin: '0 0 6px', fontSize: 22, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                  {governador.nome_governador}
                </h3>
                <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                  {governador.partido_sigla && (
                    <span style={{
                      display: 'inline-flex', alignItems: 'center',
                      padding: '3px 10px', borderRadius: 999,
                      background: `${PARTIDO_COR[governador.partido_sigla] ?? '#64748b'}22`,
                      color: PARTIDO_COR[governador.partido_sigla] ?? 'var(--ink-3)',
                      fontSize: 12, fontWeight: 700, fontFamily: 'var(--font-mono)',
                      border: `1px solid ${PARTIDO_COR[governador.partido_sigla] ?? '#64748b'}44`,
                    }}>
                      {governador.partido_sigla}
                    </span>
                  )}
                  <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                    Mandato: {new Date(governador.mandato_inicio).getFullYear()}
                    {governador.mandato_fim ? ` – ${new Date(governador.mandato_fim).getFullYear()}` : ''}
                  </span>
                  {governador.situacao && governador.situacao !== 'ativo' && (
                    <span style={{
                      padding: '2px 8px', borderRadius: 999, fontSize: 11,
                      background: 'var(--neg-muted)', color: 'var(--neg)',
                    }}>
                      {governador.situacao.toUpperCase()}
                    </span>
                  )}
                </div>
              </div>

              {/* Links */}
              <div>
                {cfg.sigla && (
                  <a
                    href={`https://www.${sigla.toLowerCase()}.gov.br`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 8,
                      background: 'var(--bg)', border: '1px solid var(--line-soft)',
                      fontSize: 13, color: 'var(--ink-2)', textDecoration: 'none',
                    }}
                  >
                    🌐 Site do Governo
                  </a>
                )}
              </div>
            </div>
          </Card>
        ) : (
          <EmptyState msg={`Dados do governador de ${cfg.nome} não disponíveis. Execute: python etl/estados/seed_governos_tribunais.py`} />
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LEGISLATIVO ESTADUAL (ALE)
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="ale" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Assembleia Legislativa"
          subtitle={`${cfg.depu_estaduais} deputados estaduais que votam leis, orçamento e fiscalizam o Executivo`}
          cor={cor}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {/* Hemiciclo */}
          <Card>
            <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 16 }}>
              COMPOSIÇÃO PARTIDÁRIA
            </div>
            {alePartidos.length > 0 ? (
              <HemicycleChart partidos={alePartidos} total={aleTotalParlamentares} />
            ) : (
              <EmptyState msg="Composição da ALE será exibida após ETL de deputados estaduais. Execute: python etl/tse/collect_eleitos_2022.py" />
            )}
          </Card>

          {/* Barra de partidos + info */}
          <Card>
            <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 16 }}>
              DISTRIBUIÇÃO POR PARTIDO
            </div>
            {alePartidos.length > 0 ? (
              <PartyBar partidos={alePartidos} total={aleTotalParlamentares} />
            ) : (
              <EmptyState msg="Sem dados de deputados estaduais no banco." />
            )}
            {ale && (
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-soft)' }}>
                {ale.presidente_nome && (
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', marginBottom: 6 }}>
                    <span style={{ color: 'var(--mute)' }}>Presidente: </span>
                    <strong>{ale.presidente_nome}</strong>
                    {ale.presidente_partido && <span style={{ color: 'var(--mute)' }}> · {ale.presidente_partido}</span>}
                  </div>
                )}
                {ale.site_oficial && (
                  <a href={ale.site_oficial} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: cor, textDecoration: 'none' }}>
                    🌐 Site oficial da ALE
                  </a>
                )}
              </div>
            )}
          </Card>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          BANCADA FEDERAL
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="bancada" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Bancada Federal"
          subtitle={`${cfg.depu_federais} deputados federais + ${cfg.senadores} senadores que representam ${cfg.nome} no Congresso`}
          cor={cor}
        />

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
          {/* Deputados Federais */}
          <Card>
            <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 16 }}>
              DEPUTADOS FEDERAIS ({depFederais.length > 0 ? depFederais.length : `${cfg.depu_federais} esperados`})
            </div>
            {depFederais.length > 0 ? (
              <>
                {/* Barras de partido */}
                {bancadaPartidos.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <PartyBar partidos={bancadaPartidos} total={depFederais.length} />
                  </div>
                )}
                {/* Lista grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 8, maxHeight: 280, overflowY: 'auto',
                }}>
                  {depFederais.slice(0, 30).map((d) => (
                    <Link key={d.id} href={`/p/${d.slug}`}
                      style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 8, background: 'var(--bg)' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', overflow: 'hidden',
                        background: 'var(--line-soft)', flexShrink: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11,
                      }}>
                        {d.foto_url
                          ? <img src={d.foto_url} alt={d.nome_eleitoral} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : d.nome_eleitoral.charAt(0)}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: 11, color: 'var(--ink-2)', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {d.nome_eleitoral}
                        </div>
                        {d.partidos?.sigla && (
                          <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                            {d.partidos.sigla}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
                {depFederais.length > 30 && (
                  <div style={{ textAlign: 'center', marginTop: 12, fontSize: 12, color: 'var(--mute)' }}>
                    +{depFederais.length - 30} deputados
                  </div>
                )}
              </>
            ) : (
              <EmptyState msg="Deputados federais serão exibidos após ETL da Câmara. Execute: python etl/camara/collect_deputados.py" />
            )}
          </Card>

          {/* Senadores */}
          <Card>
            <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 16 }}>
              SENADORES ({senadores.length > 0 ? senadores.length : `${cfg.senadores} esperados`})
            </div>
            {senadores.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {senadores.map((s) => (
                  <Link key={s.id} href={`/p/${s.slug}`}
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', borderRadius: 10, background: 'var(--bg)', border: '1px solid var(--line-soft)' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', overflow: 'hidden',
                      background: 'var(--line-soft)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
                    }}>
                      {s.foto_url
                        ? <img src={s.foto_url} alt={s.nome_eleitoral} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : '👤'}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{s.nome_eleitoral}</div>
                      <div style={{ fontSize: 12, color: 'var(--mute)' }}>
                        Senador(a) · {s.partidos?.sigla ?? '—'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState msg="Senadores serão exibidos após ETL do Senado. Execute: python etl/senado/collect_senadores.py" />
            )}
          </Card>
        </div>
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          ECONOMIA
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="economia" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Economia"
          subtitle="Indicadores do IBGE — PIB, IDH, emprego e estrutura produtiva"
          cor={cor}
        />
        {economia ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
            {/* KPIs */}
            <Card>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  { label: 'PIB TOTAL', value: fmtMi(economia.pib_total_mi), sub: economia.ranking_pib_nacional ? `#${economia.ranking_pib_nacional} no Brasil` : undefined },
                  { label: 'PIB PER CAPITA', value: economia.pib_per_capita ? `R$ ${economia.pib_per_capita.toLocaleString('pt-BR')}` : '—', sub: undefined },
                  { label: 'IDH', value: economia.idh?.toFixed(3) ?? '—', sub: economia.idh_ranking_nacional ? `#${economia.idh_ranking_nacional} no Brasil` : undefined },
                  { label: 'DESEMPREGO', value: economia.desemprego_pct ? `${economia.desemprego_pct}%` : '—', sub: undefined },
                ].map((item) => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.sub}</div>}
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Setores produtivos */}
            <Card>
              <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 16 }}>
                ESTRUTURA DO PIB POR SETOR
              </div>
              {(economia.pib_agro_pct != null || economia.pib_industria_pct != null || economia.pib_servicos_pct != null) ? (
                <EconSetoresBar
                  agro={economia.pib_agro_pct ?? 0}
                  industria={economia.pib_industria_pct ?? 0}
                  servicos={economia.pib_servicos_pct ?? 0}
                />
              ) : (
                <EmptyState msg="Estrutura do PIB será exibida após ETL do IBGE." />
              )}
              {economia.gini != null && (
                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line-soft)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>GINI (DESIGUALDADE)</div>
                    <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>0 = perfeita igualdade · 1 = máxima desigualdade</div>
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: economia.gini > 0.55 ? 'var(--neg)' : economia.gini < 0.45 ? 'var(--pos)' : 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                    {economia.gini.toFixed(3)}
                  </div>
                </div>
              )}
            </Card>
          </div>
        ) : (
          <EmptyState msg="Dados econômicos serão exibidos após ETL do IBGE. Execute: python etl/ibge/collect_estados_ibge.py" />
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          PACTO FEDERATIVO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="pacto" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Pacto Federativo"
          subtitle="Fluxo de recursos entre o estado e a União — FPE, SUS, FUNDEB vs IR, IPI e Previdência"
          cor={cor}
        />
        {pacto ? (
          <Card>
            <PactoFederativoFlow data={{
              totalEnviado: pacto.total_enviado_mi,
              totalRecebido: pacto.total_recebido_mi,
              fpe: pacto.fpe_mi,
              sus: pacto.sus_mi,
              fundeb: pacto.fundeb_mi,
              ir: pacto.ir_arrecadado_mi,
              ipi: pacto.ipi_arrecadado_mi,
              previdencia: pacto.previdencia_mi,
              saldo: pacto.saldo_federativo_mi,
              tipo: pacto.tipo,
            }} />
          </Card>
        ) : (
          <EmptyState msg="Dados do pacto federativo serão exibidos após ETL da STN. Execute: python etl/stn/collect_pacto_federativo.py" />
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          TRIBUNAIS E CONTROLE
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="tribunais" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Controle e Instituições"
          subtitle="Tribunais e órgãos de controle que fiscalizam o poder público"
          cor={cor}
        />
        {tribunais.length > 0 ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
            {tribunais.map((t) => (
              <div key={t.tipo} style={{
                background: 'var(--panel)',
                border: '1px solid var(--line-soft)',
                borderRadius: 10, padding: '20px 24px',
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 22 }}>{TRIBUNAL_ICON[t.tipo] ?? '🏛️'}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, fontFamily: 'var(--font-mono)',
                    padding: '2px 8px', borderRadius: 999,
                    background: `${cor}22`, color: cor,
                  }}>
                    {t.tipo.toUpperCase()}
                  </span>
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.4 }}>
                  {TRIBUNAL_LABEL[t.tipo] ?? t.tipo} de {cfg.nome}
                </div>
                {t.presidente && (
                  <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>
                    Presidente: {t.presidente}
                  </div>
                )}
                {t.sede && (
                  <div style={{ fontSize: 12, color: 'var(--mute)' }}>📍 {t.sede}</div>
                )}
                {t.site_oficial && (
                  <a href={t.site_oficial} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 12, color: cor, textDecoration: 'none', marginTop: 4 }}>
                    🌐 Site oficial →
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState msg="Dados dos tribunais serão exibidos após seed. Execute: python etl/estados/seed_governos_tribunais.py" />
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          MUNICÍPIOS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="municipios" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Municípios"
          subtitle={`${cfg.municipios.toLocaleString('pt-BR')} municípios — maiores populações`}
          cor={cor}
        />
        {municipios.length > 0 ? (
          <Card style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg)' }}>
                  {['#', 'Município', 'População'].map((h) => (
                    <th key={h} style={{
                      padding: '12px 20px', textAlign: h === '#' ? 'center' : 'left',
                      fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
                      color: 'var(--mute)', letterSpacing: '0.08em',
                      borderBottom: '1px solid var(--line-soft)',
                    }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {municipios.map((m, i) => (
                  <tr key={m.codigo_ibge} style={{ borderBottom: '1px solid var(--line-soft)' }}>
                    <td style={{ padding: '12px 20px', textAlign: 'center', fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', width: 40 }}>
                      {i + 1}
                    </td>
                    <td style={{ padding: '12px 20px' }}>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{m.nome}</div>
                      <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>
                        IBGE {m.codigo_ibge}
                      </div>
                    </td>
                    <td style={{ padding: '12px 20px', fontSize: 14, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)' }}>
                      {m.populacao != null ? fmtNum(m.populacao) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <EmptyState msg="Municípios serão exibidos após ETL do IBGE. Execute: python etl/ibge/collect_municipios.py" />
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          EMENDAS
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="emendas" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 0' }}>
        <SectionHeader
          title="Emendas Parlamentares"
          subtitle="Recursos destinados ao estado por parlamentares — Portal da Transparência"
          cor={cor}
        />
        {emendasMun.length > 0 ? (
          <Card>
            <div style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', marginBottom: 16 }}>
              MUNICÍPIOS COM MAIS EMENDAS (valor pago)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {emendasMun.map((em, i) => {
                const maxPago = emendasMun[0]?.total_pago ?? 1
                const pct = Math.round((em.total_pago / maxPago) * 100)
                return (
                  <div key={em.municipio_ibge ?? i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{em.municipio_nome ?? em.municipio_ibge}</span>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>
                        {fmtMi(em.total_pago)} · {em.qtd_emendas} emendas
                      </span>
                    </div>
                    <div style={{ height: 5, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: cor, borderRadius: 99 }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        ) : (
          <EmptyState msg="Emendas serão exibidas após ETL do Portal da Transparência. Execute: python etl/transparencia/collect_emendas.py --uf SP" />
        )}
      </section>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          LINHA DO TEMPO
      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <section id="timeline" style={{ maxWidth: 1200, margin: '0 auto', padding: '52px 24px 72px' }}>
        <SectionHeader
          title="Linha do Tempo"
          subtitle="Eventos históricos, eleições, crises e marcos políticos"
          cor={cor}
        />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(500px, 1fr))', gap: 20 }}>
          <Card>
            <TimelinePolitica items={timeline} />
          </Card>

          {/* Info card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card style={{ background: `${cor}11`, border: `1px solid ${cor}33` }}>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', color: cor, fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                SOBRE A LINHA DO TEMPO
              </div>
              <p style={{ fontSize: 13.5, color: 'var(--ink-2)', lineHeight: 1.7, margin: 0 }}>
                A linha do tempo registra eventos relevantes da política estadual:
                eleições, escândalos, obras, crises, reformas e mudanças de governo.
              </p>
              <p style={{ fontSize: 13, color: 'var(--mute)', lineHeight: 1.6, margin: '10px 0 0' }}>
                Dados obtidos de fontes públicas e contribuições da comunidade.
                {timeline.length === 0 && (
                  <> Insira eventos via: <code style={{ fontSize: 11, background: 'var(--bg)', padding: '1px 5px', borderRadius: 4 }}>estados_timeline</code> na tabela do banco.</>
                )}
              </p>
            </Card>

            {/* Links úteis */}
            <Card>
              <div style={{ fontSize: 12, letterSpacing: '0.1em', color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 12 }}>
                LINKS ÚTEIS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: `Portal da Transparência de ${cfg.nome}`, href: `https://www.transparencia.${sigla.toLowerCase()}.gov.br` },
                  { label: 'TSE — Eleições', href: 'https://www.tse.jus.br' },
                  { label: 'IBGE — Cidades', href: `https://cidades.ibge.gov.br/brasil/${sigla.toLowerCase()}` },
                  { label: `Tribunal de Contas — ${cfg.nome}`, href: `https://www.tce.${sigla.toLowerCase()}.gov.br` },
                ].map((link) => (
                  <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 13, color: cor, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🔗 {link.label}
                  </a>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  )
}
