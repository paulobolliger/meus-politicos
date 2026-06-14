'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Bell, Download, Loader2, Scale, Star, X } from 'lucide-react'

import { GlossaryTooltip, Panel, PanelHeader, Sparkline, StatusDot, VoteChip } from '@/components/civic'
import { ModoCidadao } from '@/components/politico-v2/ModoCidadao'
import { ModoV3 } from '@/components/politico-v2/ModoV3'
import { ShareButton } from '@/components/politico-v2/ShareButton'
import { IAPerguntaPolitico } from '@/components/politico-v2/IAPerguntaPolitico'
import {
  CARGO_LABEL,
  CEAP_TETO_UF,
  NA,
  formatCurrency,
  formatGabinetePhone,
  formatOptionalNumber,
  initials,
  normalizePlatform,
  yearsInOffice,
} from '@/components/politico-v2/shared'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'

// ── types ────────────────────────────────────────────────────────────────────

type GastoItem = {
  valor: number
  categoria: string | null
  mes: number
  ano: number
}

type PresencaItem = {
  percentual: number
  mes: number | null
  ano: number
  total_sessoes: number
  presencas: number
}

type VotacaoItem = {
  id: string
  voto: string
  descricao_simples: string | null
  data: string
  proposicao: string | null
}

type HistoricoPartidarioItem = {
  partido_sigla: string | null
  partido_nome: string | null
  partido_cor: string | null
  inicio: string | null
  fim: string | null
  motivo: string | null
  atual: boolean
}

type AgendaItem = {
  id: string
  data: string
  hora_inicio: string | null
  titulo: string | null
  tipo: string | null
  situacao: string | null
  link: string | null
  fonte: string
}

type DoadorEleitoralItem = {
  nome: string
  valor: number
  tipo: string | null
  ano: number | null
}

type ProposicaoItem = {
  id: string
  slug: string
  tipo: string | null
  numero: string | number | null
  ano: number | null
  situacao: string | null
  ementa: string | null
}

type EmendaItem = {
  id: string
  valor_pago: number | null
  valor: number | null
  ano: number | null
  municipio_nome: string | null
  uf_municipio: string | null
  funcao: string | null
}

type FeedEvento = {
  id: string
  data: string | null
  impacto_nivel: number | null
  titulo: string | null
  descricao: string | null
  descricao_simples: string | null
  link_fonte: string | null
}

type AcompanhamentoItem = {
  politico_id: string
  tipo: 'voto' | 'seguir'
}

type AnnualKpis = {
  ano: number
  has_presenca_ano: boolean
  has_votacoes_ano: boolean
  has_gastos_ano: boolean
  has_emendas_ano: boolean
  has_proposicoes_ano: boolean
  presenca_pct: number | null
  presenca_total_sessoes: number
  presenca_total_presencas: number
  total_votacoes: number
  gasto_total: number
  gasto_ultimo_mes: number | null
  total_emendas: number
  total_proposicoes: number
}

type Politico = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  uf_nascimento?: string | null
  sexo?: string | null
  foto_url: string | null
  email: string | null
  gabinete_nome: string | null
  gabinete_telefone: string | null
  gabinete_email: string | null
  data_nascimento: string | null
  naturalidade: string | null
  escolaridade: string | null
  ocupacao: string | null
  mandato_inicio: string | null
  mandato_fim: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  dado_estado: string | null
  collected_at: string | null
  cpf?: string | null
  partidos?: { sigla: string | null; nome: string | null; numero: number | null } | null
  redes_sociais?: Array<{ plataforma: string | null; url: string | null }> | null
}

type Props = {
  politico: Politico
  votacoes: VotacaoItem[]
  votacoesRecentes?: VotacaoItem[]
  gastos: GastoItem[]
  presenca: PresencaItem[]
  proposicoes?: ProposicaoItem[]
  emendas?: EmendaItem[]
  historicoPartidario?: HistoricoPartidarioItem[]
  agenda?: AgendaItem[]
  doadoresEleitorais?: DoadorEleitoralItem[]
  kpis: AnnualKpis
  initialTab?: string
  timelineActive?: boolean
  feedEventos?: FeedEvento[]
  expliqueVotacaoActive?: boolean
}

// ── constants ─────────────────────────────────────────────────────────────────

const TABS = ['Visão geral', 'Votações', 'Gastos', 'Presença', 'Projetos de Lei', 'Emendas', 'Notícias', 'Linha do Tempo', 'Histórico', 'Fontes'] as const
type Tab = typeof TABS[number]

const heroIconButtonBase = {
  width: 40,
  height: 40,
  borderRadius: 12,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  background: 'rgba(15, 23, 42, 0.62)',
  color: 'var(--ink-2)',
  boxShadow: '0 10px 28px rgba(0,0,0,0.18)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
} as const

const heroBadgeBase = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  minHeight: 24,
  borderRadius: 999,
  padding: '4px 10px',
  fontSize: 10,
  letterSpacing: '0.08em',
  border: '1px solid rgba(148, 163, 184, 0.28)',
  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 18px rgba(0,0,0,0.14)',
  backdropFilter: 'blur(10px)',
  WebkitBackdropFilter: 'blur(10px)',
} as const

// ── donut chart ───────────────────────────────────────────────────────────────

const DONUT_COLORS = [
  'var(--brand)', 'var(--accent)', 'var(--pos)', 'var(--warn)', 'var(--info)', 'var(--ink-3)',
]

