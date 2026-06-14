'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────
export type PartidoCard = {
  id: string
  sigla: string
  nome: string
  numero: string | null
  cor: string | null
  logo_url: string | null
  total_politicos: number
  dep_federal: number
  senadores: number
  governadores: number
  dep_estadual: number
  presenca_media: number | null
  gasto_medio_mensal: number | null
}

export type FpAno = { ano: number; total: number }

// ─── Helpers ──────────────────────────────────────────────────────────────────
function siglaCaminho(sigla: string): string {
  return sigla.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
}

function useLogo(sigla: string, logoUrl: string | null): [string | null, () => void] {
  const base = `/partidos/${siglaCaminho(sigla)}`
  const sources = [logoUrl ?? `${base}.svg`, `${base}.png`]
  const [idx, setIdx] = useState(0)
  const src = idx < sources.length ? sources[idx] : null
  return [src, () => setIdx(i => i + 1)]
}

const COR_PARTIDO: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#e11d48',
  PSB: '#f97316', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  PODEMOS: '#16a34a', NOVO: '#d97706', PSOL: '#9333ea',
  PCdoB: '#dc2626', 'PC DO B': '#dc2626', AVANTE: '#f59e0b',
  SOLIDARIEDADE: '#f97316', CIDADANIA: '#06b6d4', PATRI: '#1d4ed8',
  PATRIOTA: '#1d4ed8', PRD: '#6366f1', PV: '#16a34a', AGIR: '#0ea5e9',
  DC: '#6b7280', PMB: '#ec4899', PMN: '#0284c7', PTC: '#78716c',
  PROS: '#f97316', REDE: '#22c55e',
}

function getCor(p: PartidoCard): string {
  return p.cor ?? COR_PARTIDO[p.sigla] ?? '#6b7280'
}

function fmt(n: number): string {
  return n.toLocaleString('pt-BR')
}

