'use client'

import { useEffect, useRef, useState } from 'react'

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

  let angle = Math.PI
  const slices = partidos.slice(0, 12).map((p) => {
    const frac = p.qtd / total
    const span = frac * Math.PI - gap
    const a1 = angle + gap / 2
    const a2 = angle + frac * Math.PI - gap / 2
    angle += frac * Math.PI

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
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
      <svg width={240} height={120} viewBox="0 0 240 120" style={{ overflow: 'visible' }}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.cor} opacity={0.88}>
            <title>{s.sigla}: {s.qtd} cadeiras</title>
          </path>
        ))}
        {/* Label central */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize="11" fill="var(--ink-3)" fontFamily="var(--font-mono)">
          TOTAL
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--ink)" fontFamily="var(--font-mono)">
          {total}
        </text>
        <text x={cx} y={cy + 18} textAnchor="middle" fontSize="9" fill="var(--mute)" fontFamily="var(--font-mono)">
          cadeiras
        </text>
      </svg>
      {/* Legenda */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1, minWidth: 120 }}>
        {slices.slice(0, 8).map((s) => (
          <div key={s.sigla} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: 2, background: s.cor, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)', flex: 1 }}>
              {s.sigla}
            </span>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              {s.qtd}
            </span>
          </div>
        ))}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Stacked bar */}
      <div style={{ display: 'flex', height: 12, borderRadius: 999, overflow: 'hidden', width: '100%' }}>
        {partidos.slice(0, 10).map((p) => (
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
      {/* Partido rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 4 }}>
        {partidos.slice(0, 10).map((p) => (
          <div key={p.sigla} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: p.cor || partyColor(p.sigla), flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>{p.sigla}</span>
            <span style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginLeft: 'auto' }}>{p.qtd}</span>
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
              {item.descricao && (
                <p style={{ margin: '4px 0 0', fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  {item.descricao}
                </p>
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
