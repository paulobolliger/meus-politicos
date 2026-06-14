'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import type { VotacaoRecente } from '@/app/(site)/page'
import { GlossarioTooltip, TERMOS_GLOSSARIO } from '@/components/glossario/GlossarioTooltip'

type StateDot = { uf: string; x: number; y: number; n: number }

const STATES: StateDot[] = [
  { uf: 'AM', x: 22, y: 36, n: 8 }, { uf: 'RR', x: 26, y: 16, n: 8 },
  { uf: 'AP', x: 48, y: 18, n: 8 }, { uf: 'PA', x: 45, y: 30, n: 17 },
  { uf: 'AC', x: 10, y: 42, n: 8 }, { uf: 'RO', x: 22, y: 48, n: 8 },
  { uf: 'TO', x: 53, y: 44, n: 8 }, { uf: 'MA', x: 60, y: 32, n: 18 },
  { uf: 'PI', x: 65, y: 41, n: 10 }, { uf: 'CE', x: 73, y: 33, n: 22 },
  { uf: 'RN', x: 81, y: 35, n: 8 }, { uf: 'PB', x: 84, y: 40, n: 12 },
  { uf: 'PE', x: 79, y: 44, n: 25 }, { uf: 'AL', x: 82, y: 49, n: 9 },
  { uf: 'SE', x: 78, y: 52, n: 8 }, { uf: 'BA', x: 70, y: 56, n: 39 },
  { uf: 'MT', x: 42, y: 54, n: 8 }, { uf: 'GO', x: 53, y: 60, n: 17 },
  { uf: 'DF', x: 58, y: 58, n: 8 }, { uf: 'MG', x: 63, y: 65, n: 53 },
  { uf: 'ES', x: 73, y: 66, n: 10 }, { uf: 'RJ', x: 67, y: 71, n: 46 },
  { uf: 'SP', x: 58, y: 72, n: 70 }, { uf: 'PR', x: 51, y: 78, n: 30 },
  { uf: 'SC', x: 53, y: 84, n: 16 }, { uf: 'RS', x: 46, y: 92, n: 31 },
  { uf: 'MS', x: 45, y: 68, n: 8 },
]

const UF_NOMES: Record<string, string> = {
  AM: 'Amazonas', RR: 'Roraima', AP: 'Amapá', PA: 'Pará', AC: 'Acre',
  RO: 'Rondônia', TO: 'Tocantins', MA: 'Maranhão', PI: 'Piauí', CE: 'Ceará',
  RN: 'Rio Grande do Norte', PB: 'Paraíba', PE: 'Pernambuco', AL: 'Alagoas',
  SE: 'Sergipe', BA: 'Bahia', MT: 'Mato Grosso', GO: 'Goiás',
  DF: 'Distrito Federal', MG: 'Minas Gerais', ES: 'Espírito Santo',
  RJ: 'Rio de Janeiro', SP: 'São Paulo', PR: 'Paraná',
  SC: 'Santa Catarina', RS: 'Rio Grande do Sul', MS: 'Mato Grosso do Sul',
}

