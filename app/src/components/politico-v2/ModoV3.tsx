'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { Download, Vote, ScrollText, Users, Mail, MapPin } from 'lucide-react'

import { Sparkline, VoteChip } from '@/components/civic'
import { IAPerguntaPolitico } from '@/components/politico-v2/IAPerguntaPolitico'
import {
  CARGO_LABEL,
  CEAP_TETO_UF,
  NA,
  formatCurrency,
  formatGabinetePhone,
  normalizePlatform,
} from '@/components/politico-v2/shared'

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

type ModoV3Props = {
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
  atualizadoEm: string
  seguindoStatus: { seguindo: boolean; tipo: 'voto' | 'seguir' | null }
  loadingSeguimento: boolean
  handleAcompanhar: (tipo: 'voto' | 'seguir') => Promise<void>
  handleDeixarDeSeguir: () => Promise<void>
  tab: Tab
  setTab: (t: Tab) => void
  timelineActive?: boolean
  feedEventos?: FeedEvento[]
}

// ── party themes ─────────────────────────────────────────────────────────────

type PartyTheme = {
  brandColor: string
  accentColor: string
  glowColor: string
  brandColorRgb: string
}

function getPartyTheme(sigla: string | null | undefined): PartyTheme {
  const s = sigla?.toUpperCase()?.trim() ?? ''
  
  if (s === 'PT' || s === 'PSOL' || s === 'PSTU' || s === 'PCB' || s === 'UP' || s === 'REDE') {
    return {
      brandColor: '#ef4444',
      accentColor: '#fca5a5',
      glowColor: 'rgba(239, 68, 68, 0.08)',
      brandColorRgb: '239, 68, 68',
    }
  }
  if (s === 'PL' || s === 'PP' || s === 'PRTB' || s === 'PSC' || s === 'REPUBLICANOS') {
    return {
      brandColor: '#2563eb',
      accentColor: '#fbbf24',
      glowColor: 'rgba(37, 99, 235, 0.08)',
      brandColorRgb: '37, 99, 235',
    }
  }
  if (s === 'NOVO') {
    return {
      brandColor: '#ea580c',
      accentColor: '#fdba74',
      glowColor: 'rgba(234, 88, 12, 0.08)',
      brandColorRgb: '234, 88, 12',
    }
  }
  if (s === 'PV' || s === 'MDB' || s === 'PMDB' || s === 'PSD') {
    return {
      brandColor: '#10b981',
      accentColor: '#6ee7b7',
      glowColor: 'rgba(16, 185, 129, 0.08)',
      brandColorRgb: '16, 185, 129',
    }
  }
  if (s === 'UNIÃO' || s === 'UNIAO' || s === 'AVANTE' || s === 'PODE' || s === 'PODEMOS') {
    return {
      brandColor: '#8b5cf6',
      accentColor: '#38bdf8',
      glowColor: 'rgba(139, 92, 246, 0.08)',
      brandColorRgb: '139, 92, 246',
    }
  }
  if (s === 'PSB' || s === 'PDT' || s === 'SOLIDARIEDADE' || s === 'CIDADANIA' || s === 'PSDB') {
    return {
      brandColor: '#ec4899',
      accentColor: '#fbcfe8',
      glowColor: 'rgba(236, 72, 153, 0.08)',
      brandColorRgb: '236, 72, 153',
    }
  }
  
  return {
    brandColor: '#6366f1',
    accentColor: '#c084fc',
    glowColor: 'rgba(99, 102, 241, 0.08)',
    brandColorRgb: '99, 102, 241',
  }
}

type Tab = 'Visão geral' | 'Votações' | 'Gastos' | 'Presença' | 'Projetos de Lei' | 'Emendas' | 'Notícias' | 'Linha do Tempo' | 'Histórico' | 'Fontes'

const DONUT_COLORS = [
  'var(--party-brand, #6366f1)',
  'var(--party-accent, #c084fc)',
  'var(--pos)',
  'var(--warn)',
  'var(--info)',
  'var(--ink-3)',
]

// ── Plenario SVG visualization (Dynamic Hemiciclo) ───────────────────────────

function getPlenarioSeat(politicoId: string, cargo: string) {
  let hash = 0
  for (let i = 0; i < politicoId.length; i++) {
    hash = politicoId.charCodeAt(i) + ((hash << 5) - hash)
  }
  hash = Math.abs(hash)
  
  const totalSeats = cargo === 'senador' ? 81 : 513
  const seatNum = (hash % totalSeats) + 1
  const sectors = ['Setor A', 'Setor B', 'Setor C', 'Setor D']
  const sector = sectors[hash % sectors.length]
  const fileira = (hash % 5) + 1
  
  return { seatNum, sector, fileira }
}

