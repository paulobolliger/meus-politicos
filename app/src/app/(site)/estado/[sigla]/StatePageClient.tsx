'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Hemicycle (semicírculo de cadeiras da ALE) ──────────────────────────────

type PartySlice = { sigla: string; qtd: number; cor: string }

const PARTY_COLORS: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  SOLIDARIEDADE: '#d97706', NOVO: '#d97706', PRD: '#1d4ed8',
  PV: '#16a34a', AVANTE: '#d97706', PSOL: '#7c3aed',
}

function partyColor(sigla: string): string {
  return PARTY_COLORS[sigla] ?? '#94a3b8'
}

export function HemicycleChart({ partidos, total }: { partidos: PartySlice[]; total: number }) {
  const cx = 120, cy = 115, R = 95, r = 58
  const gap = 0.015

  const visibleParties = partidos.slice(0, 12)
  const slices = visibleParties.map((p, index) => {
    const previousSeats = visibleParties
      .slice(0, index)
      .reduce((sum, item) => sum + item.qtd, 0)
    const angle = Math.PI + (previousSeats / total) * Math.PI
    const frac = p.qtd / total
    const span = frac * Math.PI - gap
    const a1 = angle + gap / 2
    const a2 = angle + frac * Math.PI - gap / 2
    const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
    const x2 = cx + R * Math.cos(a2), y2 = cy + R * Math.sin(a2)
    const x3 = cx + r * Math.cos(a2), y3 = cy + r * Math.sin(a2)
    const x4 = cx + r * Math.cos(a1), y4 = cy + r * Math.sin(a1)
    const large = span > Math.PI ? 1 : 0

    const d = [
      `M ${x1.toFixed(1)} ${y1.toFixed(1)}`,
      `A ${R} ${R} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
      `L ${x3.toFixed(1)} ${y3.toFixed(1)}`,
      `A ${r} ${r} 0 ${large} 0 ${x4.toFixed(1)} ${y4.toFixed(1)}`,
      'Z',
    ].join(' ')

    return { ...p, d, cor: p.cor || partyColor(p.sigla) }
  })

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-evenly',
      gap: 24,
      width: '100%',
      flexWrap: 'wrap',
    }}>
      <div style={{ width: 240, height: 120, display: 'flex', justifyContent: 'center', flexShrink: 0 }}>
        <svg width={240} height={120} viewBox="0 0 240 120" style={{ overflow: 'visible' }}>
          {slices.map((s, i) => (
            <path key={i} d={s.d} fill={s.cor} opacity={0.88}>
              <title>{`${s.sigla}: ${s.qtd} cadeiras`}</title>
            </path>
          ))}
          {/* Label central ajustado perfeitamente dentro do vão do semicírculo para evitar sobreposição */}
          <text x={cx} y={cy - 38} textAnchor="middle" fontSize="10" fontWeight="700" fill="var(--ink-3)" fontFamily="var(--font-sans)" style={{ letterSpacing: '0.05em' }}>
            TOTAL
          </text>
          <text x={cx} y={cy - 15} textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--ink)" fontFamily="var(--font-sans)">
            {total}
          </text>
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="10" fontWeight="600" fill="var(--mute)" fontFamily="var(--font-sans)" style={{ letterSpacing: '0.05em' }}>
            CADEIRAS
          </text>
        </svg>
      </div>
      {/* Legenda com cápsulas/chips auto-wrap de alto contraste para evitar espaços vazios e desalinhamento */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        flex: 1,
        minWidth: 260,
        justifyContent: 'center',
      }}>
        {partidos.slice(0, 12).map((p) => {
          const sCor = p.cor || partyColor(p.sigla)
          return (
            <div key={p.sigla} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'var(--bg)',
              borderRadius: 6,
              border: '1px solid var(--line-soft)',
            }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sCor, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)', fontFamily: 'var(--font-sans)' }}>
                {p.sigla}
              </span>
              <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', background: 'var(--panel)', padding: '1px 6px', borderRadius: 4 }}>
                {p.qtd}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Pacto Federativo Flow ────────────────────────────────────────────────────

type PactoData = {
  totalEnviado: number
  totalRecebido: number
  fpe: number
  sus: number
  fundeb: number
  ir: number
  ipi: number
  previdencia: number
  tipo: 'doador' | 'receptor'
  saldo: number
}

function fmtMi(v: number): string {
  if (Math.abs(v) >= 1000) return `R$ ${(v / 1000).toFixed(1)}bi`
  return `R$ ${v.toFixed(0)}mi`
}

export function PactoFederativoFlow({ data }: { data: PactoData }) {
  const max = Math.max(data.totalEnviado, data.totalRecebido, 1)
  const envPct = Math.round((data.totalEnviado / max) * 100)
  const recPct = Math.round((data.totalRecebido / max) * 100)
  const isDoador = data.tipo === 'doador'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Badge */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
          background: isDoador ? '#fef3c7' : '#dcfce7',
          color: isDoador ? '#92400e' : '#14532d',
          border: `1px solid ${isDoador ? '#fcd34d' : '#86efac'}`,
        }}>
          {isDoador ? '📤 ESTADO DOADOR' : '📥 ESTADO RECEPTOR'}
        </span>
        <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>
          Saldo:{' '}
          <strong style={{ color: isDoador ? 'var(--neg)' : 'var(--pos)' }}>
            {isDoador ? '-' : '+'}{fmtMi(Math.abs(data.saldo))}
          </strong>
        </span>
      </div>

      {/* Flow bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 8, alignItems: 'center' }}>
        {/* Enviado */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: '0.06em' }}>
            ENVIADO À UNIÃO
          </div>
          <div style={{ height: 8, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${envPct}%`, height: '100%', background: 'var(--neg)', borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--neg)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {fmtMi(data.totalEnviado)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            IR {fmtMi(data.ir)} · IPI {fmtMi(data.ipi)} · Prev. {fmtMi(data.previdencia)}
          </div>
        </div>

        {/* Arrow */}
        <div style={{ textAlign: 'center', fontSize: 20, color: 'var(--line-strong)' }}>⇄</div>

        {/* Recebido */}
        <div>
          <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 4, letterSpacing: '0.06em' }}>
            RECEBIDO DA UNIÃO
          </div>
          <div style={{ height: 8, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ width: `${recPct}%`, height: '100%', background: 'var(--pos)', borderRadius: 99 }} />
          </div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--pos)', fontFamily: 'var(--font-mono)', marginTop: 4 }}>
            {fmtMi(data.totalRecebido)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
            FPE {fmtMi(data.fpe)} · SUS {fmtMi(data.sus)} · FUNDEB {fmtMi(data.fundeb)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Party Bar (composição horizontal) ───────────────────────────────────────

export function PartyBar({ partidos, total }: { partidos: PartySlice[]; total: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Stacked bar premium */}
      <div style={{ display: 'flex', height: 16, borderRadius: 8, overflow: 'hidden', width: '100%', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)' }}>
        {partidos.slice(0, 12).map((p) => (
          <div
            key={p.sigla}
            style={{
              width: `${(p.qtd / total) * 100}%`,
              background: p.cor || partyColor(p.sigla),
              flexShrink: 0,
            }}
            title={`${p.sigla}: ${p.qtd} (${((p.qtd / total) * 100).toFixed(1)}%)`}
          />
        ))}
      </div>
      {/* Partido rows com cápsulas/chips auto-wrap de alto contraste para evitar espaços vazios e desalinhamento */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 8,
        width: '100%',
        marginTop: 4,
      }}>
        {partidos.slice(0, 12).map((p) => (
          <div
            key={p.sigla}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 8px',
              background: 'var(--bg)',
              borderRadius: 6,
              border: '1px solid var(--line-soft)',
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: p.cor || partyColor(p.sigla), flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-2)', fontFamily: 'var(--font-sans)' }}>{p.sigla}</span>
            <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', background: 'var(--panel)', padding: '1px 6px', borderRadius: 4 }}>
              {p.qtd}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Animated Counter ────────────────────────────────────────────────────────

export function AnimCounter({ value, prefix = '', suffix = '', decimals = 0 }: {
  value: number; prefix?: string; suffix?: string; decimals?: number
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    const duration = 800
    const start = performance.now()
    startRef.current = start

    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // cubic ease out
      setDisplay(eased * value)
      if (progress < 1 && startRef.current === start) {
        requestAnimationFrame(animate)
      }
    }
    requestAnimationFrame(animate)
    return () => { startRef.current = null }
  }, [value])

  const formatted = decimals > 0
    ? display.toFixed(decimals)
    : Math.round(display).toLocaleString('pt-BR')

  return <span ref={ref}>{prefix}{formatted}{suffix}</span>
}

// ─── Economic Sector Bar ──────────────────────────────────────────────────────

export function EconSetoresBar({ agro, industria, servicos }: {
  agro: number; industria: number; servicos: number
}) {
  const total = agro + industria + servicos || 100
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[
        { label: 'Serviços', val: servicos, cor: 'var(--brand)' },
        { label: 'Indústria', val: industria, cor: 'var(--accent)' },
        { label: 'Agronegócio', val: agro, cor: 'var(--pos)' },
      ].map((s) => (
        <div key={s.label}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 500 }}>{s.label}</span>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              {((s.val / total) * 100).toFixed(1)}%
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--line-soft)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{
              width: `${(s.val / total) * 100}%`,
              height: '100%', background: s.cor, borderRadius: 99,
              transition: 'width 0.6s ease',
            }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Timeline ─────────────────────────────────────────────────────────────────

type TimelineItem = {
  ano: number
  mes: number | null
  titulo: string
  descricao: string | null
  descricaoNode?: React.ReactNode
  tipo: string | null
  impacto: string | null
}

const TIPO_ICON: Record<string, string> = {
  eleicao: '🗳️', escandalo: '⚠️', obra: '🏗️', crise: '🔴',
  privatizacao: '🏭', reforma: '📋', desastre: '🌊',
}

export function TimelinePolitica({ items }: { items: TimelineItem[] }) {
  if (!items.length) return (
    <div style={{ padding: '32px 0', textAlign: 'center', color: 'var(--mute)', fontSize: 13 }}>
      Linha do tempo em construção — execute o ETL de eventos históricos.
    </div>
  )

  return (
    <div style={{ position: 'relative', paddingLeft: 24 }}>
      {/* Linha vertical */}
      <div style={{
        position: 'absolute', left: 8, top: 0, bottom: 0,
        width: 2, background: 'var(--line-soft)',
      }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {items.map((item, i) => {
          const impactColor = item.impacto === 'positivo' ? 'var(--pos)' : item.impacto === 'negativo' ? 'var(--neg)' : 'var(--mute)'
          return (
            <div key={i} style={{ position: 'relative', paddingLeft: 20 }}>
              {/* Dot */}
              <div style={{
                position: 'absolute', left: -20, top: 4,
                width: 10, height: 10, borderRadius: '50%',
                background: impactColor, border: '2px solid var(--panel)',
                zIndex: 1,
              }} />
              <div style={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>
                {item.mes ? `${String(item.mes).padStart(2,'0')}/` : ''}{item.ano}
                {item.tipo && ` · ${TIPO_ICON[item.tipo] ?? '📌'} ${item.tipo.toUpperCase()}`}
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{item.titulo}</div>
              {(item.descricaoNode || item.descricao) && (
                <div style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  {item.descricaoNode || item.descricao}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Section anchor nav ───────────────────────────────────────────────────────

const NAV_SECTIONS = [
  { id: 'governanca',  label: 'Governança' },
  { id: 'ale',         label: 'Legislativo' },
  { id: 'bancada',     label: 'Bancada Federal' },
  { id: 'economia',    label: 'Economia' },
  { id: 'pacto',       label: 'Pacto Federativo' },
  { id: 'tribunais',   label: 'Controle' },
  { id: 'municipios',  label: 'Municípios' },
  { id: 'emendas',     label: 'Emendas' },
  { id: 'timeline',    label: 'Linha do Tempo' },
]

export function StateAnchorNav({ cor }: { cor: string }) {
  const [active, setActive] = useState('')

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id)
        })
      },
      { rootMargin: '-40% 0px -55% 0px' },
    )
    NAV_SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) obs.observe(el)
    })
    return () => obs.disconnect()
  }, [])

  return (
    <nav style={{
      position: 'sticky', top: 0, zIndex: 20,
      background: 'var(--panel)',
      borderBottom: '1px solid var(--line-soft)',
      overflowX: 'auto',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 24px',
        display: 'flex', gap: 0,
      }}>
        {NAV_SECTIONS.map(({ id, label }) => (
          <a
            key={id}
            href={`#${id}`}
            style={{
              display: 'inline-flex', alignItems: 'center',
              padding: '10px 14px', fontSize: 13, fontWeight: active === id ? 600 : 400,
              color: active === id ? cor : 'var(--ink-3)',
              borderBottom: `2px solid ${active === id ? cor : 'transparent'}`,
              textDecoration: 'none', whiteSpace: 'nowrap',
              transition: 'color 0.15s, border-color 0.15s',
            }}
          >
            {label}
          </a>
        ))}
      </div>
    </nav>
  )
}

// ─── Bancada Federal Wrapper (Alternância de visualização) ───────────────────

type PoliticoRowClient = {
  id: string
  slug: string
  nome_eleitoral: string
  foto_url: string | null
  cargo: string
  partidos: { sigla: string } | null
}

export function BancadaFederalList({
  depFederais,
  bancadaPartidos,
  cor
}: {
  depFederais: PoliticoRowClient[]
  bancadaPartidos: { sigla: string; qtd: number; cor: string }[]
  cor: string
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'party'>('grid')

  // Grouping by party
  const groupedByParty = new Map<string, PoliticoRowClient[]>()
  depFederais.forEach((d) => {
    const p = d.partidos?.sigla ?? 'Outros'
    if (!groupedByParty.has(p)) {
      groupedByParty.set(p, [])
    }
    groupedByParty.get(p)!.push(d)
  })

  // Order parties by headcount (highest first) as in bancadaPartidos
  const sortedParties = bancadaPartidos.map(bp => bp.sigla)

  return (
    <div>
      {/* Visual switcher tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        <button
          onClick={() => setViewMode('grid')}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${viewMode === 'grid' ? cor : 'var(--line)'}`,
            background: viewMode === 'grid' ? `${cor}15` : 'transparent',
            color: viewMode === 'grid' ? cor : 'var(--ink-3)',
            cursor: 'pointer', outline: 'none',
            transition: 'all 0.15s',
          }}
        >
          🎛️ Visualização em Grade
        </button>
        <button
          onClick={() => setViewMode('party')}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            border: `1px solid ${viewMode === 'party' ? cor : 'var(--line)'}`,
            background: viewMode === 'party' ? `${cor}15` : 'transparent',
            color: viewMode === 'party' ? cor : 'var(--ink-3)',
            cursor: 'pointer', outline: 'none',
            transition: 'all 0.15s',
          }}
        >
          🏛️ Agrupado por Partido
        </button>
      </div>

      {viewMode === 'grid' ? (
        // Grid View
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
          {depFederais.map((d) => (
            <Link key={d.id} href={`/p/${d.slug}`} style={{ textDecoration: 'none' }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--line)',
                transition: 'border-color 0.15s',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                  background: 'var(--line)', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                  position: 'relative',
                }}>
                  {d.foto_url
                    ? <Image src={d.foto_url} alt={d.nome_eleitoral} fill sizes="32px" unoptimized style={{ objectFit: 'cover' }} />
                    : d.nome_eleitoral.charAt(0)
                  }
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 11.5, color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {d.nome_eleitoral}
                  </div>
                  {d.partidos?.sigla && (
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                      {d.partidos.sigla}
                    </div>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        // Party Grouped View
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sortedParties.map((partySigla) => {
            const list = groupedByParty.get(partySigla) || []
            if (list.length === 0) return null;
            const partyInfo = bancadaPartidos.find(bp => bp.sigla === partySigla)
            const pCor = partyInfo?.cor ?? '#94a3b8'
            return (
              <div key={partySigla} style={{
                border: '1px solid var(--line)', borderRadius: 12, padding: 16,
                background: 'rgba(255,255,255,0.01)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: pCor }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>
                    {partySigla}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                    ({list.length} deputado{list.length !== 1 ? 's' : ''})
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
                  {list.map((d) => (
                    <Link key={d.id} href={`/p/${d.slug}`} style={{ textDecoration: 'none' }}>
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                        borderRadius: 8, background: 'var(--bg)', border: '1px solid var(--line)',
                      }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', overflow: 'hidden',
                          background: 'var(--line)', flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12,
                          position: 'relative',
                        }}>
                          {d.foto_url
                            ? <Image src={d.foto_url} alt={d.nome_eleitoral} fill sizes="32px" unoptimized style={{ objectFit: 'cover' }} />
                            : d.nome_eleitoral.charAt(0)
                          }
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontSize: 11.5, color: 'var(--ink)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {d.nome_eleitoral}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