function BrazilDots({ active, onPick }: { active: string; onPick: (uf: string) => void }) {
  const maxN = Math.max(...STATES.map((s) => s.n))
  return (
    <div style={{ position: 'relative', height: 460, width: '100%' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
        {/* Mapa base do Brasil */}
        <image
          href="/brazil-map.svg"
          x="-3" y="0" width="105" height="100"
          preserveAspectRatio="xMidYMid meet"
          style={{ opacity: 0.18 }}
        />
        {/* Pontos interativos */}
        {STATES.map((s) => {
          const r = 1.2 + (s.n / maxN) * 2.6
          const isActive = s.uf === active
          return (
            <g key={s.uf} style={{ cursor: 'pointer' }} onClick={() => onPick(s.uf)}>
              <circle cx={s.x} cy={s.y} r={r + 1.6} fill="var(--brand-2)" opacity={isActive ? 0.18 : 0} />
              <circle cx={s.x} cy={s.y} r={r} fill={isActive ? 'var(--accent)' : 'var(--brand)'} opacity={isActive ? 1 : 0.78} />
              <text x={s.x} y={s.y - r - 1.2} fontFamily="var(--font-mono)" fontSize="2.2"
                textAnchor="middle" fill={isActive ? 'var(--ink)' : 'var(--ink-3)'} fontWeight={isActive ? 700 : 500}>
                {s.uf}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Card compartilhado ───────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--panel)',
  border: '1px solid var(--line)',
  borderRadius: 16,
  padding: 24,
  boxShadow: '0 1px 3px rgba(0,0,0,0.05), 0 1px 8px rgba(0,0,0,0.03)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function HomeCidadaoClient({
  estatisticas,
}: {
  recentVotacoes?: VotacaoRecente[]
  estatisticas?: {
    ceap?: { total: number; registros: number; politicos: number; ano: number } | null
    emendas?: { totalPago: number; totalEmpenhado: number; municipios: number; politicos: number; ano: number } | null
    representantes?: { total: number; camara: number; senado: number; presencaMedia: number | null } | null
    legislativo?: { total: number; pls: number; mpvs: number; pecs: number; novasAno: number; ano: number } | null
    bancadas?: Array<{ sigla: string; count: number }> | null
    presencaEstado?: Array<{ uf: string; avgPresenca: number }> | null
    cidadesEmendas?: Array<{ nome: string; uf: string; total: number }> | null
  }
}) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeUf, setActiveUf] = useState('SP')
  const [suggestions, setSuggestions] = useState<Array<{
    id: string
    slug: string
    nome?: string
    nome_eleitoral?: string | null
    foto_url?: string | null
    cargo?: string
    uf?: string | null
    partidos?: { sigla?: string | null } | null
  }>>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [, setSuggestionsLoading] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)

  // Debounced autocomplete search on the homepage
  useEffect(() => {
    const trimmed = query.trim()
    if (!trimmed || trimmed.length < 2) {
      return
    }

    const timer = setTimeout(async () => {
      setSuggestionsLoading(true)
      try {
        const res = await fetch(`/api/busca?q=${encodeURIComponent(trimmed)}`)
        if (res.ok) {
          const json = await res.json()
          setSuggestions(json.items?.slice(0, 5) ?? [])
          setShowSuggestions(true)
        }
      } catch (err) {
        console.error('Erro ao buscar sugestões:', err)
      } finally {
        setSuggestionsLoading(false)
      }
    }, 250)

    return () => clearTimeout(timer)
  }, [query])

  // Click outside listener to close autocomplete suggestion list
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const activeState = useMemo(() => STATES.find((s) => s.uf === activeUf) ?? STATES[0], [activeUf])

  function formatReal(val: number): string {
    if (val >= 1_000_000_000) {
      return `R$ ${(val / 1_000_000_000).toFixed(1).replace('.', ',')} bilhões`
    }
    if (val >= 1_000_000) {
      return `R$ ${(val / 1_000_000).toFixed(1).replace('.', ',')} milhões`
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val)
  }

  function formatInt(val: number): string {
    return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 0 }).format(val)
  }

  const dadosReaisBadge = (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wider text-[#10B981] bg-[#10B981]/10 border border-[#10B981]/20 uppercase select-none shrink-0">
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75"></span>
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#10B981]"></span>
      </span>
      Dados Reais
    </span>
  )

  const exploreItems = [
    {
      href: '/emendas',
      titulo: 'Emendas Parlamentares',
      desc: 'Consulte os investimentos e repasses indicados por deputados e senadores para os municípios.',
      iconBg: 'rgba(59,130,246,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#3b82f6' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      href: '/projetos',
      titulo: 'Projetos de Lei & Leis',
      desc: 'Acompanhe PLs, PECs e MPVs em tramitação e saiba como mudam a legislação brasileira.',
      iconBg: 'rgba(139,92,246,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#8b5cf6' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 0-2 2V5a2 2 0 0 0 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z" />
        </svg>
      )
    },
    {
      href: '/glossario',
      titulo: 'Glossário Político',
      desc: 'Entenda de forma simples o significado de termos como CEAP, emendas, quórum e obstrução.',
      iconBg: 'rgba(4,108,78,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#10b981' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      )
    },
    {
      href: '/eleicao/2026',
      titulo: 'Eleições 2026',
      desc: 'Monitore candidates declarados, propostas de governo e estatísticas eleitorais.',
      iconBg: 'rgba(217,119,6,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#f59e0b' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      )
    },
    {
      href: '/busca',
      titulo: 'Políticos & Candidatos',
      desc: 'Busque o histórico, presença nas sessões, gastos com CEAP e votos de deputados e senadores.',
      iconBg: 'rgba(13,148,136,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#0d9488' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0zM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7z" />
        </svg>
      )
    },
    {
      href: '/estado',
      titulo: 'Estados & Assembleias',
      desc: 'Compare a assiduidade dos estados e veja a atuação dos deputados estaduais.',
      iconBg: 'rgba(6,182,212,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#06b6d4' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-.553-.894L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    },
    {
      href: '/cidades',
      titulo: 'Municípios & Cidades',
      desc: 'Consulte o valor total das emendas que chegaram para cada cidade e o ranking per capita.',
      iconBg: 'rgba(14,165,233,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#0ea5e9' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
        </svg>
      )
    },
    {
      href: '/eleicao/2026/presidente',
      titulo: 'Poder Executivo',
      desc: 'Analise as propostas da Presidência, ministérios, governadores e andamento do Executivo.',
      iconBg: 'rgba(244,63,94,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#f43f5e' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11m4-11v11m4-11v11m4-11v11m4-11v11" />
        </svg>
      )
    },
    {
      href: '/partidos',
      titulo: 'Partidos Políticos',
      desc: 'Veja a força das bancadas no Congresso Nacional, taxas de fidelidade partidária e orientações.',
      iconBg: 'rgba(217,70,239,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#d946ef' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 0 1 2-2h6.5l1 1H21v12h-7.5l-1-1H5a2 2 0 0 0-2 2zm9-13.5V9" />
        </svg>
      )
    },
    {
      href: '/busca',
      titulo: 'Despesas & CEAP',
      desc: 'Rastreie em detalhes o dinheiro público usado para reembolso de cotas e manutenção de mandatos.',
      iconBg: 'rgba(234,179,8,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#eab308' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      )
    },
    {
      href: '/estado',
      titulo: 'Presença & Assiduidade',
      desc: 'Monitore os parlamentares mais assíduos e quem mais faltou nas sessões deliberativas.',
      iconBg: 'rgba(132,204,22,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#84cc16' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0-2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z" />
        </svg>
      )
    },
    {
      href: '/busca',
      titulo: 'Votações & Votos',
      desc: 'Veja o posicionamento de cada representante em votações nominais cruciais e reformas.',
      iconBg: 'rgba(239,68,68,0.08)',
      icon: (
        <svg style={{ width: 18, height: 18, color: '#ef4444' }} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
        </svg>
      )
    }
  ]

  function onSubmitSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    router.push(`/busca?q=${encodeURIComponent(q)}`)
  }

  return (
    <>
      <main style={{ background: 'var(--bg)' }}>

        {/* ── HERO + STATS (2/3 + 1/3) ── */}
        <section style={{ padding: '72px 24px 80px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-12 items-center max-w-[1200px] mx-auto">

            {/* ── Coluna esquerda — texto + busca ── */}
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(36px, 5vw, 58px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--ink)', fontWeight: 700 }}>
                Transparência para{' '}
                <span style={{ color: 'var(--brand-2)' }}>decidir melhor</span>
              </h1>

              <p style={{ marginTop: 20, fontSize: 'clamp(15px, 1.6vw, 17px)', lineHeight: 1.65, color: 'var(--ink-3)', maxWidth: 500 }}>
                Acesse dados oficiais do governo brasileiro de forma clara e direta. Sem complicação.
              </p>

              <form ref={formRef} onSubmit={onSubmitSearch} style={{ marginTop: 36, position: 'relative' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 0,
                  background: 'var(--panel)', border: '1px solid var(--line-strong)',
                  borderRadius: 12, padding: '10px 10px 10px 20px',
                  boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
                  maxWidth: 540,
                }}>
                  <input
                    value={query}
                    onChange={(e) => {
                      const nextQuery = e.target.value
                      setQuery(nextQuery)
                      if (nextQuery.trim().length < 2) {
                        setSuggestions([])
                        setShowSuggestions(false)
                      }
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setShowSuggestions(true)
                    }}
                    placeholder="Nome, cargo, partido ou estado"
                    style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}
                  />
                  <button type="submit" style={{
                    height: 44, padding: '0 22px', borderRadius: 8,
                    backgroundColor: '#8B5CF6', border: 'none', cursor: 'pointer',
                    color: '#ffffff', fontSize: 14, fontWeight: 700, flexShrink: 0,
                  }} className="bg-[#8B5CF6] hover:bg-[#7C3AED] text-white transition-colors duration-150">
                    Buscar
                  </button>
                </div>

                {/* Popover de Sugestões */}
                {showSuggestions && suggestions.length > 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    marginTop: 8,
                    background: 'rgba(30, 41, 59, 0.96)',
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
                    zIndex: 50,
                    overflow: 'hidden',
                    maxWidth: 540,
                  }}>
                    <div style={{ padding: '8px 12px', borderBottom: '1px solid rgba(255, 255, 255, 0.06)', fontSize: 10, color: 'var(--ink-3)', fontWeight: 700, letterSpacing: '0.05em' }}>
                      SUGESTÕES DE POLÍTICOS
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {suggestions.map((p) => {
                        const labelCargo = p.cargo === 'deputado_federal' ? 'Dep. Federal' : p.cargo === 'senador' ? 'Senador' : p.cargo
                        return (
                          <Link
                            key={p.id}
                            href={`/politicos/${p.slug}`}
                            onClick={() => setShowSuggestions(false)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 12,
                              padding: '10px 16px',
                              textDecoration: 'none',
                              color: 'inherit',
                              borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
                              transition: 'background 0.15s ease',
                            }}
                            className="hover:bg-slate-800/80"
                          >
                            <div style={{
                              width: 32,
                              height: 40,
                              borderRadius: 4,
                              overflow: 'hidden',
                              position: 'relative',
                              background: '#090d16',
                              flexShrink: 0
                            }}>
                              {p.foto_url ? (
                                <Image
                                  src={p.foto_url}
                                  alt=""
                                  width={40}
                                  height={40}
                                  unoptimized
                                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                />
                              ) : (
                                <div style={{
                                  width: '100%', height: '100%', display: 'flex', alignItems: 'center',
                                  justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'var(--brand)',
                                }}>
                                  {p.nome_eleitoral?.slice(0, 2).toUpperCase() || 'P'}
                                </div>
                              )}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#FFFFFF', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.nome_eleitoral || p.nome}
                              </div>
                              <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                                <span style={{ fontWeight: 700, color: 'var(--brand-2)' }}>{p.partidos?.sigla || '–'}</span> · {p.uf || '–'} · {labelCargo}
                              </div>
                            </div>
                            <div style={{ fontSize: 11, color: 'var(--brand-2)', fontWeight: 600 }}>
                              Ver perfil →
                            </div>
                          </Link>
                        )
                      })}
                    </div>
                    <Link
                      href={`/busca?q=${encodeURIComponent(query)}`}
                      onClick={() => setShowSuggestions(false)}
                      style={{
                        display: 'block',
                        padding: '10px 16px',
                        textAlign: 'center',
                        fontSize: 12,
                        color: 'var(--ink-2)',
                        background: 'rgba(255, 255, 255, 0.02)',
                        textDecoration: 'none',
                        fontWeight: 600,
                      }}
                      className="hover:bg-slate-800/50 hover:text-white"
                    >
                      Ver todos os resultados para &quot;{query}&quot; →
                    </Link>
                  </div>
                )}
              </form>

              <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-3)' }}>
                Ou pesquise direto:{' '}
                {['Lula', 'Tarcísio de Freitas', 'Tabata Amaral', 'Eduardo Leite'].map((n, idx) => (
                  <button key={n} type="button" onClick={() => router.push(`/busca?q=${encodeURIComponent(n)}`)}
                    style={{ border: 'none', background: 'transparent', color: '#818CF8', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13 }}
                    className="hover:underline text-[#818CF8] hover:text-[#A5B4FC]">
                    {idx > 0 ? ' · ' : ''}{n}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Coluna direita — 3 cards empilhados ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              {/* Card 1 — Emendas */}
              <div style={{ ...cardStyle, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                    </svg>
                  </div>
                  <span className="label">Investimentos 2024</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--accent-gold)', lineHeight: 1 }}>
                  R$ 54,2 Bilhões
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
                  Em{' '}
                  <GlossarioTooltip termo="emenda parlamentar" slug={TERMOS_GLOSSARIO['emenda parlamentar']?.slug ?? 'emenda-parlamentar'} definicaoSimples={TERMOS_GLOSSARIO['emenda parlamentar']?.definicaoSimples}>
                    emendas parlamentares
                  </GlossarioTooltip>
                  {' '}empenhadas.
                </p>
              </div>

              {/* Card 2 — Projetos */}
              <div style={{ ...cardStyle, padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(4,108,78,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                  </div>
                  <span className="label">Atividade Legislativa</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--pos)', lineHeight: 1 }}>
                  1.432 Projetos
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-3)' }}>
                  Votados nas duas casas este semestre.
                </p>
              </div>

              {/* Card 3 — Representantes (escuro) */}
              <div style={{ ...cardStyle, padding: '18px 20px', background: 'var(--brand)', border: '1px solid var(--brand)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span className="label" style={{ color: 'rgba(255,255,255,0.65)' }}>Ecossistema Público</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'white', lineHeight: 1 }}>
                  594 Representantes
                </div>
                <p style={{ margin: '6px 0 0', fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>
                  Monitorados em tempo real pela plataforma.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── SEÇÃO METRICAS E DADOS REAIS ── */}
        <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            
            {/* Cabeçalho Unificado */}
            <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="label">DADOS REAIS DA PLATAFORMA</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                Transparência em números
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 800 }}>
                Analisamos a atuação de políticos com base em dados oficiais de gastos, presença e votações nominais, sem filtros ideológicos ou julgamento moral.{' '}
                <Link href="/como-funciona" style={{ color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none' }} className="hover:underline">
                  Entenda como funciona →
                </Link>
              </p>
            </div>

            {/* Grid 3x2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr gap-4">

              {/* Card 1 — Cotas CEAP */}
              <Link href="/busca" className="group flex flex-col no-underline h-full">
                <article className="flex-1 flex flex-col p-6 rounded-2xl bg-panel border border-line group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300 ease-out">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                        </svg>
                      </div>
                      <span className="label">Cotas CEAP · {estatisticas?.ceap?.ano ?? 2026}</span>
                    </div>
                    {dadosReaisBadge}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--accent-gold)', lineHeight: 1, marginBottom: 4 }}>
                    {estatisticas?.ceap ? formatReal(estatisticas.ceap.total) : 'R$ 250,8 milhões'}
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Total de cotas parlamentares gastas em {estatisticas?.ceap?.ano ?? 2026}, distribuídas em 25 categorias de despesa.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16, marginTop: 'auto' }}>
                    {[
                      {
                        label: `${estatisticas?.ceap ? formatInt(estatisticas.ceap.politicos) : '548'} parlamentares com gasto`,
                        pct: estatisticas?.ceap && estatisticas?.representantes
                          ? Math.min(100, Math.round((estatisticas.ceap.politicos / estatisticas.representantes.total) * 100))
                          : 92
                      },
                      {
                        label: `${estatisticas?.ceap ? formatInt(estatisticas.ceap.registros) : '184.285'} registros no período`,
                        pct: 100
                      },
                    ].map((r) => (
                      <div key={r.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 3 }}>
                          <span>{r.label}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${r.pct}%`, background: 'var(--accent-gold)', opacity: 0.6 }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                    <span className="mr-1">Explorar gastos</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </article>
              </Link>

              {/* Card 2 — Bancadas Partidárias */}
              <Link href="/partidos" className="group flex flex-col no-underline h-full">
                <article className="flex-1 flex flex-col p-6 rounded-2xl bg-panel border border-line group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300 ease-out">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(124,58,237,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                        </svg>
                      </div>
                      <span className="label">Bancadas Partidárias</span>
                    </div>
                    {dadosReaisBadge}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: '#7c3aed', lineHeight: 1, marginBottom: 4 }}>
                    Força no Congresso
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Maiores representações partidárias ativas na Câmara dos Deputados e no Senado Federal.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, marginTop: 'auto' }}>
                    {(estatisticas?.bancadas && estatisticas.bancadas.length > 0 ? estatisticas.bancadas : [
                      { sigla: 'PL', count: 99 },
                      { sigla: 'PT', count: 81 },
                      { sigla: 'UNIÃO', count: 59 }
                    ]).map((b) => {
                      const maxB = estatisticas?.bancadas && estatisticas.bancadas.length > 0
                        ? Math.max(...estatisticas.bancadas.map(x => x.count))
                        : 99
                      const pct = Math.max(10, Math.round((b.count / maxB) * 100))
                      return (
                        <div key={b.sigla}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-2)', marginBottom: 2 }}>
                            <span style={{ fontWeight: 700 }}>{b.sigla}</span>
                            <span className="mono">{b.count} parlamentares</span>
                          </div>
                          <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand)' }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                    <span className="mr-1">Ver partidos no Congresso</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </article>
              </Link>

              {/* Card 3 — Emendas Parlamentares */}
              <Link href="/emendas" className="group flex flex-col no-underline h-full">
                <article className="flex-1 flex flex-col p-6 rounded-2xl bg-panel border border-line group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300 ease-out">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(29,58,138,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      </div>
                      <span className="label">Emendas parlamentares · {estatisticas?.emendas?.ano ?? 2026}</span>
                    </div>
                    {dadosReaisBadge}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--brand)', lineHeight: 1, marginBottom: 4 }}>
                    {estatisticas?.emendas ? `${formatReal(estatisticas.emendas.totalPago)} pagos` : 'R$ 28,6 bilhões pagos'}
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    {estatisticas?.emendas
                      ? `De ${formatReal(estatisticas.emendas.totalEmpenhado)} empenhados, chegaram aos municípios ${formatReal(estatisticas.emendas.totalPago)} via emendas.`
                      : 'De R$ 44,9 bilhões empenhados, chegaram aos municípios R$ 28,6 bi via emendas individuais.'}
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--ink-3)', marginBottom: 4 }}>
                      <span>Pago vs. Empenhado</span>
                      <span className="mono" style={{ color: 'var(--brand)' }}>
                        {estatisticas?.emendas && estatisticas.emendas.totalEmpenhado > 0
                          ? Math.min(100, Math.round((estatisticas.emendas.totalPago / estatisticas.emendas.totalEmpenhado) * 100))
                          : 64}%
                      </span>
                    </div>
                    <div style={{ height: 6, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%',
                        width: `${estatisticas?.emendas && estatisticas.emendas.totalEmpenhado > 0
                          ? Math.min(100, Math.round((estatisticas.emendas.totalPago / estatisticas.emendas.totalEmpenhado) * 100))
                          : 64}%`,
                        background: 'var(--brand)'
                      }} />
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                    <span className="mr-1">Explorar emendas</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </article>
              </Link>

              {/* Card 4 — Atividade & Representantes */}
              <Link href="/busca" className="group flex flex-col no-underline h-full">
                <article className="flex-1 flex flex-col p-6 rounded-2xl bg-panel border border-line group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300 ease-out">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(4,108,78,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                        </svg>
                      </div>
                      <span className="label">Atividade & Representantes</span>
                    </div>
                    {dadosReaisBadge}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--pos)', lineHeight: 1, marginBottom: 4 }}>
                    {estatisticas?.representantes ? `${formatInt(estatisticas.representantes.total)} parlamentares` : '594 parlamentares'}
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Câmara e Senado federais monitorados em tempo real — presença, gastos e {estatisticas?.legislativo ? formatInt(estatisticas.legislativo.total) : '22.384'} proposições legislativas desde 2004.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-3)' }}>Deputados Federais / Senadores</span>
                      <span className="mono" style={{ fontWeight: 700, color: 'var(--pos)', fontSize: 13 }}>
                        {estatisticas?.representantes ? `${formatInt(estatisticas.representantes.camara)} / ${formatInt(estatisticas.representantes.senado)}` : '513 / 81'}
                      </span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--line)', paddingTop: 8, fontSize: 12, color: 'var(--ink-3)' }}>
                      Presença média em plenário:{' '}
                      <strong style={{ color: 'var(--ink)' }}>
                        {estatisticas?.representantes?.presencaMedia != null
                          ? `${estatisticas.representantes.presencaMedia.toFixed(1).replace('.', ',')}%`
                          : '63,2%'}
                      </strong>
                    </div>
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                    <span className="mr-1">Buscar representante</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </article>
              </Link>

              {/* Card 5 — Presença por Estado */}
              <Link href="/estado" className="group flex flex-col no-underline h-full">
                <article className="flex-1 flex flex-col p-6 rounded-2xl bg-panel border border-line group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300 ease-out">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(4,108,78,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/>
                        </svg>
                      </div>
                      <span className="label">Presença Média por Estado</span>
                    </div>
                    {dadosReaisBadge}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--pos)', lineHeight: 1, marginBottom: 4 }}>
                    Fidelidade Cívica
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Unidades federativas (UFs) cujos deputados e senadores registram melhor assiduidade em sessões.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, marginTop: 'auto' }}>
                    {(estatisticas?.presencaEstado && estatisticas.presencaEstado.length > 0 ? estatisticas.presencaEstado : [
                      { uf: 'DF', avgPresenca: 94.2 },
                      { uf: 'RS', avgPresenca: 91.5 },
                      { uf: 'SC', avgPresenca: 89.8 }
                    ]).map((ufData, idx) => (
                      <div key={ufData.uf} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{idx + 1}º. {UF_NOMES[ufData.uf] ?? ufData.uf} ({ufData.uf})</span>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--pos)' }}>
                          {ufData.avgPresenca.toFixed(1).replace('.', ',')}%
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                    <span className="mr-1">Ver rankings por estado</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </article>
              </Link>

              {/* Card 6 — Emendas por Município */}
              <Link href="/cidades" className="group flex flex-col no-underline h-full">
                <article className="flex-1 flex flex-col p-6 rounded-2xl bg-panel border border-line group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)] transition-all duration-300 ease-out">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, gap: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(29,58,138,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16"/>
                        </svg>
                      </div>
                      <span className="label">Emendas por Município</span>
                    </div>
                    {dadosReaisBadge}
                  </div>
                  <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--brand)', lineHeight: 1, marginBottom: 4 }}>
                    Maiores Destinos
                  </div>
                  <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                    Municípios que mais receberam recursos totais de emendas parlamentares federais catalogadas.
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16, marginTop: 'auto' }}>
                    {(estatisticas?.cidadesEmendas && estatisticas.cidadesEmendas.length > 0 ? estatisticas.cidadesEmendas : [
                      { nome: 'São Paulo', uf: 'SP', total: 125_000_000 },
                      { nome: 'Rio de Janeiro', uf: 'RJ', total: 82_000_000 },
                      { nome: 'Salvador', uf: 'BA', total: 45_000_000 }
                    ]).map((city, idx) => (
                      <div key={`${city.nome}-${city.uf}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12 }}>
                        <span style={{ color: 'var(--ink-2)' }}>{idx + 1}º. {city.nome} ({city.uf})</span>
                        <span className="mono" style={{ fontWeight: 700, color: 'var(--brand)' }}>
                          {formatReal(city.total).replace('bilhões', 'bi').replace('milhões', 'mi')}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                    <span className="mr-1">Ver todas as cidades</span>
                    <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                  </div>
                </article>
              </Link>

            </div>

          </div>
        </section>

        {/* ── SEÇÃO EXPLORE MAIS (GRID 3x4) ── */}
        <section style={{ padding: '80px 24px', borderTop: '1px solid var(--line)' }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            
            <div style={{ marginBottom: 40, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="label">PORTAL DE ANÁLISE CÍVICA</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                Explore mais temas da política
              </h2>
              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3)', lineHeight: 1.6, maxWidth: 800 }}>
                Navegue pelas áreas especializadas do portal para auditar gastos, consultar projetos e entender a atuação dos governantes.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 auto-rows-fr gap-4">
              {exploreItems.map((item, idx) => (
                <Link key={idx} href={item.href} className="group flex flex-col no-underline h-full">
                  <article style={{ ...cardStyle, transition: 'all 0.3s ease-out' }} className="bg-panel border border-line flex-1 flex flex-col p-6 group-hover:border-brand group-hover:shadow-[0_0_20px_rgba(99,102,241,0.12)]">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: item.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.icon}
                      </div>
                      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>
                        {item.titulo}
                      </h3>
                    </div>
                    <p style={{ margin: 0, fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
                      {item.desc}
                    </p>
                    <div style={{ marginTop: 'auto', paddingTop: 16 }} className="inline-flex items-center text-xs font-bold text-[#818CF8] group-hover:text-[#A5B4FC] group-hover:underline transition-colors duration-200">
                      <span className="mr-1">Ver detalhes</span>
                      <span className="transform group-hover:translate-x-1 transition-transform duration-200">→</span>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

          </div>
        </section>

        {/* ── EXPLORE POR REGIÃO ── */}
        <section style={{ padding: '80px 24px' }}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center max-w-[1100px] mx-auto">
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 42px)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                Explore por Região
              </h2>
              <p style={{ marginTop: 14, fontSize: 15, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 440 }}>
                Clique no seu estado para ver o ranking de transparência, gastos parlamentares locais e quem são seus representantes.
              </p>

              <div style={{ marginTop: 24, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {['SP', 'RJ', 'MG', 'BA', 'PR'].map((uf) => (
                  <button
                    key={uf}
                    onClick={() => setActiveUf(uf)}
                    style={{
                      padding: '8px 18px', borderRadius: 8,
                      border: `1px solid ${activeUf === uf ? 'var(--brand-2)' : 'var(--line-strong)'}`,
                      background: activeUf === uf ? 'var(--brand-soft)' : 'var(--panel)',
                      color: activeUf === uf ? 'var(--brand-2)' : 'var(--ink-2)',
                      fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {uf_nomes_curtos[uf] ?? uf}
                  </button>
                ))}
                <Link href="/estado" style={{
                  padding: '8px 18px', borderRadius: 8,
                  background: 'var(--brand-2)', color: 'white',
                  fontSize: 13, fontWeight: 700, textDecoration: 'none',
                  display: 'inline-flex', alignItems: 'center',
                }}>
                  Ver todos
                </Link>
              </div>

              <div style={{ marginTop: 24, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)', padding: '18px 20px' }}>
                <div style={{ fontSize: 52, lineHeight: 1, letterSpacing: '-0.04em', color: 'var(--accent)', fontWeight: 700 }}>
                  {activeUf}
                </div>
                <div style={{ marginTop: 4, fontSize: 15, color: 'var(--ink-2)', fontWeight: 600 }}>{UF_NOMES[activeUf]}</div>
                <div style={{ marginTop: 2, fontSize: 13, color: 'var(--ink-3)' }}>{activeState.n} representantes federais</div>
                <Link href={`/busca?uf=${activeUf}`} style={{
                  marginTop: 14, display: 'inline-flex', alignItems: 'center',
                  height: 38, padding: '0 14px', borderRadius: 8,
                  background: 'var(--brand)', color: 'white', textDecoration: 'none',
                  fontSize: 13, fontWeight: 700,
                }}>
                  Ver representantes de {activeUf} →
                </Link>
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <BrazilDots active={activeUf} onPick={setActiveUf} />
            </div>
          </div>
        </section>



      </main>
    </>
  )
}

// Nomes curtos para os botões de estado rápido
const uf_nomes_curtos: Record<string, string> = {
  SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Minas Gerais', BA: 'Bahia', PR: 'Paraná',
}