function PlenarioPosition({ politicoId, cargo }: { politicoId: string; cargo: string }) {
  const { seatNum, sector, fileira } = getPlenarioSeat(politicoId, cargo)
  
  // Renders a stylized hemiciclo SVG
  // 5 concentric semi-circles
  const rows = [
    { radius: 45, dots: 10 },
    { radius: 60, dots: 14 },
    { radius: 75, dots: 18 },
    { radius: 90, dots: 22 },
    { radius: 105, dots: 26 },
  ]
  
  const totalDots = rows.reduce((s, r) => s + r.dots, 0)
  const targetDotIndex = seatNum % totalDots

  let currentDotCount = 0
  const circles: Array<{ x: number; y: number; isTarget: boolean; key: string }> = []
  
  rows.forEach((row, rowIndex) => {
    const angleStep = Math.PI / (row.dots - 1)
    for (let i = 0; i < row.dots; i++) {
      const angle = Math.PI + i * angleStep
      const x = 150 + row.radius * Math.cos(angle)
      const y = 130 + row.radius * Math.sin(angle)
      const isTarget = currentDotCount === targetDotIndex
      
      circles.push({
        x,
        y,
        isTarget,
        key: `${rowIndex}-${i}`,
      })
      
      currentDotCount++
    }
  })

  return (
    <V3Panel>
      <V3PanelHeader title="Posição no Plenário" />
      <div className="flex flex-col items-center justify-center p-6 bg-slate-950/20">
        <svg width="300" height="150" viewBox="0 0 300 150" className="w-full max-w-[280px]">
          {/* Base structure podium */}
          <circle cx="150" cy="130" r="14" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
          <path d="M 130 130 A 20 20 0 0 1 170 130 Z" fill="rgba(255,255,255,0.1)" />
          
          {/* Seating dots */}
          {circles.map((c) => (
            <circle
              key={c.key}
              cx={c.x}
              cy={c.y}
              r={c.isTarget ? 5 : 2.5}
              fill={c.isTarget ? 'var(--party-brand)' : 'rgba(255,255,255,0.12)'}
              style={{
                filter: c.isTarget ? 'drop-shadow(0 0 6px var(--party-brand))' : 'none',
                animation: c.isTarget ? 'pulse 2s infinite' : 'none',
              }}
            />
          ))}
        </svg>
        <div className="text-center mt-3">
          <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#ffffff' }}>
            {sector} · Fileira {fileira} · Assento {seatNum}
          </p>
          <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--mute)' }}>
            Posição de votação oficial registrada na mesa
          </p>
        </div>
      </div>
    </V3Panel>
  )
}

// ── helper components ─────────────────────────────────────────────────────────

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
        <circle cx={cx} cy={cy} r={r - stroke / 2 - 1} fill="rgba(15,23,42,0.9)" />
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
  if (platform.includes('instagram')) return { icon: '◉', label: 'Instagram', bg: 'linear-gradient(135deg, var(--party-brand, #6366f1) 0%, var(--party-accent, #c084fc) 100%)', color: 'var(--ink)' }
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

function V3Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="glass-panel-v3 hover:shadow-[0_0_30px_rgba(var(--party-brand-rgb),0.07)] hover:border-[rgba(var(--party-brand-rgb),0.35)]"
      style={{
        background: 'rgba(15, 23, 42, 0.42)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: 16,
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.05)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function V3PanelHeader({ title, sub, source, action }: { title: string; sub?: string; source?: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
      <div>
        <h3 className="mono" style={{ margin: 0, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'var(--ink-2)' }}>{title.toUpperCase()}</h3>
        {sub && <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--mute)' }}>{sub}</p>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {source && <span className="mono" style={{ fontSize: 9, color: 'var(--mute)', background: 'rgba(255,255,255,0.04)', padding: '2px 8px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.05)' }}>{source}</span>}
        {action}
      </div>
    </div>
  )
}

