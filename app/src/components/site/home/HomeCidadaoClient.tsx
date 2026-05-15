'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, useMemo, useState } from 'react'

type SearchTab = 'cep' | 'nome'

type StateDot = {
  uf: string
  x: number
  y: number
  n: number
}

const STATES: StateDot[] = [
  { uf: 'AM', x: 22, y: 36, n: 8 },
  { uf: 'RR', x: 26, y: 16, n: 8 },
  { uf: 'AP', x: 48, y: 18, n: 8 },
  { uf: 'PA', x: 45, y: 30, n: 17 },
  { uf: 'AC', x: 10, y: 42, n: 8 },
  { uf: 'RO', x: 22, y: 48, n: 8 },
  { uf: 'TO', x: 53, y: 44, n: 8 },
  { uf: 'MA', x: 60, y: 32, n: 18 },
  { uf: 'PI', x: 65, y: 41, n: 10 },
  { uf: 'CE', x: 73, y: 33, n: 22 },
  { uf: 'RN', x: 81, y: 35, n: 8 },
  { uf: 'PB', x: 84, y: 40, n: 12 },
  { uf: 'PE', x: 79, y: 44, n: 25 },
  { uf: 'AL', x: 82, y: 49, n: 9 },
  { uf: 'SE', x: 78, y: 52, n: 8 },
  { uf: 'BA', x: 70, y: 56, n: 39 },
  { uf: 'MT', x: 42, y: 54, n: 8 },
  { uf: 'GO', x: 53, y: 60, n: 17 },
  { uf: 'DF', x: 58, y: 58, n: 8 },
  { uf: 'MG', x: 63, y: 65, n: 53 },
  { uf: 'ES', x: 73, y: 66, n: 10 },
  { uf: 'RJ', x: 67, y: 71, n: 46 },
  { uf: 'SP', x: 58, y: 72, n: 70 },
  { uf: 'PR', x: 51, y: 78, n: 30 },
  { uf: 'SC', x: 53, y: 84, n: 16 },
  { uf: 'RS', x: 46, y: 92, n: 31 },
  { uf: 'MS', x: 45, y: 68, n: 8 },
]

const UF_NOMES: Record<string, string> = {
  AM: 'Amazonas',
  RR: 'Roraima',
  AP: 'Amapa',
  PA: 'Para',
  AC: 'Acre',
  RO: 'Rondonia',
  TO: 'Tocantins',
  MA: 'Maranhao',
  PI: 'Piaui',
  CE: 'Ceara',
  RN: 'Rio Grande do Norte',
  PB: 'Paraiba',
  PE: 'Pernambuco',
  AL: 'Alagoas',
  SE: 'Sergipe',
  BA: 'Bahia',
  MT: 'Mato Grosso',
  GO: 'Goias',
  DF: 'Distrito Federal',
  MG: 'Minas Gerais',
  ES: 'Espirito Santo',
  RJ: 'Rio de Janeiro',
  SP: 'Sao Paulo',
  PR: 'Parana',
  SC: 'Santa Catarina',
  RS: 'Rio Grande do Sul',
  MS: 'Mato Grosso do Sul',
}

function PresencaRingMini({ value }: { value: number }) {
  const r = 38
  const c = 2 * Math.PI * r
  const off = c - (value / 100) * c
  return (
    <svg width="96" height="96" viewBox="0 0 96 96">
      <circle cx="48" cy="48" r={r} fill="none" stroke="var(--bg-2)" strokeWidth="8" />
      <circle
        cx="48"
        cy="48"
        r={r}
        fill="none"
        stroke="var(--pos)"
        strokeWidth="8"
        strokeDasharray={c}
        strokeDashoffset={off}
        strokeLinecap="round"
        transform="rotate(-90 48 48)"
      />
      <text x="48" y="52" textAnchor="middle" fontSize="22" fontWeight="700" fill="var(--ink)" letterSpacing="-0.02em">
        {value}%
      </text>
    </svg>
  )
}