function fmtMoeda(n: number): string {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1).replace('.', ',')}B`
  if (n >= 1_000_000)     return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000)         return `R$ ${(n / 1_000).toFixed(0)}k`
  return `R$ ${fmt(n)}`
}

// ─── Logo box ─────────────────────────────────────────────────────────────────
function LogoBox({ partido, size = 64 }: { partido: PartidoCard; size?: number }) {
  const [src, onError] = useLogo(partido.sigla, partido.logo_url)
  const cor = getCor(partido)

  if (src) {
    return (
      <div style={{
        width: size, height: size, borderRadius: 10,
        background: '#fff', border: '1px solid #e5e7eb',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, overflow: 'hidden', padding: 6, position: 'relative',
      }}>
        <Image
          src={src}
          alt={partido.sigla}
          onError={onError}
          fill
          sizes={`${size}px`}
          unoptimized
          style={{ objectFit: 'contain', padding: 6 }}
        />
      </div>
    )
  }
  return (
    <div style={{
      width: size, height: size, borderRadius: 10,
      background: cor, display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 800, fontSize: size > 56 ? 17 : 13,
      letterSpacing: '-0.5px', flexShrink: 0,
    }}>
      {partido.sigla.slice(0, 4)}
    </div>
  )
}

// ─── Party card ───────────────────────────────────────────────────────────────
function PartidoCardItem({ partido }: { partido: PartidoCard }) {
  const presenca = partido.presenca_media ?? 0
  const [hovered, setHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: '#fff',
        border: `1.5px solid ${hovered ? '#2851cb' : '#c5c6d1'}`,
        borderRadius: 12,
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        transition: 'box-shadow 0.18s, transform 0.18s, border-color 0.18s',
        boxShadow: hovered ? '0 8px 32px rgba(40,81,203,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
        transform: hovered ? 'translateY(-4px)' : 'none',
        cursor: 'default',
      }}
    >
      {/* Top row: logo + sigla + número + nome */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <LogoBox partido={partido} size={64} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
            <span style={{
              fontWeight: 800, fontSize: 22, color: '#011549', lineHeight: 1,
              letterSpacing: '-0.5px',
            }}>{partido.sigla}</span>
            {partido.numero && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: '#6b7280',
                background: '#f3f4f6', border: '1px solid #e5e7eb',
                borderRadius: 4, padding: '2px 7px',
              }}>nº {partido.numero}</span>
            )}
          </div>
          <div style={{
            fontSize: 12, color: '#6b7280', lineHeight: 1.4,
            overflow: 'hidden', textOverflow: 'ellipsis',
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' as const,
          }}>{partido.nome}</div>
        </div>
      </div>

      {/* Bancada count — big blue number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
        <span style={{ fontSize: 32, fontWeight: 800, color: '#2851cb', lineHeight: 1 }}>
          {fmt(partido.total_politicos)}
        </span>
        <span style={{ fontSize: 13, color: '#6b7280' }}>parlamentares</span>
      </div>

      {/* Cargo chips */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {partido.dep_federal > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
            background: '#f3e8ff', color: '#7e22ce',
          }}>
            {partido.dep_federal} dep. federal
          </span>
        )}
        {partido.senadores > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
            background: '#e0f2fe', color: '#0369a1',
          }}>
            {partido.senadores} senador{partido.senadores > 1 ? 'es' : ''}
          </span>
        )}
        {partido.governadores > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
            background: '#ffedd5', color: '#c2410c',
          }}>
            {partido.governadores} gov.
          </span>
        )}
        {partido.dep_estadual > 0 && (
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '3px 9px', borderRadius: 20,
            background: '#dcfce7', color: '#15803d',
          }}>
            {partido.dep_estadual} dep. estadual
          </span>
        )}
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e5e7eb', margin: '0 -20px', paddingTop: 0 }} />

      {/* Presença bar */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 7 }}>
          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 500 }}>Presença média</span>
          <span style={{
            fontSize: 12, fontWeight: 700,
            color: presenca >= 80 ? '#15803d' : presenca >= 60 ? '#b45309' : '#b91c1c',
          }}>
            {partido.presenca_media != null ? `${presenca.toFixed(0)}%` : '—'}
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 99, background: '#f0ece8' }}>
          <div style={{
            height: 5, borderRadius: 99,
            width: `${Math.min(presenca, 100)}%`,
            background: '#8b4513',
            transition: 'width 0.4s',
          }} />
        </div>
      </div>

      {/* Gasto médio mensal */}
      {partido.gasto_medio_mensal != null && partido.gasto_medio_mensal > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#6b7280' }}>Gasto médio/mês (CEAP)</span>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#011549' }}>
            {fmtMoeda(partido.gasto_medio_mensal)}
          </span>
        </div>
      )}

      {/* CTA button */}
      <Link
        href={`/partidos/${partido.sigla.toLowerCase()}`}
        style={{ textDecoration: 'none' }}
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <button
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: 8,
            border: '1.5px solid #2851cb',
            background: hovered ? '#2851cb' : '#fff',
            color: hovered ? '#fff' : '#2851cb',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.18s, color 0.18s',
            letterSpacing: '0.01em',
          }}
        >
          Ver Perfil Completo →
        </button>
      </Link>
    </div>
  )
}

// ─── Placeholder card "explorar outras legendas" ──────────────────────────────
function PlaceholderCard({ count }: { count: number }) {
  const [hovered, setHovered] = useState(false)
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        border: `2px dashed ${hovered ? '#2851cb' : '#c5c6d1'}`,
        borderRadius: 12,
        padding: '32px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        cursor: 'pointer',
        transition: 'border-color 0.18s, background 0.18s',
        background: hovered ? '#f0f4ff' : 'transparent',
        minHeight: 200,
      }}
    >
      <div style={{ fontSize: 32 }}>🧭</div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#011549', marginBottom: 4 }}>
          Explorar as outras {count} legendas ativas
        </div>
        <div style={{ fontSize: 12, color: '#6b7280' }}>
          Clique para ver todos os partidos
        </div>
      </div>
    </div>
  )
}

// ─── Transparência Partidária — bar chart do FP ───────────────────────────────
function FpBarChart({ fpPorAno }: { fpPorAno: FpAno[] }) {
  const max = Math.max(...fpPorAno.map(d => d.total))
  const lastAno = Math.max(...fpPorAno.map(d => d.ano))

  return (
    <div>
      <div style={{
        fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
        color: '#6b7280', marginBottom: 16,
      }}>
        EVOLUÇÃO DO FUNDO PARTIDÁRIO
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 100 }}>
        {fpPorAno.map(({ ano, total }) => {
          const pct = (total / max) * 100
          const isLast = ano === lastAno
          return (
            <div key={ano} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: isLast ? '#2851cb' : '#6b7280',
              }}>
                {fmtMoeda(total).replace('R$ ', '')}
              </div>
              <div style={{
                width: '100%',
                height: `${pct}%`,
                minHeight: 8,
                borderRadius: '4px 4px 0 0',
                background: isLast ? '#2851cb' : '#c5c6d1',
                transition: 'height 0.5s',
              }} />
              <div style={{
                fontSize: 11, fontWeight: isLast ? 700 : 400,
                color: isLast ? '#2851cb' : '#6b7280',
              }}>
                {ano}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Filter pill types ────────────────────────────────────────────────────────
type Filtro = 'todos' | 'grandes' | 'medios' | 'emergentes'
type Ordenar = 'bancada' | 'alfabetica' | 'presenca'

// ─── Main client component ────────────────────────────────────────────────────
export function PartidosClient({
  partidos,
  totalPoliticos,
  fpPorAno,
}: {
  partidos: PartidoCard[]
  totalPoliticos: number
  fpPorAno: FpAno[]
}) {
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [ordenar, setOrdenar] = useState<Ordenar>('bancada')
  const [showOrdenarMenu, setShowOrdenarMenu] = useState(false)
  const ordenarRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // CMD+K / Ctrl+K ativa a busca
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Fechar menu de ordenar ao clicar fora
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ordenarRef.current && !ordenarRef.current.contains(e.target as Node)) {
        setShowOrdenarMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const GRANDES_THRESHOLD  = 50
  const MEDIOS_MIN         = 15
  const MEDIOS_MAX         = 50

  const filtered = useMemo(() => {
    let list = partidos

    // Filtro de busca
    if (q.trim()) {
      const lq = q.toLowerCase()
      list = list.filter(p =>
        p.sigla.toLowerCase().includes(lq) ||
        p.nome.toLowerCase().includes(lq) ||
        (p.numero ?? '').includes(lq)
      )
    }

    // Filtro de tamanho
    if (filtro === 'grandes')   list = list.filter(p => p.total_politicos > GRANDES_THRESHOLD)
    if (filtro === 'medios')    list = list.filter(p => p.total_politicos >= MEDIOS_MIN && p.total_politicos <= MEDIOS_MAX)
    if (filtro === 'emergentes') list = list.filter(p => p.total_politicos < MEDIOS_MIN)

    // Ordenação
    if (ordenar === 'alfabetica') list = [...list].sort((a, b) => a.sigla.localeCompare(b.sigla))
    else if (ordenar === 'presenca') list = [...list].sort((a, b) => (b.presenca_media ?? 0) - (a.presenca_media ?? 0))
    // 'bancada' já vem ordenado do backend

    return list
  }, [partidos, q, filtro, ordenar])

  // Contagens para pills
  const contagens = useMemo(() => ({
    todos:      partidos.length,
    grandes:    partidos.filter(p => p.total_politicos > GRANDES_THRESHOLD).length,
    medios:     partidos.filter(p => p.total_politicos >= MEDIOS_MIN && p.total_politicos <= MEDIOS_MAX).length,
    emergentes: partidos.filter(p => p.total_politicos < MEDIOS_MIN).length,
  }), [partidos])

  // Mostrar 12 cards por padrão + placeholder
  const MOSTRAR_MAX  = 12
  const showPlaceholder = filtro === 'todos' && !q.trim() && filtered.length > MOSTRAR_MAX
  const visiveis       = showPlaceholder ? filtered.slice(0, MOSTRAR_MAX) : filtered
  const restantes      = showPlaceholder ? filtered.length - MOSTRAR_MAX : 0

  const ORDENAR_LABELS: Record<Ordenar, string> = {
    bancada:   'Maior bancada',
    alfabetica: 'A–Z',
    presenca:  'Presença',
  }

  const pillStyle = (ativo: boolean): React.CSSProperties => ({
    padding: '7px 16px',
    borderRadius: 20,
    border: ativo ? 'none' : '1px solid #c5c6d1',
    background: ativo ? '#011549' : '#fff',
    color: ativo ? '#fff' : '#374151',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    whiteSpace: 'nowrap' as const,
  })

  // Média de presença geral
  const presencaGeral = useMemo(() => {
    const comPresenca = partidos.filter(p => p.presenca_media != null)
    if (!comPresenca.length) return null
    return comPresenca.reduce((s, p) => s + (p.presenca_media ?? 0), 0) / comPresenca.length
  }, [partidos])

  return (
    <div className="partidos-page" style={{ minHeight: '100vh', background: '#f8fafd' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, #fff 0%, #f0f4ff 100%)',
        padding: '72px 24px 52px',
        textAlign: 'center',
        borderBottom: '1px solid #e5e7eb',
        marginTop: -100, // cancela o paddingTop do layout (site)
        paddingTop: 172, // 100 (layout) + 72 desejado
      }}>
        {/* Breadcrumb badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
          color: '#2851cb', background: '#eff4ff',
          borderRadius: 20, padding: '4px 12px',
          marginBottom: 20,
        }}>
          🏛 PARTIDOS POLÍTICOS
        </div>

        <h1 style={{
          fontSize: 42, fontWeight: 800, color: '#011549',
          margin: '0 0 16px', lineHeight: 1.1, letterSpacing: '-0.03em',
        }}>
          A Transparência começa aqui.
        </h1>
        <p style={{
          fontSize: 16, color: '#6b7280', maxWidth: 520,
          margin: '0 auto 36px', lineHeight: 1.6,
        }}>
          Explore a bancada, presença e gastos de todos os partidos com representação no Legislativo brasileiro.
        </p>

        {/* Search bar grande */}
        <div style={{
          maxWidth: 580, margin: '0 auto',
          position: 'relative',
        }}>
          <div style={{
            position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)',
            fontSize: 18, color: '#9ca3af', pointerEvents: 'none',
          }}>🔍</div>
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar partido, número ou sigla..."
            value={q}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQ(e.target.value)}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '16px 52px 16px 52px',
              border: '1.5px solid #c5c6d1',
              borderRadius: 12,
              background: '#fff',
              color: '#011549',
              fontSize: 15,
              outline: 'none',
              boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
            onFocus={e => {
              e.currentTarget.style.borderColor = '#2851cb'
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(40,81,203,0.12)'
            }}
            onBlur={e => {
              e.currentTarget.style.borderColor = '#c5c6d1'
              e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'
            }}
          />
          {/* CMD+K badge */}
          <div style={{
            position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', gap: 3,
          }}>
            <kbd style={{
              fontSize: 10, fontWeight: 600, color: '#9ca3af',
              background: '#f3f4f6', border: '1px solid #e5e7eb',
              borderRadius: 4, padding: '2px 5px',
            }}>⌘K</kbd>
          </div>
        </div>

        {/* KPI strip */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 40,
          marginTop: 36, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Partidos ativos', value: partidos.length },
            { label: 'Parlamentares', value: fmt(totalPoliticos) },
            { label: 'Estados representados', value: '27' },
          ].map(kpi => (
            <div key={kpi.label} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 28, fontWeight: 800, color: '#011549', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{kpi.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '24px 24px 0',
        display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
      }}>
        {/* Label */}
        <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: '#9ca3af', marginRight: 4,
        }}>FILTRAR POR:</span>

        {/* Pills de tamanho */}
        <button style={pillStyle(filtro === 'todos')} onClick={() => setFiltro('todos')}>
          Todos ({contagens.todos})
        </button>
        <button style={pillStyle(filtro === 'grandes')} onClick={() => setFiltro('grandes')}>
          Grandes Bancadas ({contagens.grandes})
        </button>
        <button style={pillStyle(filtro === 'medios')} onClick={() => setFiltro('medios')}>
          Médios ({contagens.medios})
        </button>
        <button style={pillStyle(filtro === 'emergentes')} onClick={() => setFiltro('emergentes')}>
          Legendas Emergentes ({contagens.emergentes})
        </button>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Ordenar dropdown */}
        <div ref={ordenarRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setShowOrdenarMenu(v => !v)}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid #c5c6d1',
              background: '#fff',
              color: '#374151',
              fontSize: 13, fontWeight: 600,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            Ordenar: {ORDENAR_LABELS[ordenar]} ▾
          </button>
          {showOrdenarMenu && (
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)',
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
              zIndex: 50, minWidth: 160, overflow: 'hidden',
            }}>
              {(['bancada', 'alfabetica', 'presenca'] as Ordenar[]).map(op => (
                <button
                  key={op}
                  onClick={() => { setOrdenar(op); setShowOrdenarMenu(false) }}
                  style={{
                    width: '100%', textAlign: 'left',
                    padding: '10px 16px',
                    border: 'none',
                    background: ordenar === op ? '#eff4ff' : '#fff',
                    color: ordenar === op ? '#2851cb' : '#374151',
                    fontSize: 13, fontWeight: ordenar === op ? 700 : 400,
                    cursor: 'pointer',
                    display: 'block',
                  }}
                >
                  {ORDENAR_LABELS[op]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Contagem de resultados ────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '12px auto 0', padding: '0 24px' }}>
        <span style={{ fontSize: 12, color: '#9ca3af' }}>
          {filtered.length} partido{filtered.length !== 1 ? 's' : ''}
          {q ? ` para "${q}"` : ''}
        </span>
      </div>

      {/* ── Grid de cards ────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 24px 0' }}>
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '80px 24px',
            color: '#9ca3af', fontSize: 15,
          }}>
            {partidos.length === 0
              ? 'Nenhum partido encontrado. Execute o ETL para importar os dados.'
              : `Nenhum partido corresponde a "${q}".`
            }
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))',
            gap: 20,
          }}>
            {visiveis.map(partido => (
              <PartidoCardItem key={partido.id} partido={partido} />
            ))}
            {showPlaceholder && restantes > 0 && (
              <div onClick={() => setFiltro('todos')}>
                <PlaceholderCard count={restantes} />
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Transparência Partidária ──────────────────────────────────────── */}
      <div style={{ maxWidth: 1200, margin: '60px auto 0', padding: '0 24px 80px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(197,198,209,0.7)',
          borderRadius: 16,
          padding: '36px 40px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
          gap: 48,
          alignItems: 'center',
        }}>
          {/* Coluna esquerda — texto e métricas */}
          <div>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
              color: '#2851cb', marginBottom: 12,
            }}>
              DADOS ABERTOS
            </div>
            <h2 style={{
              fontSize: 26, fontWeight: 800, color: '#011549',
              margin: '0 0 12px', lineHeight: 1.2,
            }}>
              Transparência Partidária
            </h2>
            <p style={{
              fontSize: 14, color: '#6b7280', lineHeight: 1.6, margin: '0 0 28px',
            }}>
              O Fundo Partidário é distribuído pelo TSE aos partidos com representação no Congresso.
              Os dados abaixo são oficiais e atualizados anualmente.
            </p>

            {/* Métricas */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {presencaGeral != null && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 18px',
                  background: '#f8fafd',
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                      Presença média geral
                    </div>
                    <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                      Todos os partidos ativos
                    </div>
                  </div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#2851cb' }}>
                    {presencaGeral.toFixed(1)}%
                  </div>
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafd',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                    Partidos com representação
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    Câmara + Senado
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2851cb' }}>
                  {partidos.length}
                </div>
              </div>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px',
                background: '#f8fafd',
                borderRadius: 10,
                border: '1px solid #e5e7eb',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280' }}>
                    Total parlamentares
                  </div>
                  <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                    Mandato ativo
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#2851cb' }}>
                  {fmt(totalPoliticos)}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna direita — gráfico de barras FP */}
          <div>
            <FpBarChart fpPorAno={fpPorAno} />
            <p style={{
              fontSize: 11, color: '#9ca3af', marginTop: 16, lineHeight: 1.5,
            }}>
              Fonte: TSE — Dados do Fundo Partidário distribuídos anualmente aos partidos com representação no Congresso Nacional.
            </p>
          </div>
        </div>
      </div>
      <style>{`
        .partidos-page,
        .partidos-page * {
          box-sizing: border-box;
        }
        .partidos-page input,
        .partidos-page button,
        .partidos-page select {
          max-width: 100%;
        }
        .partidos-page [style*="display: flex"] > * {
          min-width: 0;
        }
      `}</style>
    </div>
  )
}
