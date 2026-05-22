'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'
import { GlossarioTooltip, TERMOS_GLOSSARIO } from '@/components/glossario/GlossarioTooltip'
import type { VotacaoRecente } from '@/app/(site)/page'
import { CookieBanner } from '@/components/site/CookieBanner'

// ─── Dados dos estados ───────────────────────────────────────────────────────

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

// ─── Mini-componentes ─────────────────────────────────────────────────────────

function PresencaRingMini({ value }: { value: number }) {
  const r = 38
  const c = 2 * Math.PI * r
  const off = c - (value / 100) * c
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="8" />
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--pos)" strokeWidth="8"
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform="rotate(-90 48 48)" />
      <text x="48" y="52" textAnchor="middle" fontSize="22" fontWeight="700"
        fill="var(--ink)" letterSpacing="-0.02em">{value}%</text>
    </svg>
  )
}

function UsageBar({ pct }: { pct: number }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 8, background: 'var(--bg-2)', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand-2) 100%)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, color: 'var(--ink-3)' }}>
        <span className="mono">USADO {pct}%</span>
        <span className="mono">TETO 100%</span>
      </div>
    </div>
  )
}

function VoteMini() {
  const votes = [
    { v: '✓', c: 'var(--pos)' }, { v: '✓', c: 'var(--pos)' },
    { v: '✕', c: 'var(--neg)' }, { v: '✓', c: 'var(--pos)' },
    { v: '○', c: 'var(--warn)' }, { v: '✓', c: 'var(--pos)' },
  ]
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {votes.map((b, i) => (
        <div key={i} style={{ width: 30, height: 30, background: b.c, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 700, borderRadius: 5 }}>
          {b.v}
        </div>
      ))}
    </div>
  )
}

