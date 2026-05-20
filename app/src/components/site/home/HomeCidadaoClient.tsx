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
  AP: 'Amapá',
  PA: 'Pará',
  AC: 'Acre',
  RO: 'Rondônia',
  TO: 'Tocantins',
  MA: 'Maranhão',
  PI: 'Piauí',
  CE: 'Ceará',
  RN: 'Rio Grande do Norte',
  PB: 'Paraíba',
  PE: 'Pernambuco',
  AL: 'Alagoas',
  SE: 'Sergipe',
  BA: 'Bahia',
  MT: 'Mato Grosso',
  GO: 'Goiás',
  DF: 'Distrito Federal',
  MG: 'Minas Gerais',
  ES: 'Espírito Santo',
  RJ: 'Rio de Janeiro',
  SP: 'São Paulo',
  PR: 'Paraná',
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
                fontFamily="var(--font-mono)"
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
              Plataforma independente · dados públicos
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
              <span style={{ color: 'var(--brand-2)' }}>em Brasília?</span>
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
              Digite seu CEP e descubra, em 30 segundos, quem decide por você — e como cada um vota, gasta e participa.
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
                  Pelo CEP | mais fácil
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
                  Por nome | político específico
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
                    placeholder={tab === 'cep' ? 'Digite seu CEP (00000-000)' : 'Digite o nome do político'}
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
                🔒 Seu CEP é usado só para encontrar a UF. Não armazenamos nada.
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

      {/* ── Stats + Cargo strip ── */}
      <section style={{ background: 'var(--bg)', padding: '36px 0 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>

          {/* Stats row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 0, paddingBottom: 28, marginBottom: 28, borderBottom: '1px solid var(--line-soft)' }}>
            {[
              { n: '570+', l: 'políticos com dados' },
              { n: '50 mil', l: 'votações registradas' },
              { n: 'R$ 55bi', l: 'em emendas mapeadas' },
              { n: '27', l: 'estados cobertos' },
            ].map((s, i) => (
              <div key={i} style={{ flex: '1 1 140px', padding: '0 24px', borderRight: i < 3 ? '1px solid var(--line-soft)' : 'none', marginBottom: 12 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(30px, 4.5vw, 46px)', fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 5 }}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Cargo pills */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingBottom: 36 }}>
            <span style={{ fontSize: 12, color: 'var(--ink-3)', marginRight: 4, flexShrink: 0 }}>Explorar por cargo:</span>
            {[
              { k: 'presidente', l: 'Presidente', dot: '#1d3a8a' },
              { k: 'governador', l: 'Governadores', dot: '#5b21b6' },
              { k: 'senador', l: 'Senadores', dot: '#065f46' },
              { k: 'deputado_federal', l: 'Dep. Federais', dot: '#1e40af' },
              { k: 'deputado_estadual', l: 'Dep. Estaduais', dot: '#92400e' },
            ].map(({ k, l, dot }) => (
              <Link
                key={k}
                href={`/busca?cargo=${k}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 34,
                  padding: '0 14px',
                  borderRadius: 999,
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--ink-2)',
                  textDecoration: 'none',
                }}
              >
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: dot, marginRight: 8, flexShrink: 0 }} />
                {l}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: 'var(--panel)', borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '80px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ maxWidth: 900 }}>
            <div className="label" style={{ marginBottom: 14 }}>
              EM 3 PERGUNTAS, VOCÊ ENTENDE QUALQUER POLÍTICO
            </div>
            <h2 style={{ fontSize: 'clamp(34px, 4.7vw, 56px)', lineHeight: 1.08, letterSpacing: '-0.03em', margin: 0, color: 'var(--ink)' }}>
              Sem jargão. Sem ranking moral.
              <br />
              <span style={{ color: 'var(--ink-3)' }}>Só o que importa.</span>
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, marginTop: 34 }}>
            <article style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel-2)', padding: 22 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
                01 · 📊
              </div>
              <h3 style={{ margin: '10px 0 8px', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)' }}>Aparece pra trabalhar?</h3>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--pos)' }}>Helena: 94% presença</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Frequência em sessões deliberativas e presença comparada com pares da mesma UF.
              </p>
              <div style={{ borderTop: '1px dashed var(--line-strong)', marginTop: 16, paddingTop: 16 }}>
                <PresencaRingMini value={94} />
              </div>
            </article>

            <article style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel-2)', padding: 22 }}>
              <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
                02 · 💰
              </div>
              <h3 style={{ margin: '10px 0 8px', fontSize: 22, lineHeight: 1.2, color: 'var(--ink)' }}>No que gasta dinheiro público?</h3>
              <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--info)' }}>R$ 28k/mês de R$ 50k</p>
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.5 }}>
                Cota parlamentar organizada por categoria com comparação percentual com o teto permitido.
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
                Histórico das votações nominais para entender alinhamento, divergência e abstenções.
              </p>
              <div style={{ borderTop: '1px dashed var(--line-strong)', marginTop: 16, paddingTop: 16 }}>
                <VoteMini />
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* ── Últimas votações ── */}
      <section style={{ background: 'var(--bg)', padding: '80px 0 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
            <div>
              <div className="label" style={{ marginBottom: 8 }}>AO VIVO NO PLENÁRIO</div>
              <h2 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 44px)', letterSpacing: '-0.025em', lineHeight: 1.1 }}>Últimas votações</h2>
            </div>
            <Link href="/busca" style={{ fontSize: 13, color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none', whiteSpace: 'nowrap' }}>
              Ver todas →
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, paddingBottom: 80 }}>
            {([
              { projeto: 'PL 1234/2025', ementa: 'Reforma tributária — segundo turno', data: 'Hoje, 14h32', sim: 312, nao: 118, votos: ['S','S','N','S','A','S','N','S','S','N'] },
              { projeto: 'PEC 8/2024', ementa: 'Gastos públicos — Emenda constitucional', data: 'Ontem, 16h10', sim: 278, nao: 155, votos: ['S','N','S','S','S','N','A','S','N','S'] },
              { projeto: 'PL 892/2025', ementa: 'Marco regulatório de inteligência artificial', data: '3 dias atrás', sim: 391, nao: 45, votos: ['S','S','S','S','S','S','A','S','S','S'] },
              { projeto: 'PDL 77/2025', ementa: 'Decreto sobre taxação de plataformas digitais', data: '5 dias atrás', sim: 207, nao: 214, votos: ['N','S','N','N','A','S','N','N','S','N'] },
            ] as const).map((v, i) => (
              <article key={i} style={{ background: 'var(--panel)', borderRadius: 10, padding: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, marginBottom: 8 }}>
                  <span className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--brand-2)', fontWeight: 600 }}>{v.projeto}</span>
                  <span style={{ fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{v.data}</span>
                </div>
                <p style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--ink)' }}>{v.ementa}</p>

                {/* vote bar */}
                <div style={{ display: 'flex', gap: 3, marginBottom: 12, height: 14 }}>
                  {v.votos.map((voto, j) => (
                    <div key={j} style={{
                      flex: 1,
                      borderRadius: 3,
                      background: voto === 'S' ? 'var(--pos)' : voto === 'N' ? 'var(--neg)' : 'var(--warn)',
                      opacity: 0.7,
                    }} />
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 14, fontSize: 12 }}>
                  <span style={{ color: 'var(--pos)', fontWeight: 700 }}>✓ {v.sim} Sim</span>
                  <span style={{ color: 'var(--neg)', fontWeight: 700 }}>✕ {v.nao} Não</span>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Explore mais ── */}
      <section style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--line-soft)', borderBottom: '1px solid var(--line-soft)', padding: '64px 0' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
          <div className="label" style={{ marginBottom: 16 }}>EXPLORE MAIS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
            {[
              {
                href: '/cidades',
                icon: '🏘️',
                titulo: 'Emendas por cidade',
                desc: 'Quanto chegou à sua cidade? Ranking per capita de emendas parlamentares.',
                cor: 'var(--brand)',
              },
              {
                href: '/projetos',
                icon: '📄',
                titulo: 'Projetos de Lei',
                desc: 'Acompanhe PLs, PECs e MPVs em tramitação no Congresso.',
                cor: '#7c3aed',
              },
              {
                href: '/glossario',
                icon: '📖',
                titulo: 'Glossário político',
                desc: 'Entenda CEAP, emenda, quórum e outros termos em linguagem simples.',
                cor: '#065f46',
              },
              {
                href: '/candidatos-2026',
                icon: '⚡',
                titulo: 'Eleições 2026',
                desc: 'Veja quem já registrou candidatura para as eleições de outubro.',
                cor: '#b45309',
              },
            ].map((c) => (
              <Link key={c.href} href={c.href} style={{ textDecoration: 'none', display: 'block' }}>
                <article style={{
                  background: 'var(--panel)',
                  borderRadius: 10,
                  padding: '20px 18px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)',
                  height: '100%',
                  borderTop: `3px solid ${c.cor}`,
                }}>
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{c.icon}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', marginBottom: 6 }}>{c.titulo}</div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.55 }}>{c.desc}</p>
                </article>
              </Link>
            ))}
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
                <span style={{ color: 'var(--brand-2)' }}>Conheça seus deputados.</span>
              </h2>
              <p style={{ marginTop: 16, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 520 }}>
                Cada ponto representa um estado, com tamanho proporcional ao número de cadeiras na Câmara. Selecione uma UF para
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
                  d: 'Diariamente, robôs leem dados públicos da Câmara, Senado, TSE e Portal da Transparência.',
                },
                {
                  n: '2',
                  h: 'Organizamos',
                  d: 'Convertemos tudo em linguagem clara, com etiquetas, comparações e gráficos.',
                },
                {
                  n: '3',
                  h: 'Mostramos',
                  d: 'Você consulta de graça. Toda informação tem link direto para a fonte original.',
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
            {['Câmara dos Deputados', 'Senado Federal', 'TSE', 'Portal da Transparência', 'IBGE'].map((f) => (
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
                Sem opinião. Sem patrocínio. Sem rankings.
              </h2>
              <p style={{ marginTop: 14, fontSize: 16, lineHeight: 1.6, color: 'var(--ink-3)', maxWidth: 520 }}>
                Nosso compromisso é com dados oficiais, contexto e cidadania informada. A plataforma existe para ajudar você a
                interpretar, não para dizer em quem votar.
              </p>
            </div>

            <div style={{ border: '1px solid var(--line)', borderRadius: 12, background: 'var(--panel)', overflow: 'hidden' }}>
              {[
                { s: '✓', tone: 'var(--pos)', t: 'Dados oficiais com rastreabilidade' },
                { s: '✓', tone: 'var(--pos)', t: 'Código aberto' },
                { s: '✓', tone: 'var(--pos)', t: 'Sem patrocínio de campanhas' },
                { s: '✕', tone: 'var(--neg)', t: 'Não fazemos ranking ideológico' },
                { s: '✕', tone: 'var(--neg)', t: 'Não permitimos comentários' },
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
                  Analise históricos de votação, gasto parlamentar, contato de gabinete e acompanhamento individual em um ambiente de
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
                    Ver a documentação da API
                  </a>
                </div>
              </div>

              <div
                style={{
                  fontFamily: 'var(--font-mono)',
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

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 767px) { .home-steps-line { display: none; } }
      ` }} />
    </main>
  )
}