function GastosDonut({ categorias }: { categorias: [string, number][] }) {
  const total = categorias.reduce((s, [, v]) => s + v, 0)
  if (total === 0 || categorias.length === 0) return null

  const cx = 70, cy = 70, r = 52, stroke = 20
  const gap = 0.02
  const slices = categorias.slice(0, 6).map(([cat, val], i) => {
    const frac = val / total
    const angle = frac * (2 * Math.PI) - gap
    const startAngle = -Math.PI / 2 + categorias
      .slice(0, i)
      .reduce((sum, [, previousValue]) => sum + (previousValue / total) * (2 * Math.PI), 0)
    const x1 = cx + r * Math.cos(startAngle + gap / 2)
    const y1 = cy + r * Math.sin(startAngle + gap / 2)
    const x2 = cx + r * Math.cos(startAngle + angle)
    const y2 = cy + r * Math.sin(startAngle + angle)
    const large = angle > Math.PI ? 1 : 0
    return { cat, val, frac, x1, y1, x2, y2, large, color: DONUT_COLORS[i] }
  })

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
      <svg width="140" height="140" viewBox="0 0 140 140" style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path
            key={i}
            d={`M ${cx} ${cy} L ${s.x1} ${s.y1} A ${r} ${r} 0 ${s.large} 1 ${s.x2} ${s.y2} Z`}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            style={{ transform: `translate(${cx}px, ${cy}px) scale(1) translate(-${cx}px, -${cy}px)` }}
          />
        ))}
        {/* inner ring mask */}
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 1} fill="var(--panel)" />
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize="9" fill="var(--ink-3)" fontFamily="var(--font-mono)">TOTAL</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="11" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-mono)">
          {total >= 1000 ? `${(total / 1000).toFixed(0)}k` : String(Math.round(total))}
        </text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 10.5, color: 'var(--ink-2)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.cat}</span>
            <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>{Math.round(s.frac * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────

function maskCpf(cpf: string | null | undefined) {
  if (!cpf) return NA
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return NA
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.***-**`
}

function formatDateOnly(value: string | null | undefined, year: '2-digit' | 'numeric' = 'numeric') {
  if (!value) return NA
  const [datePart] = value.split('T')
  const [yyyy, mm, dd] = datePart.split('-')
  if (!yyyy || !mm || !dd) return NA
  return year === '2-digit' ? `${dd}/${mm}/${yyyy.slice(-2)}` : `${dd}/${mm}/${yyyy}`
}

function yearFromDateOnly(value: string | null | undefined) {
  return value?.slice(0, 4) || NA
}

function socialVisual(platform: string) {
  if (platform.includes('twitter') || platform === 'x') return { icon: '𝕏', label: 'Twitter/X', bg: 'var(--panel)', color: 'var(--ink)' }
  if (platform.includes('instagram')) return { icon: '◉', label: 'Instagram', bg: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: 'var(--ink)' }
  if (platform.includes('youtube')) return { icon: '▶', label: 'YouTube', bg: 'var(--neg)', color: 'var(--ink)' }
  if (platform.includes('facebook')) return { icon: 'f', label: 'Facebook', bg: 'var(--info)', color: 'var(--ink)' }
  if (platform.includes('linkedin')) return { icon: 'in', label: 'LinkedIn', bg: 'var(--brand-2)', color: 'var(--ink)' }
  return { icon: '◎', label: 'Site oficial', bg: 'var(--line-strong)', color: 'var(--ink)' }
}

function votoToChip(voto: string): string {
  const map: Record<string, string> = {
    sim: 'SIM',
    nao: 'NÃO',
    abstencao: 'ABS',
    ausente: 'AUS',
    obstrucao: 'OBS',
    artigo_17: 'OBS',
  }
  return map[voto] ?? 'AUS'
}

// ── sub-components ────────────────────────────────────────────────────────────

function PlaceholderPanel({ title, badge, message }: { title: string; badge: string; message: string }) {
  return (
    <Panel>
      <PanelHeader title={title} action={
        <span style={{ fontSize: 10, color: 'var(--mute)', background: 'var(--bg-2)', padding: '2px 8px', border: '1px solid var(--line)' }}>
          {badge}
        </span>
      } />
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>{message}</p>
      </div>
    </Panel>
  )
}

function KpiCard({
  label,
  value,
  sub,
  sparkData,
  muted,
}: {
  label: string
  value: string
  sub?: string
  sparkData?: number[]
  muted?: boolean
}) {
  return (
    <div
      style={{
        background: 'rgba(30, 41, 59, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '16px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}
    >
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: muted ? 'var(--mute)' : 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mute)' }}>{sub}</div>}
      {sparkData && sparkData.length > 1 && (
        <div style={{ marginTop: 6 }}>
          <Sparkline data={sparkData} w={80} h={20} />
        </div>
      )}
    </div>
  )
}

function RadarCard({
  label,
  value,
  valueLabel,
  bar,
  median,
  medianLabel,
  badge,
}: {
  label: string
  value: string
  valueLabel?: string
  bar?: number | null
  median?: number
  medianLabel?: string
  badge?: string
}) {
  return (
    <Panel>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{label}</div>
          {badge && (
            <span className="mono" style={{ fontSize: 9, color: 'var(--mute)', background: 'var(--bg-2)', padding: '2px 6px', border: '1px solid var(--line)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
        {valueLabel && <div style={{ marginTop: 2, fontSize: 12, color: 'var(--ink-3)' }}>{valueLabel}</div>}
        {bar != null && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 0, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, bar))}%`, height: '100%', background: bar >= 80 ? 'var(--pos)' : bar >= 60 ? 'var(--warn)' : 'var(--neg)' }} />
            </div>
            {median != null && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--mute)' }}>
                Mediana câmara: {medianLabel ?? `${median}%`}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export function PerfilApp({
  politico,
  votacoes,
  votacoesRecentes = [],
  gastos,
  presenca,
  proposicoes = [],
  emendas = [],
  historicoPartidario = [],
  agenda = [],
  doadoresEleitorais = [],
  kpis,
  initialTab,
  timelineActive = false,
  feedEventos = [],
  expliqueVotacaoActive = false,
}: Props) {
  const tabMap: Record<string, Tab> = {
    'visao-geral': 'Visão geral',
    'votacoes': 'Votações',
    'gastos': 'Gastos',
    'presenca': 'Presença',
    'projetos': 'Projetos de Lei',
    'emendas': 'Emendas',
    'noticias': 'Notícias',
    'linha-do-tempo': 'Linha do Tempo',
    'historico': 'Histórico',
    'fontes': 'Fontes',
  }
  const defaultTab = (initialTab && tabMap[initialTab.toLowerCase()]) || (initialTab as Tab) || 'Visão geral'
  const [tab, setTab] = useState<Tab>(
    TABS.some((candidate) => candidate === defaultTab) ? defaultTab as Tab : 'Visão geral'
  )
  
  const tabs = useMemo<Tab[]>(() => {
    return [
      'Visão geral',
      'Votações',
      'Gastos',
      'Presença',
      'Projetos de Lei',
      'Emendas',
      'Notícias',
      ...(timelineActive ? ['Linha do Tempo' as Tab] : []),
      'Histórico',
      'Fontes'
    ]
  }, [timelineActive])

  const [mode, setMode] = useState<'analista' | 'cidadao' | 'v3'>('v3')

  const [seguindoStatus, setSeguindoStatus] = useState<{ seguindo: boolean; tipo: 'voto' | 'seguir' | null }>({
    seguindo: false,
    tipo: null,
  })
  const [loadingSeguimento, setLoadingSeguimento] = useState(true)

  useEffect(() => {
    fetch('/api/acompanhamentos')
      .then((res) => res.json())
      .then((data) => {
        const item = (data.acompanhamentos as AcompanhamentoItem[] | undefined)
          ?.find((acompanhamento) => acompanhamento.politico_id === politico.id)
        if (item) {
          setSeguindoStatus({ seguindo: true, tipo: item.tipo })
        }
        setLoadingSeguimento(false)
      })
      .catch(() => {
        setLoadingSeguimento(false)
      })
  }, [politico.id])

  const handleAcompanhar = async (tipo: 'voto' | 'seguir') => {
    try {
      setLoadingSeguimento(true)
      const res = await fetch('/api/acompanhamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ politico_id: politico.id, tipo }),
      })
      if (res.ok) {
        setSeguindoStatus({ seguindo: true, tipo })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSeguimento(false)
    }
  }

  const handleDeixarDeSeguir = async () => {
    try {
      setLoadingSeguimento(true)
      const res = await fetch(`/api/acompanhamentos/${politico.id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setSeguindoStatus({ seguindo: false, tipo: null })
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoadingSeguimento(false)
    }
  }

  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const partidoSigla = politico.partidos?.sigla?.toUpperCase() ?? '–'
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replaceAll('_', ' ')
  const mandatoInfo = yearsInOffice(politico.mandato_inicio)
  const classeFoto = classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })

  const tetoUf = CEAP_TETO_UF[politico.uf ?? ''] ?? null
  const hasPresencaPoliticoAno = kpis.has_presenca_ano && kpis.presenca_total_sessoes > 0
  const hasVotacoesPoliticoAno = kpis.has_votacoes_ano && kpis.total_votacoes > 0
  const hasGastosPoliticoAno = kpis.has_gastos_ano && gastos.length > 0
  const hasEmendasPoliticoAno = kpis.has_emendas_ano && kpis.total_emendas > 0
  const hasProposicoesPoliticoAno = kpis.has_proposicoes_ano && kpis.total_proposicoes > 0
  const gastoPctTeto =
    hasGastosPoliticoAno && tetoUf != null && tetoUf > 0
      ? Math.max(0, Math.min(100, Math.round((kpis.gasto_total / tetoUf) * 100)))
      : null

  const presencaRows = presenca

  // Gastos mensais para sparkline e mini bars
  const gastosPorMes = gastos.reduce<Record<string, number>>((acc, g) => {
    const key = `${g.ano}-${String(g.mes).padStart(2, '0')}`
    acc[key] = (acc[key] ?? 0) + g.valor
    return acc
  }, {})
  const gastosMesesOrdenados = Object.entries(gastosPorMes).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  const gastosSparkData = gastosMesesOrdenados.map(([, v]) => v)

  // Gastos por categoria
  const gastosPorCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    const cat = g.categoria ?? 'Outros'
    acc[cat] = (acc[cat] ?? 0) + g.valor
    return acc
  }, {})
  const gastosCategoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCategoria = gastosCategoriasOrdenadas[0]?.[1] ?? 1

  // Presença sparkline
  const presencaOrdenada = [...presencaRows]
    .filter((p) => p.mes != null)
    .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : (a.mes ?? 0) - (b.mes ?? 0))
  const presencaSparkData = presencaOrdenada.map((p) => p.percentual)

  const contatoEmail = politico.gabinete_email ?? politico.email
  const telefoneGabinete = formatGabinetePhone(politico.gabinete_telefone)
  const gabineteNome = politico.gabinete_nome ? `Gab. ${politico.gabinete_nome}` : null
  const redesComUrl = (politico.redes_sociais ?? []).filter((item) => item.url)
  const votacoesRecentesRows = votacoesRecentes.length > 0 ? votacoesRecentes : votacoes
  const historicoPartidarioRows =
    historicoPartidario.length > 0
      ? historicoPartidario
      : politico.partidos?.sigla
      ? [{
          partido_sigla: politico.partidos.sigla,
          partido_nome: politico.partidos.nome,
          partido_cor: null,
          inicio: politico.mandato_inicio,
          fim: politico.mandato_fim,
          motivo: 'partido atual',
          atual: true,
        }]
      : []

  const atualizadoEm = politico.collected_at
    ? new Date(politico.collected_at).toLocaleDateString('pt-BR')
    : '–'

  // ── render ─────────────────────────────────────────────────────────────────

  const bannerImg =
    politico.cargo === 'senador'
      ? 'https://upload.wikimedia.org/wikipedia/commons/4/47/Plen%C3%A1rio_do_Senado_%2843010124995%29.jpg'
      : politico.cargo === 'deputado_federal'
      ? 'https://upload.wikimedia.org/wikipedia/commons/f/f7/Plen%C3%A1rioCamaradeputados.jpg'
      : null

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', paddingTop: 0 }}>

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--line)',
          background: 'linear-gradient(160deg, #071630 0%, #0d2b6b 100%)',
          boxShadow: '0 18px 60px rgba(0,0,0,0.28)',
          margin: 0,
        }}
      >
        {bannerImg && (
          <Image
            src={bannerImg}
            alt=""
            aria-hidden
            fill
            unoptimized
            sizes="100vw"
            style={{
              objectFit: 'cover',
              objectPosition: 'center 35%',
              opacity: 0.18,
              filter: 'blur(2px)',
            }}
          />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(15,23,42,0.4) 0%, rgba(15,23,42,0.85) 100%)', zIndex: 1 }} />

        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1320, margin: '0 auto', padding: '28px 24px 20px' }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Foto */}
            <div
              style={{
                width: 120,
                height: 150,
                flexShrink: 0,
                background: 'var(--brand-soft)',
                border: '1px solid var(--line)',
                borderRadius: 8,
                overflow: 'hidden',
                position: 'relative',
                boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              }}
            >
              {politico.foto_url ? (
                <Image
                  src={politico.foto_url}
                  alt={`Foto de ${nomeExibicao}`}
                  fill
                  className={`object-cover ${classeFoto}`}
                  unoptimized
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    fontWeight: 700,
                    color: 'var(--brand)',
                  }}
                >
                  {initials(nomeExibicao)}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div style={{ flex: 1, minWidth: 260 }}>
              {/* Badges topo */}
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
                <span
                  className="mono"
                  style={{
                    ...heroBadgeBase,
                    background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
                    color: 'var(--ink)',
                    border: '1px solid rgba(255,255,255,0.18)',
                  }}
                >
                  {cargoNome.toUpperCase()}
                </span>
                <span
                  className="mono"
                  style={{
                    ...heroBadgeBase,
                    background: 'rgba(15, 23, 42, 0.62)',
                    color: 'var(--ink-2)',
                  }}
                >
                  {partidoSigla} · {politico.uf ?? '–'}
                </span>
                <span
                  className="mono"
                  style={{
                    ...heroBadgeBase,
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.55)',
                    color: 'var(--pos)',
                  }}
                >
                  <StatusDot tone="live" /> EM MANDATO
                </span>
              </div>

              {/* Nome */}
              <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink)' }}>
                {nomeExibicao}
              </h1>
              <div className="mono" style={{ marginTop: 6, fontSize: 12, color: 'var(--mute)', letterSpacing: '0.04em' }}>
                /{politico.slug}
              </div>

              {/* Sub-info */}
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-3)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                <span>Mandato desde {mandatoInfo.year !== NA ? mandatoInfo.year : '–'}</span>
                <span>·</span>
                <span>Comissões — em breve</span>
              </div>

              {/* Dados de mandato */}
              <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(128px, 1fr))', gap: 10, maxWidth: 760 }}>
                {[
                  { label: 'MANDATO', value: mandatoInfo.label !== NA ? mandatoInfo.label : '–' },
                  { label: 'ELEITO COM', value: politico.partidos?.numero != null ? String(politico.partidos.numero) : '–' },
                  { label: 'CARGO', value: cargoNome },
                  { label: 'ESCOLARIDADE', value: politico.escolaridade ?? '–' },
                  { label: 'CPF', value: maskCpf(politico.cpf) },
                ].map(({ label, value }) => (
                  <div
                    key={label}
                    style={{
                      minHeight: 58,
                      background: 'rgba(15, 23, 42, 0.58)',
                      border: '1px solid rgba(148, 163, 184, 0.28)',
                      borderRadius: 12,
                      padding: '10px 12px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04), 0 10px 24px rgba(0,0,0,0.16)',
                      backdropFilter: 'blur(12px)',
                      WebkitBackdropFilter: 'blur(12px)',
                    }}
                  >
                    <div className="mono" style={{ fontSize: 9, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>{label}</div>
                    <div style={{ marginTop: 5, fontSize: 12.5, fontWeight: 750, color: 'var(--ink)', lineHeight: 1.25, wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Ações */}
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                {loadingSeguimento ? (
                  <button
                    disabled
                    aria-label="Carregando acompanhamento"
                    title="Carregando acompanhamento"
                    style={{ ...heroIconButtonBase, cursor: 'default', color: 'var(--mute)' }}
                  >
                    <Loader2 size={17} aria-hidden="true" />
                  </button>
                ) : !seguindoStatus.seguindo ? (
                  <div style={{ display: 'inline-flex', gap: 6 }}>
                    <button
                      onClick={() => handleAcompanhar('voto')}
                      aria-label="Meu voto"
                      title="Marcar este político como um dos candidatos que você votou para acompanhar o desempenho"
                      style={{ ...heroIconButtonBase, background: 'linear-gradient(135deg, #FFB020 0%, #FF8A00 100%)', color: '#111827', border: '1px solid rgba(255, 176, 32, 0.55)', cursor: 'pointer' }}
                    >
                      <Star size={18} fill="currentColor" aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleAcompanhar('seguir')}
                      aria-label="Monitorar político"
                      title="Monitorar este político (receber novidades sem vinculá-lo como seu voto eleito)"
                      style={{ ...heroIconButtonBase, background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)', color: 'var(--ink)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer' }}
                    >
                      <Bell size={18} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {seguindoStatus.tipo === 'voto' ? (
                      <span
                        aria-label="Meu voto cadastrado"
                        title="Meu voto cadastrado"
                        style={{ ...heroIconButtonBase, background: 'rgba(255, 176, 32, 0.16)', color: '#FFB020', border: '1px solid rgba(255, 176, 32, 0.55)', cursor: 'default' }}
                      >
                        <Star size={18} fill="currentColor" aria-hidden="true" />
                      </span>
                    ) : (
                      <span
                        aria-label="Monitorando"
                        title="Monitorando"
                        style={{ ...heroIconButtonBase, background: 'var(--brand-soft)', color: 'var(--brand-2)', border: '1px solid rgba(139, 92, 246, 0.55)', cursor: 'default' }}
                      >
                        <Bell size={18} aria-hidden="true" />
                      </span>
                    )}
                    <button
                      onClick={handleDeixarDeSeguir}
                      aria-label="Remover acompanhamento"
                      title="Deixar de seguir / monitorar este político"
                      style={{ ...heroIconButtonBase, color: 'var(--neg)', border: '1px solid rgba(239, 68, 68, 0.5)', cursor: 'pointer' }}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                    <button
                      onClick={() => handleAcompanhar(seguindoStatus.tipo === 'voto' ? 'seguir' : 'voto')}
                      aria-label={`Mudar para ${seguindoStatus.tipo === 'voto' ? 'monitorar' : 'meu voto'}`}
                      title={`Mudar para ${seguindoStatus.tipo === 'voto' ? 'monitorar' : 'meu voto'}`}
                      style={{ ...heroIconButtonBase, cursor: 'pointer' }}
                    >
                      {seguindoStatus.tipo === 'voto' ? <Bell size={18} aria-hidden="true" /> : <Star size={18} aria-hidden="true" />}
                    </button>
                  </div>
                )}
                <a
                  href={`/comparar?slugs=${politico.slug}`}
                  aria-label="Comparar político"
                  title="Comparar político"
                  style={{ ...heroIconButtonBase, cursor: 'pointer', textDecoration: 'none' }}
                >
                  <Scale size={18} aria-hidden="true" />
                </a>
                <ShareButton
                  nomeEleitoral={nomeExibicao}
                  slug={politico.slug}
                  cargo={politico.cargo}
                  uf={politico.uf ?? null}
                  gastoCeap={kpis.gasto_total}
                  presencaPct={kpis.presenca_pct}
                  partidoSigla={politico.partidos?.sigla ?? null}
                />
                <a
                  href={`/api/politico/${politico.id}/export.json`}
                  aria-label="Exportar JSON"
                  title="Exportar JSON"
                  style={{ ...heroIconButtonBase, cursor: 'pointer', textDecoration: 'none' }}
                >
                  <Download size={18} aria-hidden="true" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ position: 'relative', zIndex: 2, maxWidth: 1320, margin: '0 auto', padding: '12px 24px 18px', display: 'flex', gap: 10, overflowX: 'auto' }} className="custom-scrollbar">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '9px 17px',
                background: tab === t ? 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)' : 'rgba(15,23,42,0.72)',
                border: tab === t ? '1px solid rgba(255,255,255,0.24)' : '1px solid rgba(148,163,184,0.28)',
                borderRadius: 999,
                color: tab === t ? 'var(--ink)' : 'rgba(248,250,252,0.82)',
                fontSize: 12.5,
                fontWeight: 700,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                boxShadow: tab === t ? '0 10px 28px rgba(99,102,241,0.24)' : 'none',
              }}
              className="hover:border-[rgba(248,250,252,0.42)] hover:bg-[rgba(30,41,59,0.9)] hover:text-[var(--ink)]"
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* ── MODE BAR ── */}
      <ModeBar mode={mode} setMode={setMode} atualizadoEm={atualizadoEm} />

      {mode === 'v3' ? (
        <ModoV3
          politico={politico}
          votacoes={votacoes}
          votacoesRecentes={votacoesRecentes}
          gastos={gastos}
          presenca={presenca}
          proposicoes={proposicoes}
          emendas={emendas}
          historicoPartidario={historicoPartidario}
          agenda={agenda}
          doadoresEleitorais={doadoresEleitorais}
          kpis={kpis}
          atualizadoEm={atualizadoEm}
          seguindoStatus={seguindoStatus}
          loadingSeguimento={loadingSeguimento}
          handleAcompanhar={handleAcompanhar}
          handleDeixarDeSeguir={handleDeixarDeSeguir}
          tab={tab}
          setTab={setTab}
          timelineActive={timelineActive}
          feedEventos={feedEventos}
        />
      ) : mode === 'cidadao' ? (
        <ModoCidadao politico={{
          ...politico,
          uf_nascimento: politico.uf_nascimento ?? null,
          sexo: politico.sexo ?? null,
          partidos: politico.partidos ?? null,
          redes_sociais: politico.redes_sociais ?? [],
        }} />
      ) : (
      <>

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 24 }}>
          <KpiCard
            label={`PRESENÇA ${kpis.ano}`}
            value={hasPresencaPoliticoAno && kpis.presenca_pct != null ? `${Math.round(kpis.presenca_pct)}%` : '–'}
            sub={!kpis.has_presenca_ano ? `base ${kpis.ano} não coletada` : hasPresencaPoliticoAno ? `${kpis.presenca_total_presencas}/${kpis.presenca_total_sessoes} sessões` : `sem registros em ${kpis.ano}`}
            sparkData={presencaSparkData.length > 1 ? presencaSparkData : undefined}
          />
          <KpiCard
            label={`VOTAÇÕES ${kpis.ano}`}
            value={hasVotacoesPoliticoAno ? formatOptionalNumber(kpis.total_votacoes) : '–'}
            sub={!kpis.has_votacoes_ano ? `base ${kpis.ano} não coletada` : hasVotacoesPoliticoAno ? `nominais em ${kpis.ano}` : `sem registros em ${kpis.ano}`}
          />
          <KpiCard
            label={`GASTOS ${kpis.ano}`}
            value={hasGastosPoliticoAno ? formatCurrency(kpis.gasto_total) : '–'}
            sub={!kpis.has_gastos_ano ? `base ${kpis.ano} não coletada` : hasGastosPoliticoAno && kpis.gasto_ultimo_mes != null ? `último mês: ${formatCurrency(kpis.gasto_ultimo_mes)}` : `sem registros em ${kpis.ano}`}
            sparkData={gastosSparkData.length > 1 ? gastosSparkData : undefined}
          />
          <KpiCard
            label={`EMENDAS ${kpis.ano}`}
            value={hasEmendasPoliticoAno ? formatOptionalNumber(kpis.total_emendas) : '–'}
            sub={!kpis.has_emendas_ano ? `base ${kpis.ano} não coletada` : hasEmendasPoliticoAno ? `emendas destinadas em ${kpis.ano}` : `sem registros em ${kpis.ano}`}
          />
          <KpiCard
            label={`PROPOSIÇÕES ${kpis.ano}`}
            value={hasProposicoesPoliticoAno ? formatOptionalNumber(kpis.total_proposicoes) : '–'}
            sub={!kpis.has_proposicoes_ano ? `base ${kpis.ano} não coletada` : hasProposicoesPoliticoAno ? `autorias em ${kpis.ano}` : `sem registros em ${kpis.ano}`}
          />
        </div>

        {/* ── RADAR DE DESEMPENHO ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          <RadarCard
            label={`PRESENÇA ${kpis.ano}`}
            value={hasPresencaPoliticoAno && kpis.presenca_pct != null ? `${Math.round(kpis.presenca_pct)}%` : '–'}
            valueLabel={!kpis.has_presenca_ano ? `base ${kpis.ano} não coletada` : hasPresencaPoliticoAno ? `das sessões em ${kpis.ano}` : `sem registros em ${kpis.ano}`}
            bar={hasPresencaPoliticoAno ? kpis.presenca_pct : null}
          />
          <RadarCard
            label={`ATIVIDADE LES ${kpis.ano}`}
            value="–"
            valueLabel="sem métrica calculada"
            badge="PENDENTE"
          />
          <RadarCard
            label={`COERÊNCIA AI ${kpis.ano}`}
            value="–"
            valueLabel="sem métrica calculada"
            badge="PENDENTE"
          />
          <RadarCard
            label={`EFICIÊNCIA GASTOS ${kpis.ano}`}
            value={gastoPctTeto != null ? `${gastoPctTeto}%` : '–'}
            valueLabel={!kpis.has_gastos_ano ? `base ${kpis.ano} não coletada` : gastoPctTeto != null ? `do teto ${politico.uf ?? ''}` : `sem registros em ${kpis.ano}`}
            bar={gastoPctTeto}
          />
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 items-start w-full">

          {/* ── COLUNA ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* TAB: Visão Geral */}
            {tab === 'Visão geral' && (
              <>
                {/* IA Pergunta Card */}
                <IAPerguntaPolitico politicoId={politico.id} nomePolitico={nomeExibicao} />

                {/* VOTAÇÕES RECENTES */}
                <Panel>
                  <PanelHeader
                    title="VOTAÇÕES RECENTES"
                    sub={`${votacoesRecentesRows.length} últimas registradas`}
                    source="Câmara"
                  />
                  <div style={{ padding: '0 0 4px' }}>
                    {votacoesRecentesRows.length === 0 ? (
                      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                        <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>SEM VOTAÇÕES REGISTRADAS</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'var(--bg-2)' }}>
                            {['DATA', 'MATÉRIA', 'VOTO'].map((h) => (
                              <th key={h} className="mono" style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {votacoesRecentesRows.slice(0, 5).map((v, i) => (
                            <tr key={v.id} style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? 'var(--panel)' : 'var(--bg)' }}>
                              <td className="mono" style={{ padding: '9px 12px', color: 'var(--mute)', fontSize: 11, whiteSpace: 'nowrap' }}>
                                {formatDateOnly(v.data, '2-digit')}
                              </td>
                              <td style={{ padding: '9px 12px', color: 'var(--ink-2)', lineHeight: 1.4, maxWidth: 280 }}>
                                <div>{v.proposicao ?? '–'}</div>
                                {expliqueVotacaoActive && v.descricao_simples && (
                                  <details style={{ marginTop: 4, cursor: 'pointer' }}>
                                    <summary style={{ fontSize: 10, color: 'var(--brand-2)', fontWeight: 700, userSelect: 'none' }}>
                                      ✨ Explicar Lei (IA)
                                    </summary>
                                    <div style={{
                                      marginTop: 4, padding: '8px 10px', borderRadius: 6,
                                      background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                                      color: 'var(--ink-3)', fontSize: 11.5, lineHeight: 1.4,
                                    }}>
                                      {v.descricao_simples}
                                    </div>
                                  </details>
                                )}
                              </td>
                              <td style={{ padding: '9px 12px' }}>
                                <VoteChip vote={votoToChip(v.voto)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Panel>

                {/* GASTOS RESUMO */}
                <Panel>
                  <PanelHeader title="GASTOS · RESUMO" source="Portal Transparência" />
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--ink-3)' }}>
                      <span>Usado em {kpis.ano}: <strong style={{ color: 'var(--ink)' }}>{formatCurrency(kpis.gasto_total)}</strong></span>
                      <span>Teto {politico.uf ?? '–'}: {tetoUf != null ? formatCurrency(tetoUf) : '–'}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${gastoPctTeto ?? 0}%`, height: '100%', background: 'var(--brand-2)' }} />
                    </div>
                  </div>
                </Panel>
              </>
            )}

            {/* TAB: Votações (Completo) */}
            {tab === 'Votações' && (
              <Panel>
                <PanelHeader
                  title="HISTÓRICO COMPLETO DE VOTAÇÕES"
                  sub={`${votacoes.length} registradas`}
                  source="Câmara"
                />
                <div style={{ padding: '0 0 4px' }}>
                  {votacoes.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">SEM VOTAÇÕES REGISTRADAS</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'var(--bg-2)' }}>
                          {['DATA', 'MATÉRIA', 'VOTO'].map((h) => (
                            <th key={h} className="mono" style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {votacoes.map((v, i) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? 'var(--panel)' : 'var(--bg)' }}>
                            <td className="mono" style={{ padding: '9px 12px', color: 'var(--mute)', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {formatDateOnly(v.data)}
                            </td>
                            <td style={{ padding: '9px 12px', color: 'var(--ink-2)', lineHeight: 1.4 }}>
                              <div>{v.proposicao ?? '–'}</div>
                              {expliqueVotacaoActive && v.descricao_simples && (
                                <details style={{ marginTop: 4, cursor: 'pointer' }}>
                                  <summary style={{ fontSize: 10, color: 'var(--brand-2)', fontWeight: 700, userSelect: 'none' }}>
                                    ✨ Explicar Lei (IA)
                                  </summary>
                                  <div style={{
                                    marginTop: 4, padding: '8px 10px', borderRadius: 6,
                                    background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                                    color: 'var(--ink-3)', fontSize: 11.5, lineHeight: 1.4,
                                  }}>
                                    {v.descricao_simples}
                                  </div>
                                </details>
                              )}
                            </td>
                            <td style={{ padding: '9px 12px' }}>
                              <VoteChip vote={votoToChip(v.voto)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </Panel>
            )}

            {/* TAB: Gastos (Completo) */}
            {tab === 'Gastos' && (
              <Panel>
                <PanelHeader title={<>GASTOS DETALHADOS · <GlossaryTooltip term="CEAP">CEAP</GlossaryTooltip> {kpis.ano}</>} source="Portal Transparência" />
                <div style={{ padding: '16px 20px' }}>
                  {/* Barra de teto UF */}
                  <div style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--ink-3)' }}>
                      <span>Usado em {kpis.ano}: <strong style={{ color: 'var(--ink)' }}>{formatCurrency(kpis.gasto_total)}</strong></span>
                      <span>Teto {politico.uf ?? '–'}: {tetoUf != null ? formatCurrency(tetoUf) : '–'}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-2)', overflow: 'hidden' }}>
                      <div style={{ width: `${gastoPctTeto ?? 0}%`, height: '100%', background: 'var(--brand-2)' }} />
                    </div>
                    {gastoPctTeto != null && (
                      <div className="mono" style={{ marginTop: 4, fontSize: 10, color: 'var(--mute)' }}>{gastoPctTeto}% do teto anual de {kpis.ano}</div>
                    )}
                  </div>

                  {/* Mini barras mensais */}
                  {gastosMesesOrdenados.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 8 }}>GASTOS MENSAIS</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
                        {gastosMesesOrdenados.map(([mes, val]) => {
                          const maxVal = Math.max(...gastosMesesOrdenados.map(([, v]) => v))
                          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                          const [, m] = mes.split('-')
                          const mLabel = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][parseInt(m, 10) - 1] ?? m
                          return (
                            <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <div style={{ width: '100%', height: `${Math.max(4, pct * 0.4)}px`, background: 'var(--brand-2)', minHeight: 4 }} />
                              <span className="mono" style={{ fontSize: 8, color: 'var(--mute)' }}>{mLabel}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Donut + BarList por categoria */}
                  {gastosCategoriasOrdenadas.length > 0 && (
                    <div>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 10 }}>POR CATEGORIA</div>
                      <GastosDonut categorias={gastosCategoriasOrdenadas} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {gastosCategoriasOrdenadas.map(([cat, val]) => (
                          <div key={cat} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 3, lineHeight: 1.2 }}>{cat}</div>
                              <div style={{ height: 4, background: 'var(--bg-2)', overflow: 'hidden' }}>
                                <div style={{ width: `${(val / maxCategoria) * 100}%`, height: '100%', background: 'var(--brand-soft)' }} />
                              </div>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{formatCurrency(val)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* TAB: Presença */}
            {tab === 'Presença' && (
              <Panel>
                <PanelHeader title="PRESENÇA HISTÓRICA NAS SESSÕES" source="Câmara" />
                <div style={{ padding: '16px 20px' }}>
                  {presencaRows.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">DADOS SENDO COLETADOS</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {presencaOrdenada.map((p) => {
                        const mesNome = p.mes != null
                          ? new Date(p.ano, p.mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                          : String(p.ano)
                        const pct = Math.max(0, Math.min(100, Math.round(p.percentual)))
                        return (
                          <div key={`${p.ano}-${p.mes}`} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 40px', gap: 8, alignItems: 'center' }}>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{mesNome}</span>
                            <div style={{ height: 6, background: 'var(--bg-2)', overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--pos)' : pct >= 60 ? 'var(--warn)' : 'var(--neg)' }} />
                            </div>
                            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', textAlign: 'right' }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* TAB: Projetos de Lei */}
            {tab === 'Projetos de Lei' && (
              <Panel>
                <PanelHeader title={`PROJETOS DE LEI AUTORADOS (${proposicoes.length})`} source="Câmara" />
                <div style={{ padding: '16px' }} className="flex flex-col gap-3">
                  {proposicoes.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">NENHUM PROJETO DE LEI DE AUTORIA DESTE PARLAMENTAR ENCONTRADO.</p>
                  ) : (
                    proposicoes.map((p) => (
                      <Link key={p.id} href={`/projetos/${p.slug}`} className="block bg-[#0F172A] hover:bg-[#0F172A]/80 border border-[#334155] hover:border-[#6366F1] rounded-lg p-3 transition-colors text-decoration-none">
                        <div className="flex justify-between items-start gap-2 mb-1.5">
                          <span className="font-mono text-xs text-[#8B5CF6] font-bold">{p.tipo} {p.numero}/{p.ano}</span>
                          <span className="text-[10px] bg-[#1E293B] text-[#94A3B8] border border-[#334155] px-2 py-0.5 rounded font-bold uppercase tracking-wider">{p.situacao ?? 'Em tramitação'}</span>
                        </div>
                        <p className="text-xs text-white font-semibold line-clamp-2 leading-relaxed">{p.ementa}</p>
                      </Link>
                    ))
                  )}
                </div>
              </Panel>
            )}

            {/* TAB: Emendas */}
            {tab === 'Emendas' && (
              <Panel>
                <PanelHeader title={`EMENDAS PARLAMENTARES DESTINADAS (${emendas.length})`} source="Portal da Transparência" />
                <div style={{ padding: '16px' }} className="flex flex-col gap-3">
                  {emendas.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">NENHUMA EMENDA ENCONTRADA PARA ESTE PARLAMENTAR.</p>
                  ) : (
                    emendas.map((e) => (
                      <div key={e.id} className="block bg-[#0F172A] border border-[#334155] rounded-lg p-3">
                        <div className="flex justify-between items-center mb-1.5">
                          <span className="font-mono text-xs text-[#10B981] font-bold">R$ {Number(e.valor_pago || e.valor).toLocaleString('pt-BR')}</span>
                          <span className="text-[10px] bg-[#1E293B] text-[#94A3B8] border border-[#334155] px-2 py-0.5 rounded font-mono">{e.ano}</span>
                        </div>
                        <div className="text-xs space-y-1 text-[#CBD5E1]">
                          <div><span className="text-[#64748B] font-medium">Destino:</span> {e.municipio_nome ?? 'Geral'} - {e.uf_municipio ?? 'UF'}</div>
                          <div><span className="text-[#64748B] font-medium">Área / Função:</span> {e.funcao ?? 'Saúde/Educação'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Panel>
            )}

            {/* TAB: Notícias */}
            {tab === 'Notícias' && (
              <Panel>
                <PanelHeader title="NOTÍCIAS RELACIONADAS" action={<span className="bg-[#4C1D95]/40 text-[#A78BFA] border border-[#4C1D95] text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest">collecting</span>} />
                <div style={{ padding: '24px' }} className="space-y-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span className="text-xs text-[#34D399] font-mono">Buscando notícias sobre {nomeExibicao}...</span>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="border-b border-[#334155]/60 pb-3 flex flex-col gap-2">
                      <div className="h-4 bg-[#0F172A] rounded w-1/3" />
                      <div className="h-3.5 w-full rounded bg-[rgba(15,23,42,0.6)]" />
                      <div className="h-3.5 w-5/6 rounded bg-[rgba(15,23,42,0.6)]" />
                    </div>
                  ))}
                </div>
              </Panel>
            )}

            {/* TAB: Histórico */}
            {tab === 'Histórico' && (
              <PlaceholderPanel title="HISTÓRICO PARTIDÁRIO" badge="TSE" message="DADOS TSE EM BREVE" />
            )}

            {/* TAB: Linha do Tempo */}
            {tab === 'Linha do Tempo' && (
              <Panel>
                <PanelHeader title="LINHA DO TEMPO CRONOLÓGICA" source="Feed de Acontecimentos" />
                <div style={{ padding: '24px 20px' }}>
                  {feedEventos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                      <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em', margin: 0 }}>
                        Aguardando a coleta de acontecimentos e marcos relevantes para o feed cronológico.
                      </p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: 24, margin: '12px 0' }}>
                      {/* Linha vertical conectora */}
                      <div style={{ position: 'absolute', left: 9, top: 4, bottom: 4, width: 2, background: 'var(--line)' }} />

                      {feedEventos.map((evt, idx) => {
                        const dateFmt = evt.data ? new Date(evt.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                        const impacto = Number(evt.impacto_nivel || 1)
                        const impColor = impacto === 4 ? 'var(--neg)' : impacto === 3 ? 'var(--warn)' : impacto === 2 ? 'var(--info)' : 'var(--brand-2)'
                        const impLabel = impacto === 4 ? 'Crítico' : impacto === 3 ? 'Alto' : impacto === 2 ? 'Médio' : 'Baixo'

                        return (
                          <div key={evt.id || idx} style={{ position: 'relative', marginBottom: idx === feedEventos.length - 1 ? 0 : 28 }}>
                            {/* Círculo do evento com cor baseada no impacto */}
                            <div style={{
                              position: 'absolute', left: -20, top: 4,
                              width: 12, height: 12, borderRadius: '50%',
                              background: impColor, border: '3px solid var(--bg)',
                              boxShadow: `0 0 0 1px ${impColor}44`,
                              zIndex: 2
                            }} />

                            <div style={{ background: 'var(--bg-2)', border: '1px solid var(--line)', borderRadius: 10, padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                                <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--ink-3)' }}>{dateFmt}</span>
                                <span style={{
                                  fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 4,
                                  background: `${impColor}15`, color: impColor, border: `1px solid ${impColor}33`,
                                  letterSpacing: '0.04em', textTransform: 'uppercase'
                                }}>
                                  Impacto {impLabel}
                                </span>
                              </div>
                              <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 700, color: 'var(--ink)' }}>{evt.titulo}</h4>
                              <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                                {evt.descricao_simples ?? evt.descricao}
                              </p>
                              {evt.link_fonte && (
                                <a href={evt.link_fonte} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}>
                                  Ver fonte original ↗
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Panel>
            )}

            {/* TAB: Fontes */}
            {tab === 'Fontes' && (
              <Panel>
                <PanelHeader title="FONTES UTILIZADAS E CRÉDITOS" />
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Os dados exibidos nesta plataforma são extraídos diretamente de fontes públicas e oficiais do governo federal brasileiro. O Meus Políticos realiza a consolidação e simplificação didática desses dados sem qualquer afiliação partidária ou alteração dos registros oficiais.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { name: 'Câmara dos Deputados (Dados Abertos API v2)', url: 'https://dadosabertos.camara.leg.br/' },
                      { name: 'Senado Federal (API de Dados Abertos)', url: 'https://www12.senado.leg.br/dados-abertos' },
                      { name: 'Portal da Transparência (CGU)', url: 'https://portaldatransparencia.gov.br/' },
                      { name: 'TSE (Divulgação de Candidaturas e Contas Eleitorais)', url: 'https://divulgacandcontas.tse.jus.br/' },
                    ].map((f) => (
                      <a key={f.name} href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--brand-2)', textDecoration: 'none' }}>
                        🔗 {f.name} ↗
                      </a>
                    ))}
                  </div>
                </div>
              </Panel>
            )}

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* CONTATO DO GABINETE */}
            <Panel>
              <PanelHeader title="CONTATO DO GABINETE" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '✉', label: 'Email', value: contatoEmail, href: contatoEmail && contatoEmail !== NA ? `mailto:${contatoEmail}` : null },
                  { icon: '☎', label: 'Telefone', value: telefoneGabinete, href: null },
                  { icon: '⌂', label: 'Gabinete', value: gabineteNome ? `${gabineteNome} — Câmara dos Dep., Brasília/DF` : NA, href: null },
                ].map(({ icon, label, value, href }) => (
                  <div key={label}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--mute)', marginBottom: 2 }}>{icon} {label.toUpperCase()}</div>
                    {href ? (
                      <a href={href} style={{ fontSize: 12, color: 'var(--brand-2)', textDecoration: 'none', wordBreak: 'break-word' }}>{value}</a>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', wordBreak: 'break-word' }}>{value ?? NA}</div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* REDES SOCIAIS */}
            <Panel>
              <PanelHeader title="REDES SOCIAIS" />
              <div style={{ padding: '14px 16px' }}>
                {redesComUrl.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--mute)' }}>Sem redes cadastradas</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {redesComUrl.map((rede) => {
                      const platform = normalizePlatform(rede.plataforma)
                      const visual = socialVisual(platform)
                      return (
                        <a
                          key={`${rede.plataforma}-${rede.url}`}
                          href={rede.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 12px',
                            background: visual.bg,
                            color: visual.color,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <span>{visual.icon}</span>
                          <span>{visual.label}</span>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </Panel>

            {/* HISTÓRICO PARTIDÁRIO */}
            <Panel>
              <PanelHeader title="HISTÓRICO PARTIDÁRIO" source="TSE" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historicoPartidarioRows.length === 0 ? (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>SEM HISTÓRICO PARTIDÁRIO REGISTRADO</p>
                ) : (
                  historicoPartidarioRows.map((item, index) => (
                    <div
                      key={`${item.partido_sigla}-${item.inicio}-${index}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: 10,
                        alignItems: 'center',
                        padding: '9px 10px',
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        background: 'rgba(15,23,42,0.48)',
                      }}
                    >
                      <span style={{ width: 9, height: 9, borderRadius: 999, background: item.partido_cor ?? 'var(--brand-2)' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--ink)' }}>{item.partido_sigla ?? 'Partido'}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.partido_nome ?? item.motivo ?? 'Filiação partidária'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono" style={{ fontSize: 9.5, color: item.atual ? 'var(--pos)' : 'var(--mute)', letterSpacing: '0.06em' }}>
                          {item.atual ? 'ATUAL' : 'ANTERIOR'}
                        </div>
                        <div className="mono" style={{ marginTop: 2, fontSize: 9.5, color: 'var(--ink-3)' }}>
                          {yearFromDateOnly(item.inicio)}
                          {item.fim ? `–${yearFromDateOnly(item.fim)}` : ''}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            {/* MAIORES DOADORES */}
            <Panel>
              <PanelHeader title="MAIORES DOADORES · 2022" source="TSE" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {doadoresEleitorais.length === 0 ? (
                  <>
                    <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>SEM DOADORES ELEITORAIS REGISTRADOS</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.45 }}>
                      A tabela eleitoral de doadores não está populada no banco atual.
                    </p>
                  </>
                ) : (
                  doadoresEleitorais.slice(0, 5).map((doador, index) => (
                    <div key={`${doador.nome}-${index}`} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doador.nome}</div>
                        <div className="mono" style={{ marginTop: 2, fontSize: 9.5, color: 'var(--mute)', letterSpacing: '0.06em' }}>{doador.tipo ?? 'DOAÇÃO'} {doador.ano ?? ''}</div>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 750, color: 'var(--ink)' }}>{formatCurrency(doador.valor)}</div>
                    </div>
                  ))
                )}
              </div>
            </Panel>

            {/* AGENDA */}
            <Panel>
              <PanelHeader title="AGENDA · PRÓX. SESSÕES" source={politico.cargo === 'senador' ? 'Senado' : politico.cargo === 'deputado_estadual' ? 'Assembleia' : 'Câmara'} />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                {agenda.length === 0 ? (
                  <>
                    <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>SEM SESSÕES FUTURAS REGISTRADAS</p>
                    <p style={{ margin: 0, fontSize: 11, color: 'var(--ink-3)', lineHeight: 1.45 }}>
                      Não há agenda futura na tabela de sessões para esta casa legislativa.
                    </p>
                  </>
                ) : (
                  agenda.map((sessao) => (
                    <a
                      key={sessao.id}
                      href={sessao.link ?? '#'}
                      target={sessao.link ? '_blank' : undefined}
                      rel={sessao.link ? 'noopener noreferrer' : undefined}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr',
                        gap: 10,
                        padding: '9px 10px',
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        background: 'rgba(15,23,42,0.48)',
                        color: 'inherit',
                        textDecoration: 'none',
                        pointerEvents: sessao.link ? 'auto' : 'none',
                      }}
                    >
                      <div className="mono" style={{ minWidth: 48, fontSize: 10, color: 'var(--brand-2)', letterSpacing: '0.04em' }}>
                        {formatDateOnly(sessao.data, '2-digit').slice(0, 5)}
                        {sessao.hora_inicio ? <div style={{ marginTop: 2, color: 'var(--mute)' }}>{sessao.hora_inicio.slice(0, 5)}</div> : null}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 650, color: 'var(--ink)', lineHeight: 1.3 }}>{sessao.titulo ?? sessao.tipo ?? 'Sessão'}</div>
                        <div style={{ marginTop: 3, fontSize: 11, color: 'var(--ink-3)' }}>{[sessao.fonte, sessao.situacao].filter(Boolean).join(' · ')}</div>
                      </div>
                    </a>
                  ))
                )}
              </div>
            </Panel>

            {/* FONTES */}
            <Panel>
              <PanelHeader title="FONTES UTILIZADAS" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Câmara dos Deputados', ok: true },
                  { name: 'TSE', ok: true },
                  { name: 'Portal Transparência', ok: true },
                  { name: 'IBGE', ok: true },
                ].map(({ name, ok }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{name}</span>
                    <span style={{ color: ok ? 'var(--pos)' : 'var(--mute)', fontWeight: 600 }}>{ok ? '✓' : '–'}</span>
                  </div>
                ))}
                <div className="mono" style={{ marginTop: 4, fontSize: 10, color: 'var(--mute)', letterSpacing: '0.04em' }}>
                  ATUALIZADO {atualizadoEm}
                </div>
              </div>
            </Panel>

          </div>
        </div>
      </div>
      </>
      )}
    </div>
  )
}

// ── ModeBar ───────────────────────────────────────────────────────────────────

function ModeBar({
  mode,
  setMode,
  atualizadoEm,
}: {
  mode: 'analista' | 'cidadao' | 'v3'
  setMode: (m: 'analista' | 'cidadao' | 'v3') => void
  atualizadoEm: string
}) {
  return (
    <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>VISUALIZAR COMO</span>
          <div style={{ display: 'inline-flex', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 999, padding: 3 }}>
            {([
              ['v3', '✨ V3 Premium', 'experiência imersiva'],
              ['analista', '⚙ Analista V2', 'dados completos'],
              ['cidadao', '🙂 Cidadão V2', 'linguagem direta'],
            ] as const).map(([id, label, sub]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: mode === id ? 'var(--ink)' : 'transparent',
                  color: mode === id ? 'var(--bg)' : 'var(--ink-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {label}
                <span className="mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.04em', fontWeight: 500 }}>
                  · {sub}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
          DADOS · ATUALIZADO {atualizadoEm} ·{' '}
          <a href="/metodologia" style={{ color: 'var(--brand-2)' }}>METODOLOGIA ↗</a>
        </div>
      </div>
    </div>
  )
}