function BrazilDots({ active, onPick }: { active: string; onPick: (uf: string) => void }) {
  const maxN = Math.max(...STATES.map((s) => s.n))
  return (
    <div style={{ position: 'relative', height: 460, width: '100%' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
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

export function HomeCidadaoClient({ recentVotacoes = [] }: { recentVotacoes?: VotacaoRecente[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeUf, setActiveUf] = useState('SP')
  const [hovered, setHovered] = useState<string | null>(null)

  const activeState = useMemo(() => STATES.find((s) => s.uf === activeUf) ?? STATES[0], [activeUf])

  function onSubmitSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const q = query.trim()
    if (!q) return
    const isCep = /^\d{5}-?\d{3}$/.test(q) || /^\d{8}$/.test(q.replace(/\D/g, ''))
    if (isCep) {
      router.push(`/meu-estado?cep=${q.replace(/\D/g, '')}`)
    } else {
      router.push(`/busca?q=${encodeURIComponent(q)}`)
    }
  }

  return (
    <>
      <main style={{ background: 'var(--bg)' }}>

        {/* ── HERO ── */}
        <section style={{ padding: '72px 24px 80px', textAlign: 'center' }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '5px 14px', borderRadius: 999,
              background: 'rgba(41,82,204,0.07)', border: '1px solid rgba(41,82,204,0.15)',
              marginBottom: 28,
            }}>
              <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-2)', letterSpacing: '0.08em' }}>
                DADOS ABERTOS BRASIL
              </span>
            </div>

            <h1 style={{ margin: 0, fontSize: 'clamp(40px, 7vw, 64px)', lineHeight: 1.05, letterSpacing: '-0.03em', color: 'var(--ink)', fontWeight: 700 }}>
              Transparência para{' '}
              <span style={{ color: 'var(--brand-2)' }}>decidir melhor</span>
            </h1>

            <p style={{ marginTop: 20, fontSize: 'clamp(16px, 2vw, 18px)', lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 520, margin: '20px auto 0' }}>
              Acesse dados oficiais do governo brasileiro de forma clara e direta. Sem complicação.
            </p>

            <form onSubmit={onSubmitSearch} style={{ margin: '36px auto 0', maxWidth: 560 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 0,
                background: 'var(--panel)', border: '1px solid var(--line-strong)',
                borderRadius: 12, padding: '10px 10px 10px 20px',
                boxShadow: '0 4px 20px -2px rgba(0,0,0,0.06)',
              }}>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Digite seu CEP ou nome de um político"
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-sans)' }}
                />
                <button type="submit" style={{
                  height: 44, padding: '0 22px', borderRadius: 8,
                  background: 'var(--ink)', border: 'none', cursor: 'pointer',
                  color: 'white', fontSize: 14, fontWeight: 700, flexShrink: 0,
                }}>
                  Buscar
                </button>
              </div>
            </form>

            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-3)' }}>
              Ou pesquise direto:{' '}
              {['Lula', 'Tarcísio de Freitas', 'Tabata Amaral', 'Eduardo Leite'].map((n, idx) => (
                <button key={n} type="button" onClick={() => router.push(`/busca?q=${encodeURIComponent(n)}`)}
                  style={{ border: 'none', background: 'transparent', color: 'var(--brand-2)', fontWeight: 600, cursor: 'pointer', padding: 0, fontSize: 13 }}>
                  {idx > 0 ? ' · ' : ''}{n}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS 3 CARDS ── */}
        <section style={{ padding: '0 24px 80px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

            {/* Card 1 — Emendas */}
            <div style={{ ...cardStyle }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(217,119,6,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--accent-gold)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                  </svg>
                </div>
                <span className="label">Investimentos 2024</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--accent-gold)', lineHeight: 1 }}>
                R$ 54,2 Bilhões
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
                Em{' '}
                <GlossarioTooltip termo="emenda parlamentar" slug={TERMOS_GLOSSARIO['emenda parlamentar']?.slug ?? 'emenda-parlamentar'} definicaoSimples={TERMOS_GLOSSARIO['emenda parlamentar']?.definicaoSimples}>
                  emendas parlamentares
                </GlossarioTooltip>
                {' '}empenhadas.
              </p>
            </div>

            {/* Card 2 — Projetos */}
            <div style={{ ...cardStyle }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(4,108,78,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--pos)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                  </svg>
                </div>
                <span className="label">Atividade Legislativa</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--pos)', lineHeight: 1 }}>
                1.432 Projetos
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--ink-3)' }}>
                Votados nas duas casas este semestre.
              </p>
            </div>

            {/* Card 3 — Representantes (escuro) */}
            <div style={{ ...cardStyle, background: 'var(--brand)', border: '1px solid var(--brand)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: '50%', background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                  </svg>
                </div>
                <span className="label" style={{ color: 'rgba(255,255,255,0.65)' }}>Ecossistema Público</span>
              </div>
              <div style={{ fontSize: 32, fontWeight: 700, letterSpacing: '-0.03em', color: 'white', lineHeight: 1 }}>
                594 Representantes
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>
                Monitorados em tempo real pela plataforma.
              </p>
            </div>

          </div>
        </section>

        {/* ── SEM JARGÃO (mantida, visual atualizado) ── */}
        <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ maxWidth: 700, marginBottom: 40 }}>
              <div className="label" style={{ marginBottom: 12 }}>EM 3 PERGUNTAS, VOCÊ ENTENDE QUALQUER POLÍTICO</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                Sem jargão. Sem ranking moral.
                <br />
                <span style={{ color: 'var(--ink-3)' }}>Só o que importa.</span>
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
              <article style={{ ...cardStyle }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 12 }}>01</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, lineHeight: 1.2, color: 'var(--ink)' }}>Aparece pra trabalhar?</h3>
                <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--pos)' }}>Helena: 94% presença</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  Frequência em sessões deliberativas comparada com pares da mesma UF.
                </p>
                <div style={{ borderTop: '1px dashed var(--line-strong)', paddingTop: 16 }}>
                  <PresencaRingMini value={94} />
                </div>
              </article>

              <article style={{ ...cardStyle }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 12 }}>02</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, lineHeight: 1.2, color: 'var(--ink)' }}>No que gasta dinheiro público?</h3>
                <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--info)' }}>R$ 28k/mês de R$ 50k</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  <GlossarioTooltip termo="CEAP" slug={TERMOS_GLOSSARIO['CEAP'].slug} definicaoSimples={TERMOS_GLOSSARIO['CEAP'].definicaoSimples}>
                    Cota parlamentar
                  </GlossarioTooltip>{' '}
                  organizada por categoria com comparação percentual com o teto permitido.
                </p>
                <div style={{ borderTop: '1px dashed var(--line-strong)', paddingTop: 16 }}>
                  <UsageBar pct={56} />
                </div>
              </article>

              <article style={{ ...cardStyle }}>
                <div className="mono" style={{ fontSize: 11, letterSpacing: '0.1em', color: 'var(--ink-3)', marginBottom: 12 }}>03</div>
                <h3 style={{ margin: '0 0 8px', fontSize: 20, lineHeight: 1.2, color: 'var(--ink)' }}>Como vota?</h3>
                <p style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 700, color: 'var(--warn)' }}>95% com o partido</p>
                <p style={{ margin: '0 0 20px', fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>
                  Histórico de votações nominais para entender alinhamento, divergência e abstenções.
                </p>
                <div style={{ borderTop: '1px dashed var(--line-strong)', paddingTop: 16 }}>
                  <VoteMini />
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* ── VOTAÇÕES RECENTES ── */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 32, flexWrap: 'wrap', gap: 12 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 38px)', lineHeight: 1.1, letterSpacing: '-0.025em' }}>
                  Votações Recentes de Impacto
                </h2>
                <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>
                  Veja como se posicionaram os parlamentares em temas cruciais.
                </p>
              </div>
              <Link href="/busca" style={{ fontSize: 13, color: 'var(--brand-2)', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                Ver todas →
              </Link>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              {recentVotacoes.length > 0
                ? recentVotacoes.slice(0, 4).map((v, i) => {
                    const total = v.total_sim + v.total_nao + v.total_abstencao || 1
                    const pctSim = Math.round((v.total_sim / total) * 100)
                    const pctNao = Math.round((v.total_nao / total) * 100)
                    const pctAbs = 100 - pctSim - pctNao
                    const dia = new Date(v.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    const isInternal = /^\d+-\d+$/.test(v.proposicao ?? '')
                    const tag = (!v.proposicao || isInternal) ? 'Câmara' : v.proposicao
                    const texto = v.descricao_simples ?? v.proposicao ?? '—'
                    const textoExibido = texto.includes('.') ? texto.slice(0, texto.indexOf('.') + 1) : texto.slice(0, 100)
                    const aprovada = pctSim > pctNao
                    const resultado = aprovada ? 'APROVADO' : 'REJEITADO'
                    const resultadoCor = aprovada ? 'var(--pos)' : 'var(--neg)'
                    const resultadoBg = aprovada ? 'var(--pos-soft)' : 'var(--neg-soft)'

                    return (
                      <article key={i} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                            <span className="mono" style={{ fontSize: 10, background: 'var(--bg-2)', padding: '3px 8px', borderRadius: 4, color: 'var(--ink-2)', fontWeight: 600 }}>
                              {tag}
                            </span>
                            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, background: resultadoBg, color: resultadoCor, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                              {resultado}
                            </span>
                          </div>
                          <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--ink)', minHeight: 48 }}>
                            {textoExibido}
                          </h3>
                          <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{dia}</span>
                        </div>
                        <div style={{ marginTop: 20 }}>
                          <div style={{ display: 'flex', height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-2)', marginBottom: 8 }}>
                            {pctSim > 0 && <div style={{ width: `${pctSim}%`, background: 'var(--pos)' }} />}
                            {pctNao > 0 && <div style={{ width: `${pctNao}%`, background: 'var(--neg)' }} />}
                            {pctAbs > 0 && <div style={{ width: `${pctAbs}%`, background: 'var(--warn)', opacity: 0.5 }} />}
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            <span style={{ color: 'var(--pos)' }}>Sim ({pctSim}%)</span>
                            <span style={{ color: 'var(--neg)' }}>Não ({pctNao}%)</span>
                          </div>
                        </div>
                      </article>
                    )
                  })
                : /* Placeholder quando não há dados */
                  [
                    { tag: 'PL 2630/2020', titulo: 'Lei de Liberdade, Responsabilidade e Transparência', pctSim: 45, pctNao: 50, resultado: 'REJEITADO' as const },
                    { tag: 'PEC 45/2019', titulo: 'Reforma Tributária sobre o Consumo', pctSim: 78, pctNao: 15, resultado: 'APROVADO' as const },
                    { tag: 'MP 1154/2023', titulo: 'Estrutura de Ministérios e Órgãos', pctSim: 62, pctNao: 30, resultado: 'APROVADO' as const },
                    { tag: 'PL 123/2024', titulo: 'Créditos de Carbono e Mercado Verde', pctSim: 0, pctNao: 0, resultado: 'EM PAUTA' as const },
                  ].map((v, i) => {
                    const aprovada = v.resultado === 'APROVADO'
                    const emPauta = v.resultado === 'EM PAUTA'
                    const cor = aprovada ? 'var(--pos)' : emPauta ? 'var(--accent-gold)' : 'var(--neg)'
                    const bg = aprovada ? 'var(--pos-soft)' : emPauta ? 'var(--accent-gold-soft)' : 'var(--neg-soft)'
                    return (
                      <article key={i} style={{ ...cardStyle, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 12 }}>
                            <span className="mono" style={{ fontSize: 10, background: 'var(--bg-2)', padding: '3px 8px', borderRadius: 4, color: 'var(--ink-2)', fontWeight: 600 }}>
                              {v.tag}
                            </span>
                            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 999, background: bg, color: cor, fontWeight: 700, letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>
                              {v.resultado}
                            </span>
                          </div>
                          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, lineHeight: 1.4, color: 'var(--ink)', minHeight: 48 }}>
                            {v.titulo}
                          </h3>
                        </div>
                        <div style={{ marginTop: 20 }}>
                          <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: 'var(--bg-2)', marginBottom: 8, display: 'flex' }}>
                            {v.pctSim > 0 && <div style={{ width: `${v.pctSim}%`, background: 'var(--pos)' }} />}
                            {v.pctNao > 0 && <div style={{ width: `${v.pctNao}%`, background: 'var(--neg)' }} />}
                            {v.pctSim === 0 && v.pctNao === 0 && <div style={{ width: '100%', background: 'var(--bg-2)' }} />}
                          </div>
                          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                            {v.pctSim > 0 ? `Sim (${v.pctSim}%) · Não (${v.pctNao}%)` : 'Aguardando Votação Final'}
                          </div>
                        </div>
                      </article>
                    )
                  })
              }
            </div>
          </div>
        </section>

        {/* ── EXPLORE MAIS (mantida, visual atualizado) ── */}
        <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '72px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div className="label" style={{ marginBottom: 20 }}>EXPLORE MAIS</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { href: '/cidades', icon: '🏘️', titulo: 'Emendas por cidade', desc: 'Quanto chegou à sua cidade? Ranking per capita de emendas parlamentares.', cor: 'var(--brand)' },
                { href: '/projetos', icon: '📄', titulo: 'Projetos de Lei', desc: 'Acompanhe PLs, PECs e MPVs em tramitação no Congresso.', cor: '#7c3aed' },
                { href: '/glossario', icon: '📖', titulo: 'Glossário político', desc: 'Entenda CEAP, emenda, quórum e outros termos em linguagem simples.', cor: 'var(--pos)' },
                { href: '/candidatos-2026', icon: '⚡', titulo: 'Eleições 2026', desc: 'Veja quem já registrou candidatura para as eleições de outubro.', cor: 'var(--accent-gold)' },
              ].map((c) => (
                <Link key={c.href} href={c.href} style={{ textDecoration: 'none', display: 'block' }}>
                  <article
                    style={{
                      ...cardStyle,
                      height: '100%',
                      borderTop: `3px solid ${c.cor}`,
                      borderRadius: '0 0 12px 12px',
                      borderTopLeftRadius: 0,
                      borderTopRightRadius: 0,
                      transition: 'transform 0.2s ease',
                    }}
                    onMouseEnter={(e) => { setHovered(c.href); (e.currentTarget as HTMLElement).style.transform = 'translateY(-4px)' }}
                    onMouseLeave={(e) => { setHovered(null); (e.currentTarget as HTMLElement).style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: 26, marginBottom: 10 }}>{c.icon}</div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{c.titulo}</div>
                    <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>{c.desc}</p>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ── EXPLORE POR REGIÃO ── */}
        <section style={{ padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 48, alignItems: 'center' }}>
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

        {/* ── COMO FUNCIONA (mantida, visual atualizado) ── */}
        <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)', padding: '80px 24px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 40px' }}>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 42px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>
                Como funciona
              </h2>
              <p style={{ marginTop: 12, color: 'var(--ink-3)', fontSize: 15 }}>
                Em 3 passos, transformamos bases oficiais em leitura cívica simples.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
              {[
                { n: '1', h: 'Coletamos', d: 'Diariamente, robôs leem dados públicos da Câmara, Senado, TSE e Portal da Transparência.' },
                { n: '2', h: 'Organizamos', d: 'Convertemos tudo em linguagem clara, com etiquetas, comparações e gráficos.' },
                { n: '3', h: 'Mostramos', d: 'Você consulta de graça. Toda informação tem link direto para a fonte original.' },
              ].map((step) => (
                <article key={step.n} style={{ ...cardStyle }}>
                  <div style={{
                    width: 56, height: 56, borderRadius: '50%',
                    border: '2px solid var(--brand)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: 24, color: 'var(--brand)', fontWeight: 700,
                    fontFamily: 'var(--font-mono)', marginBottom: 16,
                  }}>
                    {step.n}
                  </div>
                  <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 700 }}>{step.h}</h3>
                  <p style={{ margin: 0, color: 'var(--ink-3)', lineHeight: 1.6, fontSize: 14 }}>{step.d}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

      </main>

      <CookieBanner />
    </>
  )
}

// Nomes curtos para os botões de estado rápido
const uf_nomes_curtos: Record<string, string> = {
  SP: 'São Paulo', RJ: 'Rio de Janeiro', MG: 'Minas Gerais', BA: 'Bahia', PR: 'Paraná',
}