function UsageBar({ pct }: { pct: number }) {
  return (
    <div style={{ width: '100%' }}>
      <div style={{ height: 10, background: 'var(--bg-2)', borderRadius: 5, overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${pct}%`,
            background: 'linear-gradient(90deg, var(--brand) 0%, var(--brand-2) 100%)',
          }}
        />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--ink-3)' }}>
        <span className="mono" style={{ letterSpacing: '0.04em' }}>
          USADO {pct}%
        </span>
        <span className="mono" style={{ letterSpacing: '0.04em' }}>
          TETO 100%
        </span>
      </div>
    </div>
  )
}

function VoteMini() {
  const votes = [
    { v: '✓', c: 'var(--pos)' },
    { v: '✓', c: 'var(--pos)' },
    { v: '✕', c: 'var(--neg)' },
    { v: '✓', c: 'var(--pos)' },
    { v: '○', c: 'var(--warn)' },
    { v: '✓', c: 'var(--pos)' },
  ]

  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {votes.map((b, i) => (
        <div
          key={i}
          style={{
            width: 32,
            height: 32,
            background: b.c,
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            fontWeight: 700,
            borderRadius: 6,
          }}
        >
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
              <text
                x={s.x}
                y={s.y - r - 1.2}
                fontFamily="IBM Plex Mono, monospace"
                fontSize="2.2"
                textAnchor="middle"
                fill={isActive ? 'var(--ink)' : 'var(--ink-3)'}
                fontWeight={isActive ? 700 : 500}
              >
                {s.uf}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

export function HomeCidadaoClient() {
  const router = useRouter()
  const [tab, setTab] = useState<SearchTab>('cep')
  const [cep, setCep] = useState('')
  const [nome, setNome] = useState('')
  const [activeUf, setActiveUf] = useState('SP')

  const activeState = useMemo(() => STATES.find((s) => s.uf === activeUf) ?? STATES[0], [activeUf])

  function onSubmitSearch(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (tab === 'cep') {
      const cleanCep = cep.replace(/\D/g, '')
      if (cleanCep.length < 8) return
      router.push(`/meu-estado?cep=${cleanCep}`)
      return
    }

    const q = nome.trim()
    if (!q) return
    router.push(`/busca?q=${encodeURIComponent(q)}`)
  }

  return (
    <main style={{ background: 'var(--bg)' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          background: 'linear-gradient(180deg, #fdfdfb 0%, #f4f5f0 100%)',
          padding: '78px 0 86px',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(41,82,204,0.18) 0%, rgba(41,82,204,0) 68%)',
            top: -120,
            right: -80,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(194,65,12,0.18) 0%, rgba(194,65,12,0) 72%)',
            bottom: -140,
            left: -80,
          }}
        />

        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: 920, margin: '0 auto', textAlign: 'center' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 14px',
                borderRadius: 999,
                border: '1px solid var(--line)',
                background: 'var(--panel)',
                fontSize: 12,
                color: 'var(--ink-3)',
                fontWeight: 500,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--pos)' }} />
              Plataforma independente · dados publicos
            </div>

            <h1
              style={{
                margin: '26px 0 0',
                fontSize: 'clamp(44px, 8vw, 78px)',
                lineHeight: 1.03,
                letterSpacing: '-0.04em',
                color: 'var(--ink)',
              }}
            >
              Quem te representa
              <br />
              <span style={{ color: 'var(--brand-2)' }}>em Brasilia?</span>
            </h1>

            <p
              style={{
                fontSize: 'clamp(18px, 2.6vw, 21px)',
                lineHeight: 1.5,
                margin: '24px auto 0',
                color: 'var(--ink-2)',
                maxWidth: 860,
              }}
            >
              Digite seu CEP e descubra, em 30 segundos, quem decide por voce - e como cada um vota, gasta e participa.
            </p>

            <form
              onSubmit={onSubmitSearch}
              style={{
                margin: '34px auto 0',
                maxWidth: 580,
                border: '1px solid var(--ink)',
                borderRadius: 14,
                background: 'var(--panel)',
                boxShadow: '0 24px 48px -32px rgba(15,23,42,0.2), 6px 6px 0 rgba(41,82,204,0.08)',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', borderBottom: '1px solid var(--line)' }}>
                <button
                  type="button"
                  onClick={() => setTab('cep')}
                  style={{
                    flex: 1,
                    height: 46,
                    border: 'none',
                    background: tab === 'cep' ? 'var(--ink)' : 'var(--panel)',
                    color: tab === 'cep' ? 'var(--bg)' : 'var(--ink-3)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Pelo CEP | mais facil
                </button>
                <button
                  type="button"
                  onClick={() => setTab('nome')}
                  style={{
                    flex: 1,
                    height: 46,
                    border: 'none',
                    background: tab === 'nome' ? 'var(--ink)' : 'var(--panel)',
                    color: tab === 'nome' ? 'var(--bg)' : 'var(--ink-3)',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Por nome | politico especifico
                </button>
              </div>

              <div style={{ display: 'flex', gap: 10, padding: 14 }}>
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    border: '1px solid var(--line-strong)',
                    borderRadius: 10,
                    background: 'var(--panel-2)',
                    padding: '0 14px',
                  }}
                >
                  <span style={{ fontSize: 18 }}>{tab === 'cep' ? '📍' : '🔍'}</span>
                  <input
                    value={tab === 'cep' ? cep : nome}
                    onChange={(e) => (tab === 'cep' ? setCep(e.target.value) : setNome(e.target.value))}
                    placeholder={tab === 'cep' ? 'Digite seu CEP (00000-000)' : 'Digite o nome do politico'}
                    style={{
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      height: 52,
                      width: '100%',
                      fontSize: 15,
                      color: 'var(--ink)',
                      fontFamily: tab === 'cep' ? 'var(--font-mono)' : 'var(--font-sans)',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  style={{
                    height: 52,
                    border: 'none',
                    borderRadius: 10,
                    background: 'var(--brand)',
                    color: 'white',
                    fontSize: 14,
                    fontWeight: 700,
                    padding: '0 18px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Descobrir →
                </button>
              </div>

              <div style={{ padding: '0 14px 14px', fontSize: 12, color: 'var(--ink-3)' }}>
                🔒 Seu CEP e usado so para encontrar a UF. Nao armazenamos nada.
              </div>
            </form>

            <div style={{ marginTop: 16, fontSize: 13, color: 'var(--ink-3)' }}>
              Ou pesquise direto:{' '}
              {['Lula', 'Tarcisio', 'Tabata Amaral', 'Eduardo Leite'].map((n, idx) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => router.push(`/busca?q=${encodeURIComponent(n)}`)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    color: 'var(--brand-2)',
                    fontWeight: 600,
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {idx > 0 ? ' · ' : ''}
                  {n}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: 900 }}>
            <div className="label" style={{ marginBottom: 14 }}>
              EM 3 PERGUNTAS, VOCE ENTENDE QUALQUER POLITICO
            </div>
            <h2 style={{ fontSize: 'clamp(34px, 4.7vw, 56px)', lineHeight: 1.08, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink)' }}>
              Sem jargao. Sem ranking moral.
              <br />
              <span style={{ color: 'var(--ink-3)' }}>So o que importa.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 34 }}>
            <article style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel-2)', padding: 22 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
                01 · 📊
              </div>
              <h3 style={{ margin: '10px 0 8px', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)' }}>Aparece pra trabalhar?</h3>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--pos)' }}>Helena: 94% presenca</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Frequencia em sessoes deliberativas e presenca comparada com pares da mesma UF.
              </p>
              <div style={{ borderTop: '1px dashed var(--line-strong)', marginTop: 16, paddingTop: 16 }}>
                <PresencaRingMini value={94} />
              </div>
            </article>

            <article style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel-2)', padding: 22 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
                02 · 💰
              </div>
              <h3 style={{ margin: '10px 0 8px', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)' }}>No que gasta dinheiro publico?</h3>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--info)' }}>R$ 28k/mes de R$ 50k</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Cota parlamentar organizada por categoria com comparacao percentual com o teto permitido.
              </p>
              <div style={{ borderTop: '1px dashed var(--line-strong)', marginTop: 16, paddingTop: 16 }}>
                <UsageBar pct={56} />
              </div>
            </article>

            <article style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel-2)', padding: 22 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
                03 · 🗳️
              </div>
              <h3 style={{ margin: '10px 0 8px', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)' }}>Como vota?</h3>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--warn)' }}>95% com o partido</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Historico das votacoes nominais para entender alinhamento, divergencia e abstencoes.
              </p>
              <div style={{ borderTop: '1px dashed var(--line-strong)', marginTop: 16, paddingTop: 16 }}>
                <VoteMini />
              </div>
            </article>
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--bg)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 30, alignItems: 'center' }}>
            <div>
              <div className="label" style={{ marginBottom: 14 }}>
                VEJA QUEM REPRESENTA SEU ESTADO
              </div>
              <h2 style={{ margin: 0, fontSize: 'clamp(34px, 5vw, 58px)', lineHeight: 1.08, letterSpacing: '-0.03em' }}>
                Toque no mapa.
                <br />
                <span style={{ color: 'var(--brand-2)' }}>Conheca seus deputados.</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 520 }}>
                Cada ponto representa um estado, com tamanho proporcional ao numero de cadeiras na Camara. Selecione uma UF para
                abrir os representantes.
              </p>

              <div style={{ marginTop: 20, border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)', padding: 18 }}>
                <div style={{ fontSize: 64, lineHeight: 1, letterSpacing: '-0.05em', color: 'var(--accent)', fontWeight: 700 }}>{activeUf}</div>
                <div style={{ marginTop: 6, fontSize: 16, color: 'var(--ink-2)', fontWeight: 600 }}>{UF_NOMES[activeUf]}</div>
                <div style={{ marginTop: 4, fontSize: 13, color: 'var(--ink-3)' }}>{activeState.n} representantes federais</div>
                <Link
                  href={`/busca?uf=${activeUf}`}
                  style={{
                    marginTop: 14,
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 40,
                    padding: '0 14px',
                    borderRadius: 8,
                    background: 'var(--brand)',
                    color: '#fff',
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Ver representantes de {activeUf} →
                </Link>
              </div>
            </div>

            <div>
              <BrazilDots active={activeUf} onPick={setActiveUf} />
            </div>
          </div>
        </div>
      </section>

      <section style={{ background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg-2) 100%)', borderTop: '1px solid var(--line)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', maxWidth: 850, margin: '0 auto' }}>
            <h2 style={{ fontSize: 'clamp(34px, 4.8vw, 56px)', letterSpacing: '-0.03em', margin: 0 }}>Como funciona</h2>
            <p style={{ marginTop: 12, color: 'var(--ink-3)', fontSize: 16 }}>
              Em 3 passos, transformamos bases oficiais em leitura cívica simples.
            </p>
          </div>

          <div style={{ position: 'relative', marginTop: 36 }}>
            <div className="home-steps-line" style={{ position: 'absolute', top: 40, left: '16%', right: '16%', height: 1, background: 'var(--line-strong)' }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 22, position: 'relative' }}>
              {[
                {
                  n: '1',
                  h: 'Coletamos',
                  d: 'Diariamente, robos leem dados publicos da Camara, Senado, TSE e Portal da Transparencia.',
                },
                {
                  n: '2',
                  h: 'Organizamos',
                  d: 'Convertemos tudo em linguagem clara, com etiquetas, comparacoes e graficos.',
                },
                {
                  n: '3',
                  h: 'Mostramos',
                  d: 'Voce consulta de graca. Toda informacao tem link direto para a fonte original.',
                },
              ].map((step) => (
                <article key={step.n} style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
                  <div
                    className="mono"
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: '50%',
                      border: '2px solid var(--brand)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 36,
                      color: 'var(--brand)',
                      marginBottom: 14,
                    }}
                  >
                    {step.n}
                  </div>
                  <h3 style={{ margin: 0, fontSize: 22 }}>{step.h}</h3>
                  <p style={{ marginTop: 10, color: 'var(--ink-3)', lineHeight: 1.6, fontSize: 14 }}>{step.d}</p>
                </article>
              ))}
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              border: '1px solid var(--line)',
              borderRadius: 10,
              background: 'var(--panel)',
              padding: '12px 14px',
              display: 'flex',
              gap: 8,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <span className="mono" style={{ fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
              NOSSAS FONTES OFICIAIS:
            </span>
            {['Camara dos Deputados', 'Senado Federal', 'TSE', 'Portal da Transparencia', 'IBGE'].map((f) => (
              <span key={f} style={{ fontSize: 13, color: 'var(--ink-2)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--pos)' }} />
                {f}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: '80px 0', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'start' }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 'clamp(34px, 4.6vw, 56px)', lineHeight: 1.1, letterSpacing: '-0.03em' }}>
                Sem opiniao. Sem patrocinio. Sem rankings.
              </h2>
              <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 520 }}>
                Nosso compromisso e com dados oficiais, contexto e cidadania informada. A plataforma existe para ajudar voce a
                interpretar, nao para dizer em quem votar.
              </p>
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)', overflow: 'hidden' }}>
              {[
                { s: '✓', tone: 'var(--pos)', t: 'Dados oficiais com rastreabilidade' },
                { s: '✓', tone: 'var(--pos)', t: 'Codigo aberto' },
                { s: '✓', tone: 'var(--pos)', t: 'Sem patrocinio de campanhas' },
                { s: '✕', tone: 'var(--neg)', t: 'Nao fazemos ranking ideologico' },
                { s: '✕', tone: 'var(--neg)', t: 'Nao permitimos comentarios' },
              ].map((item, idx) => (
                <div
                  key={item.t}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '36px 1fr',
                    gap: 12,
                    alignItems: 'center',
                    padding: '14px 16px',
                    borderBottom: idx < 4 ? '1px solid var(--line)' : 'none',
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 700, color: item.tone, textAlign: 'center' }}>{item.s}</span>
                  <span style={{ fontSize: 14, color: 'var(--ink-2)', fontWeight: 600 }}>{item.t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: '0 0 86px', background: 'var(--bg)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div
            style={{
              position: 'relative',
              background: '#0a0e1a',
              borderRadius: 18,
              overflow: 'hidden',
              padding: '34px 28px',
            }}
          >
            <div
              aria-hidden="true"
              className="mono"
              style={{
                position: 'absolute',
                right: 20,
                top: -26,
                fontSize: 'clamp(80px, 14vw, 180px)',
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: '-0.06em',
                color: 'rgba(255,255,255,0.04)',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              app
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 28, alignItems: 'center' }}>
              <div>
                <div className="label" style={{ color: 'rgba(255,255,255,0.6)', marginBottom: 10 }}>
                  PARA JORNALISTAS, PESQUISADORES E ANALISTAS
                </div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 'clamp(34px, 4.4vw, 52px)',
                    lineHeight: 1.1,
                    letterSpacing: '-0.03em',
                    color: '#fff',
                  }}
                >
                  Quer ir fundo? Use o app.
                </h2>
                <p style={{ marginTop: 14, color: 'rgba(255,255,255,0.78)', fontSize: 16, lineHeight: 1.6, maxWidth: 560 }}>
                  Analise historicos de votacao, gasto parlamentar, contato de gabinete e acompanhamento individual em um ambiente de
                  leitura densa.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 20 }}>
                  <a
                    href="https://app.meuspoliticos.com.br"
                    style={{
                      height: 44,
                      padding: '0 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 8,
                      background: '#f5a25c',
                      color: '#0a0e1a',
                      fontSize: 13,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    app.meuspoliticos.com.br →
                  </a>
                  <a
                    href="#"
                    style={{
                      height: 44,
                      padding: '0 16px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      borderRadius: 8,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.35)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    Ver a documentacao da API
                  </a>
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'IBM Plex Mono, monospace',
                  fontSize: 12,
                  lineHeight: 1.65,
                  color: 'rgba(255,255,255,0.85)',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  padding: 20,
                  borderRadius: 10,
                }}
              >
                <div style={{ marginBottom: 12, display: 'flex', gap: 6 }}>
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: '#f87171' }} />
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: '#fbbf24' }} />
                  <span style={{ width: 9, height: 9, borderRadius: 999, background: '#4ade80' }} />
                </div>
                <div>
                  <span style={{ color: '#4ade80' }}>$</span> curl api.meuspoliticos.com.br
                </div>
                <div style={{ color: '#8aa3ff' }}> /politicos/nikolas-ferreira</div>
                <div style={{ marginTop: 10, color: 'rgba(255,255,255,0.5)' }}>{'{'}</div>
                <div>  "presenca": 71.0,</div>
                <div>  "gasto_total_ano": 388132,</div>
                <div>  "votacoes": 966,</div>
                <div style={{ color: '#f5a25c' }}>  "scores": {'{'}</div>
                <div>    "les": null,</div>
                <div>    "coerencia": null</div>
                <div style={{ color: '#f5a25c' }}>  {'}'}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)' }}>{'}'}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <style jsx>{`
        @media (max-width: 767px) {
          .home-steps-line {
            display: none;
          }
        }
      `}</style>
    </main>
  )
}