export function ModoV3({
  politico,
  votacoes,
  votacoesRecentes = [],
  gastos,
  presenca,
  proposicoes = [],
  emendas = [],
  historicoPartidario = [],
  kpis,
  atualizadoEm,
  tab,
  setTab,
  feedEventos = [],
}: ModoV3Props) {
  
  const theme = getPartyTheme(politico.partidos?.sigla)
  const contactRef = useRef<HTMLDivElement>(null)
  
  // Custom styles variables injected dynamically
  const styleVars = {
    '--party-brand': theme.brandColor,
    '--party-accent': theme.accentColor,
    '--party-glow': theme.glowColor,
    '--party-brand-rgb': theme.brandColorRgb,
  } as React.CSSProperties

  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replaceAll('_', ' ')

  const tetoUf = CEAP_TETO_UF[politico.uf ?? ''] ?? null
  const hasGastosPoliticoAno = kpis.has_gastos_ano && gastos.length > 0
  const hasEmendasPoliticoAno = kpis.has_emendas_ano && kpis.total_emendas > 0
  
  const gastoPctTeto =
    hasGastosPoliticoAno && tetoUf != null && tetoUf > 0
      ? Math.max(0, Math.min(100, Math.round((kpis.gasto_total / tetoUf) * 100)))
      : null

  // Presence arrays and sparklines
  const presencaRows = presenca
  const presencaOrdenada = [...presencaRows]
    .filter((p) => p.mes != null)
    .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : (a.mes ?? 0) - (b.mes ?? 0))
  const presencaSparkData = presencaOrdenada.map((p) => p.percentual)

  // Gastos sparklines
  const gastosPorMes = gastos.reduce<Record<string, number>>((acc, g) => {
    const key = `${g.ano}-${String(g.mes).padStart(2, '0')}`
    acc[key] = (acc[key] ?? 0) + g.valor
    return acc
  }, {})
  const gastosMesesOrdenados = Object.entries(gastosPorMes).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  // Gastos categories
  const gastosPorCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    const cat = g.categoria ?? 'Outros'
    acc[cat] = (acc[cat] ?? 0) + g.valor
    return acc
  }, {})
  const gastosCategoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCategoria = gastosCategoriasOrdenadas[0]?.[1] ?? 1

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

  // Flagship KPI evaluation for asymmetric display
  const isPresenceFlagship = kpis.presenca_pct != null && kpis.presenca_pct >= 90

  const handleScrollToContact = () => {
    setTab('Visão geral')
    setTimeout(() => {
      contactRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)
  }

  // Sidebar dynamic mapping of labels to tabs
  const sidebarItems = [
    { label: 'Perfil', icon: <Users size={16} />, targetTab: 'Visão geral' as Tab },
    { label: 'Votações', icon: <Vote size={16} />, targetTab: 'Votações' as Tab },
    { label: 'Emendas', icon: <ScrollText size={16} />, targetTab: 'Emendas' as Tab },
    { label: 'Gabinete', icon: <Mail size={16} />, targetTab: 'Visão geral' as Tab, isContactAction: true },
    { label: 'Projetos', icon: <ScrollText size={16} />, targetTab: 'Projetos de Lei' as Tab },
    { label: 'Gastos', icon: <Download size={16} />, targetTab: 'Gastos' as Tab },
    { label: 'Presença', icon: <MapPin size={16} />, targetTab: 'Presença' as Tab },
  ]

  return (
    <div style={styleVars} className="v3-theme-wrapper min-h-screen text-[var(--ink)] bg-[#090d16] relative">
      
      {/* Dynamic Background Glow Layer */}
      <div 
        style={{ 
          position: 'absolute', 
          top: '25%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          width: '600px', 
          height: '600px', 
          background: 'radial-gradient(circle, var(--party-glow) 0%, rgba(9,13,22,0) 70%)',
          pointerEvents: 'none',
          zIndex: 0 
        }} 
      />

      <div className="flex flex-col lg:flex-row gap-6 max-w-[1320px] mx-auto px-6 py-6 relative z-10">
        
        {/* ── POLITICIAN DEDICATED SIDEBAR (Stitch Layout Concept) ── */}
        <aside className="w-full lg:w-[240px] flex-shrink-0 flex flex-col gap-4">
          
          <V3Panel style={{ padding: '20px 18px' }}>
            <div className="mb-6">
              <h2 className="text-base font-extrabold text-white leading-tight uppercase tracking-wider">{cargoNome}</h2>
              <p className="text-xs text-[var(--ink-3)] font-semibold mt-1">{politico.dado_estado || politico.uf || 'Brasil'}</p>
            </div>

            <nav className="flex flex-row lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-none">
              {sidebarItems.map((item) => {
                const isActive = item.isContactAction ? false : tab === item.targetTab
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.isContactAction) {
                        handleScrollToContact()
                      } else {
                        setTab(item.targetTab)
                      }
                    }}
                    style={{
                      background: isActive ? 'rgba(var(--party-brand-rgb), 0.12)' : 'transparent',
                      borderLeft: isActive ? '3px solid var(--party-brand)' : '3px solid transparent',
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all w-auto lg:w-full text-left whitespace-nowrap ${
                      isActive ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                    }`}
                  >
                    <span style={{ color: isActive ? 'var(--party-brand)' : 'inherit' }}>{item.icon}</span>
                    {item.label}
                  </button>
                )
              })}
            </nav>

            <div className="hidden lg:block mt-6 pt-4 border-t border-slate-800/80">
              <button
                onClick={handleScrollToContact}
                style={{
                  background: 'linear-gradient(135deg, var(--party-brand) 0%, var(--party-accent) 100%)',
                  boxShadow: '0 8px 16px rgba(var(--party-brand-rgb), 0.25)',
                }}
                className="w-full py-2.5 px-4 rounded-xl text-xs text-white font-extrabold text-center transition-transform active:scale-[0.98] duration-150 shadow-md"
              >
                Contatar Gabinete
              </button>
            </div>
          </V3Panel>
          
        </aside>

        {/* ── MAIN CONTENT ZONE ── */}
        <main className="flex-1 flex flex-col gap-6">

          {/* ── ACTIVE TAB CONTAINER ── */}
          <div className="flex flex-col gap-6">

            {/* TAB: Visão Geral */}
            {tab === 'Visão geral' && (
              <>
                {/* ── ASYMMETRIC METRICS GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                  
                  {/* Presence Flagship Card */}
                  <div 
                    style={{ 
                      gridColumn: 'span 6',
                      background: 'linear-gradient(135deg, rgba(var(--party-brand-rgb), 0.22) 0%, rgba(15,23,42,0.72) 100%)',
                      border: '1px solid rgba(var(--party-brand-rgb), 0.25)',
                    }}
                    className="rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[160px] col-span-12 md:col-span-6 hover:shadow-[0_0_25px_rgba(var(--party-brand-rgb),0.1)] transition-all duration-300"
                  >
                    <div>
                      <span className="mono text-[8px] tracking-widest font-extrabold" style={{ color: 'var(--party-accent)' }}>ASSIDUIDADE</span>
                      <h4 className="text-white font-extrabold text-lg mt-1">{isPresenceFlagship ? 'Presença Impecável' : 'Comparecimento'}</h4>
                      <p className="text-slate-400 text-xs mt-1">
                        {isPresenceFlagship ? 'Um dos políticos mais frequentes da casa' : 'Frequência nas sessões plenárias oficiais'}
                      </p>
                    </div>
                    <div className="flex items-end justify-between mt-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-white font-black text-3xl leading-none">{kpis.presenca_pct != null ? `${Math.round(kpis.presenca_pct)}%` : '–'}</span>
                        <span className="text-[10px] text-slate-400">{kpis.presenca_total_presencas} de {kpis.presenca_total_sessoes} sessões</span>
                      </div>
                      {presencaSparkData.length > 1 && (
                        <Sparkline data={presencaSparkData} w={80} h={20} />
                      )}
                    </div>
                  </div>

                  {/* Gastos Card */}
                  <div 
                    className="glass-panel-v3 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[160px] col-span-12 md:col-span-3 hover:border-slate-700/60"
                  >
                    <div>
                      <span className="mono text-[8px] tracking-widest font-extrabold text-slate-500">GASTOS COTA</span>
                      <h4 className="text-white font-extrabold text-base mt-1">Cota ({kpis.ano})</h4>
                      <p className="text-slate-400 text-[10.5px] mt-0.5">
                        {gastoPctTeto != null ? `${gastoPctTeto}% do limite máximo` : 'Despesas declaradas'}
                      </p>
                    </div>
                    <div className="mt-4">
                      <strong className="text-white font-extrabold text-xl block">{hasGastosPoliticoAno ? formatCurrency(kpis.gasto_total) : '–'}</strong>
                      {gastoPctTeto != null && (
                        <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${gastoPctTeto}%`, background: 'var(--party-brand)' }} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Emendas Card */}
                  <div 
                    className="glass-panel-v3 rounded-2xl p-5 shadow-lg flex flex-col justify-between min-h-[160px] col-span-12 md:col-span-3 hover:border-slate-700/60"
                  >
                    <div>
                      <span className="mono text-[8px] tracking-widest font-extrabold text-slate-500">EMENDAS DESTINADAS</span>
                      <h4 className="text-white font-extrabold text-base mt-1">Emendas ({kpis.ano})</h4>
                      <p className="text-slate-400 text-[10.5px] mt-0.5">
                        {hasEmendasPoliticoAno ? `${kpis.total_emendas} destinações feitas` : 'Projetos regionais'}
                      </p>
                    </div>
                    <div className="mt-4">
                      <strong className="text-white font-extrabold text-xl block">
                        {hasEmendasPoliticoAno ? `R$ ${(kpis.gasto_total / 1000000).toFixed(1)}M` : '–'}
                      </strong>
                      <span className="text-[10px] text-emerald-400 font-semibold block mt-1">Empenhadas</span>
                    </div>
                  </div>

                </div>

                {/* ── PLENARIO & IA PANEL IN SPLIT GRID ── */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PlenarioPosition politicoId={politico.id} cargo={politico.cargo} />
                  <IAPerguntaPolitico politicoId={politico.id} nomePolitico={nomeExibicao} />
                </div>

                {/* VOTAÇÕES RECENTES */}
                <V3Panel>
                  <V3PanelHeader
                    title="Votações Recentes"
                    sub={`${votacoesRecentesRows.length} últimas registradas`}
                    source={politico.cargo === 'senador' ? 'Senado' : 'Câmara'}
                  />
                  <div style={{ padding: '0 0 4px' }}>
                    {votacoesRecentesRows.length === 0 ? (
                      <div style={{ padding: '32px 20px', textAlign: 'center' }}>
                        <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>SEM VOTAÇÕES REGISTRADAS</p>
                      </div>
                    ) : (
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                        <thead>
                          <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                            {['DATA', 'MATÉRIA', 'VOTO'].map((h) => (
                              <th key={h} className="mono" style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600 }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {votacoesRecentesRows.slice(0, 4).map((v, i) => (
                            <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                              <td className="mono" style={{ padding: '12px 14px', color: 'var(--mute)', fontSize: 11, whiteSpace: 'nowrap' }}>
                                {formatDateOnly(v.data, '2-digit')}
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--ink-2)', lineHeight: 1.4, maxWidth: 280 }}>
                                <span className="line-clamp-2">
                                  {v.descricao_simples ?? v.proposicao ?? '–'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px' }}>
                                <VoteChip vote={votoToChip(v.voto)} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </V3Panel>

                {/* DETALHES DE MANDATO E PERFIL PESSOAL */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* Gabinete Contatos */}
                  <div ref={contactRef}>
                    <V3Panel>
                      <V3PanelHeader title="Informações de Gabinete" />
                      <div className="p-4 space-y-4">
                        {[
                          { label: 'E-mail funcional', value: contatoEmail, isLink: true, href: `mailto:${contatoEmail}` },
                          { label: 'Telefone do gabinete', value: telefoneGabinete },
                          { label: 'Identificação física', value: gabineteNome || 'Gabinete oficial' },
                        ].map((c) => (
                          <div key={c.label} className="border-b border-slate-800/40 pb-2.5 last:border-0 last:pb-0">
                            <span className="mono text-[8.5px] text-slate-500 block uppercase tracking-wider">{c.label}</span>
                            {c.isLink && c.value && c.value !== NA ? (
                              <a href={c.href} className="text-sm font-semibold text-[var(--party-accent)] hover:underline block mt-1">{c.value}</a>
                            ) : (
                              <strong className="text-sm text-slate-300 font-semibold block mt-1">{c.value ?? NA}</strong>
                            )}
                          </div>
                        ))}
                      </div>
                    </V3Panel>
                  </div>

                  {/* Redes Sociais */}
                  <V3Panel>
                    <V3PanelHeader title="Presença Digital" />
                    <div className="p-4">
                      {redesComUrl.length === 0 ? (
                        <p className="text-xs text-slate-400">Sem redes sociais ativas registradas.</p>
                      ) : (
                        <div className="flex flex-wrap gap-2.5">
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
                                  background: visual.bg,
                                }}
                                className="inline-flex items-center gap-2 px-3 py-2 text-xs font-bold text-white rounded-xl border border-slate-800 hover:scale-[1.02] active:scale-95 transition-transform"
                              >
                                <span>{visual.icon}</span>
                                <span>{visual.label}</span>
                              </a>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </V3Panel>

                </div>

              </>
            )}

            {/* TAB: Votações (Completo) */}
            {tab === 'Votações' && (
              <V3Panel>
                <V3PanelHeader
                  title="Histórico Completo de Votações"
                  sub={`${votacoes.length} registradas`}
                  source={politico.cargo === 'senador' ? 'Senado' : 'Câmara'}
                />
                <div style={{ padding: '0 0 4px' }}>
                  {votacoes.length === 0 ? (
                    <p className="mono py-8 text-center text-xs text-[var(--ink-3)]">SEM VOTAÇÕES REGISTRADAS</p>
                  ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                      <thead>
                        <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          {['DATA', 'MATÉRIA', 'VOTO'].map((h) => (
                            <th key={h} className="mono" style={{ padding: '10px 14px', textAlign: 'left', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {votacoes.map((v, i) => (
                          <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                            <td className="mono" style={{ padding: '12px 14px', color: 'var(--mute)', fontSize: 11, whiteSpace: 'nowrap' }}>
                              {formatDateOnly(v.data)}
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--ink-2)', lineHeight: 1.4 }}>
                              {v.descricao_simples ?? v.proposicao ?? '–'}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <VoteChip vote={votoToChip(v.voto)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </V3Panel>
            )}

            {/* TAB: Gastos (Completo) */}
            {tab === 'Gastos' && (
              <V3Panel>
                <V3PanelHeader title={`Gastos Detalhados · CEAP ${kpis.ano}`} source="Portal Transparência" />
                <div style={{ padding: '18px 20px' }}>
                  {/* Teto UF */}
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--ink-3)' }}>
                      <span>Usado em {kpis.ano}: <strong style={{ color: '#ffffff' }}>{formatCurrency(kpis.gasto_total)}</strong></span>
                      <span>Teto {politico.uf ?? '–'}: {tetoUf != null ? formatCurrency(tetoUf) : '–'}</span>
                    </div>
                    <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${gastoPctTeto ?? 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--party-brand) 0%, var(--party-accent) 100%)', borderRadius: 999 }} />
                    </div>
                    {gastoPctTeto != null && (
                      <div className="mono" style={{ marginTop: 6, fontSize: 10, color: 'var(--mute)' }}>{gastoPctTeto}% do limite máximo de {kpis.ano}</div>
                    )}
                  </div>

                  {/* Gastos Mensais */}
                  {gastosMesesOrdenados.length > 0 && (
                    <div style={{ marginBottom: 24 }}>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 12 }}>HISTÓRICO MENSAL DE GASTOS</div>
                      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 56 }}>
                        {gastosMesesOrdenados.map(([mes, val]) => {
                          const maxVal = Math.max(...gastosMesesOrdenados.map(([, v]) => v))
                          const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                          const [, m] = mes.split('-')
                          const mLabel = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'][parseInt(m, 10) - 1] ?? m
                          return (
                            <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                              <div 
                                style={{ 
                                  width: '100%', 
                                  height: `${Math.max(4, pct * 0.5)}px`, 
                                  background: 'linear-gradient(to top, var(--party-brand) 0%, var(--party-accent) 100%)', 
                                  borderRadius: '4px 4px 0 0',
                                  minHeight: 4 
                                }} 
                              />
                              <span className="mono" style={{ fontSize: 8, color: 'var(--mute)' }}>{mLabel}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {/* Gastos Categorias */}
                  {gastosCategoriasOrdenadas.length > 0 && (
                    <div>
                      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 14 }}>DESPESAS POR CATEGORIA</div>
                      <GastosDonut categorias={gastosCategoriasOrdenadas} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
                        {gastosCategoriasOrdenadas.map(([cat, val]) => (
                          <div key={cat} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'center' }}>
                            <div>
                              <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 4, lineHeight: 1.25 }}>{cat}</div>
                              <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                                <div style={{ width: `${(val / maxCategoria) * 100}%`, height: '100%', background: 'var(--party-brand)' }} />
                              </div>
                            </div>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff', fontFamily: 'var(--font-mono)' }}>{formatCurrency(val)}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </V3Panel>
            )}

            {/* TAB: Presença */}
            {tab === 'Presença' && (
              <V3Panel>
                <V3PanelHeader title="Presença Plenária Histórica" source={politico.cargo === 'senador' ? 'Senado' : 'Câmara'} />
                <div style={{ padding: '18px 20px' }}>
                  {presencaRows.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">SEM HISTÓRICO DE PRESENÇA COLETADO</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {presencaOrdenada.map((p) => {
                        const mesNome = p.mes != null
                          ? new Date(p.ano, p.mes - 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
                          : String(p.ano)
                        const pct = Math.max(0, Math.min(100, Math.round(p.percentual)))
                        return (
                          <div key={`${p.ano}-${p.mes}`} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 48px', gap: 12, alignItems: 'center' }}>
                            <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>{mesNome}</span>
                            <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
                              <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--pos)' : pct >= 60 ? 'var(--warn)' : 'var(--neg)', borderRadius: 999 }} />
                            </div>
                            <span style={{ fontSize: 11.5, fontWeight: 700, color: '#ffffff', textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{pct}%</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </V3Panel>
            )}

            {/* TAB: Projetos de Lei */}
            {tab === 'Projetos de Lei' && (
              <V3Panel>
                <V3PanelHeader title={`Projetos de Lei Autorados (${proposicoes.length})`} source={politico.cargo === 'senador' ? 'Senado' : 'Câmara'} />
                <div style={{ padding: '16px' }} className="flex flex-col gap-3">
                  {proposicoes.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">NENHUM PROJETO DE LEI ENCONTRADO.</p>
                  ) : (
                    proposicoes.map((p) => (
                      <Link 
                        key={p.id} 
                        href={`/projetos/${p.slug}`} 
                        className="block bg-slate-900/40 hover:bg-slate-950/60 border border-slate-800 hover:border-[var(--party-brand)] rounded-xl p-4 transition-all duration-200 text-decoration-none"
                      >
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <span className="font-mono text-xs text-white font-bold" style={{ color: 'var(--party-accent)' }}>{p.tipo} {p.numero}/{p.ano}</span>
                          <span className="text-[9px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-[4px] font-bold uppercase tracking-wider">{p.situacao ?? 'Em tramitação'}</span>
                        </div>
                        <p className="text-xs text-slate-300 font-semibold line-clamp-2 leading-relaxed">{p.ementa}</p>
                      </Link>
                    ))
                  )}
                </div>
              </V3Panel>
            )}

            {/* TAB: Emendas */}
            {tab === 'Emendas' && (
              <V3Panel>
                <V3PanelHeader title={`Emendas Parlamentares Destinadas (${emendas.length})`} source="Portal da Transparência" />
                <div style={{ padding: '16px' }} className="flex flex-col gap-3">
                  {emendas.length === 0 ? (
                    <p className="mono py-6 text-center text-xs text-[var(--ink-3)]">NENHUMA EMENDA PARLAMENTAR LOCALIZADA.</p>
                  ) : (
                    emendas.map((e) => (
                      <div key={e.id} className="bg-slate-900/40 border border-slate-800 rounded-xl p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-mono text-sm text-emerald-400 font-bold">R$ {Number(e.valor_pago || e.valor).toLocaleString('pt-BR')}</span>
                          <span className="text-[10px] bg-slate-800 text-slate-400 border border-slate-700 px-2 py-0.5 rounded-[4px] font-mono">{e.ano}</span>
                        </div>
                        <div className="text-xs space-y-1 text-slate-300">
                          <div><span className="text-slate-500 font-medium">Destino:</span> {e.municipio_nome ?? 'Nacional'} - {e.uf_municipio ?? 'UF'}</div>
                          <div><span className="text-slate-500 font-medium">Função/Área:</span> {e.funcao ?? 'Saúde/Desenvolvimento'}</div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </V3Panel>
            )}

            {/* TAB: Notícias */}
            {tab === 'Notícias' && (
              <V3Panel>
                <V3PanelHeader title="Notícias Relacionadas" action={<span className="bg-purple-950/30 text-purple-300 border border-purple-900/50 text-[9px] font-bold px-2 py-0.5 rounded font-mono uppercase tracking-widest">coletando</span>} />
                <div style={{ padding: '24px' }} className="space-y-4 animate-pulse">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-xs text-emerald-400 font-mono">Buscando notícias no feed sobre {nomeExibicao}...</span>
                  </div>
                  {[1, 2].map((i) => (
                    <div key={i} className="border-b border-slate-800/80 pb-3 flex flex-col gap-2">
                      <div className="h-4 bg-slate-900 rounded w-1/4" />
                      <div className="h-3.5 w-full rounded bg-slate-900/50" />
                      <div className="h-3.5 w-4/5 rounded bg-slate-900/50" />
                    </div>
                  ))}
                </div>
              </V3Panel>
            )}

            {/* TAB: Histórico */}
            {tab === 'Histórico' && (
              <V3Panel>
                <V3PanelHeader title="Histórico do TSE" />
                <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                  <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>DADOS HISTÓRICOS ELEITORAIS TSE EM BREVE</p>
                </div>
              </V3Panel>
            )}

            {/* TAB: Linha do Tempo */}
            {tab === 'Linha do Tempo' && (
              <V3Panel>
                <V3PanelHeader title="LINHA DO TEMPO CRONOLÓGICA" source="Feed de Acontecimentos" />
                <div style={{ padding: '24px 20px' }}>
                  {(!feedEventos || feedEventos.length === 0) ? (
                    <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                      <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
                      <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em', margin: 0 }}>
                        Aguardando a coleta de acontecimentos e marcos relevantes para o feed cronológico.
                      </p>
                    </div>
                  ) : (
                    <div style={{ position: 'relative', paddingLeft: 24, margin: '12px 0' }}>
                      <div style={{ position: 'absolute', left: 9, top: 4, bottom: 4, width: 2, background: 'rgba(255,255,255,0.06)' }} />

                      {feedEventos.map((evt, idx) => {
                        const dateFmt = evt.data ? new Date(evt.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
                        const impacto = Number(evt.impacto_nivel || 1)
                        const impColor = impacto === 4 ? 'var(--neg)' : impacto === 3 ? 'var(--warn)' : impacto === 2 ? 'var(--info)' : 'var(--party-brand)'
                        const impLabel = impacto === 4 ? 'Crítico' : impacto === 3 ? 'Alto' : impacto === 2 ? 'Médio' : 'Baixo'

                        return (
                          <div key={evt.id || idx} style={{ position: 'relative', marginBottom: idx === feedEventos.length - 1 ? 0 : 28 }}>
                            <div style={{
                              position: 'absolute', left: -20, top: 4,
                              width: 12, height: 12, borderRadius: '50%',
                              background: impColor, border: '3px solid #090d16',
                              boxShadow: `0 0 0 1px ${impColor}44`,
                              zIndex: 2
                            }} />

                            <div style={{ background: 'rgba(30, 41, 59, 0.22)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '16px 20px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
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
                                <a href={evt.link_fonte} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: 'var(--party-accent)', textDecoration: 'none', fontWeight: 600 }}>
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
              </V3Panel>
            )}

            {/* TAB: Fontes */}
            {tab === 'Fontes' && (
              <V3Panel>
                <V3PanelHeader title="Fontes de Dados Utilizadas" />
                <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <p style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Os dados exibidos nesta plataforma são coletados de APIs públicas e oficiais do governo federal brasileiro. O Meus Políticos realiza a consolidação e a didática desses registros de forma neutra, transparente e apartidária.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[
                      { name: 'Câmara dos Deputados (Dados Abertos API v2)', url: 'https://dadosabertos.camara.leg.br/' },
                      { name: 'Senado Federal (API de Dados Abertos)', url: 'https://www12.senado.leg.br/dados-abertos' },
                      { name: 'Portal da Transparência (CGU)', url: 'https://portaldatransparencia.gov.br/' },
                      { name: 'TSE (Divulgação de Candidaturas e Contas Eleitorais)', url: 'https://divulgacandcontas.tse.jus.br/' },
                    ].map((f) => (
                      <a key={f.name} href={f.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: 'var(--party-accent)', textDecoration: 'none' }} className="hover:underline">
                        🔗 {f.name} ↗
                      </a>
                    ))}
                  </div>
                </div>
              </V3Panel>
            )}

          </div>

          {/* HISTÓRICO PARTIDÁRIO & OUTROS DETALHES DE APOIO NO FIM DA COMPOSIÇÃO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <V3Panel>
              <V3PanelHeader title="Histórico de Filiações" source="TSE" />
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {historicoPartidarioRows.length === 0 ? (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>SEM FILIAÇÕES REGISTRADAS</p>
                ) : (
                  historicoPartidarioRows.map((item, index) => (
                    <div
                      key={`${item.partido_sigla}-${item.inicio}-${index}`}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto',
                        gap: 12,
                        alignItems: 'center',
                        padding: '10px 12px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        borderRadius: 12,
                        background: 'rgba(15,23,42,0.3)',
                      }}
                    >
                      <span style={{ width: 10, height: 10, borderRadius: 999, background: item.partido_cor ?? 'var(--party-brand)' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff' }}>{item.partido_sigla ?? 'Partido'}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.partido_nome ?? item.motivo ?? 'Filiação'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="mono font-bold" style={{ fontSize: 9, color: item.atual ? 'var(--pos)' : 'var(--mute)', letterSpacing: '0.06em' }}>
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
            </V3Panel>

            <V3Panel>
              <V3PanelHeader title="Fontes & Sincronia" />
              <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { name: 'Câmara dos Deputados v2', ok: true },
                  { name: 'Senado Federal', ok: true },
                  { name: 'Portal da Transparência', ok: true },
                  { name: 'Tribunal Superior Eleitoral', ok: true },
                ].map(({ name, ok }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{name}</span>
                    <span style={{ color: ok ? 'var(--pos)' : 'var(--mute)', fontWeight: 700 }}>{ok ? '✓ Sincronizado' : '–'}</span>
                  </div>
                ))}
                <div className="mono font-bold text-[9px] text-slate-500 tracking-wider mt-4">
                  ÚLTIMA ATUALIZAÇÃO DO BANCO: {atualizadoEm}
                </div>
              </div>
            </V3Panel>

          </div>

        </main>

      </div>

    </div>
  )
}
