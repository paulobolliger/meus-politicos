'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BrazilDots, StatusDot } from '@/components/civic'

type SearchTab = 'nome' | 'cep' | 'partido' | 'estado'

const TABS: { id: SearchTab; label: string }[] = [
  { id: 'nome', label: 'Nome' },
  { id: 'cep', label: 'CEP' },
  { id: 'partido', label: 'Partido' },
  { id: 'estado', label: 'Estado' },
]

const KPI_ROWS = [
  { value: '513', label: 'DEPUTADOS MONITORADOS' },
  { value: '378.695', label: 'VOTOS REGISTRADOS' },
  { value: '604.845', label: 'REGISTROS DE GASTOS' },
  { value: '16.572', label: 'REGISTROS DE PRESENCA' },
]

const TRUST_ROWS = [
  { ok: true, text: 'Fontes oficiais rastreaveis por politico e votacao' },
  { ok: true, text: 'Atualizacao recorrente com trilha de coleta' },
  { ok: true, text: 'Metodologia publica para leitura de indicadores' },
  { ok: false, text: 'Sem opiniao editorial ou ranking ideologico' },
  { ok: true, text: 'API aberta para auditoria e reuso externo' },
]

function GridBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.35 }}
    >
      <defs>
        <pattern id="grid-light" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 6 0 L 0 0 0 6" fill="none" stroke="var(--line)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid-light)" />
    </svg>
  )
}

export function HomeAppLight() {
  const router = useRouter()
  const [tab, setTab] = useState<SearchTab>('nome')
  const [query, setQuery] = useState('')
  const [activeUf, setActiveUf] = useState('SP')

  const placeholder = useMemo(() => {
    if (tab === 'cep') return 'Digite o CEP (ex: 13010001)'
    if (tab === 'partido') return 'Digite sigla do partido (ex: PL)'
    if (tab === 'estado') return 'Digite a UF (ex: SP)'
    return 'Digite o nome do politico'
  }, [tab])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return

    if (tab === 'cep') {
      router.push(`/meu-estado?cep=${encodeURIComponent(value)}`)
      return
    }

    if (tab === 'estado') {
      router.push(`/busca?uf=${encodeURIComponent(value.toUpperCase())}`)
      return
    }

    if (tab === 'partido') {
      router.push(`/busca?partido=${encodeURIComponent(value.toUpperCase())}`)
      return
    }

    router.push(`/busca?q=${encodeURIComponent(value)}`)
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--line)',
          background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg) 100%)',
          padding: '28px 0 42px',
        }}
      >
        <GridBackdrop />
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
          <div
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--line)',
              background: 'var(--panel)',
              padding: '8px 12px',
              fontSize: 11,
              letterSpacing: '0.08em',
              color: 'var(--ink-3)',
            }}
          >
            <StatusDot tone="live" />
            PLATAFORMA INDEPENDENTE · DADOS PUBLICOS · API ABERTA
          </div>

          <div style={{ display: 'grid', gap: 24, marginTop: 18 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 'clamp(38px, 8vw, 72px)', lineHeight: 1.02, letterSpacing: '-0.04em' }}>
                Quem decide
                <br />
                <span style={{ color: 'var(--brand-2)' }}>por voce,</span> em dados.
              </h1>
              <p
                style={{
                  margin: '16px 0 0',
                  maxWidth: 820,
                  fontSize: 'clamp(15px, 2.1vw, 18px)',
                  lineHeight: 1.6,
                  color: 'var(--ink-3)',
                }}
              >
                Votacoes, presenca, gastos e financiamentos de 513 deputados federais organizados a partir de fontes
                oficiais.
              </p>
            </div>

            <div style={{ display: 'grid', gap: 16, alignItems: 'stretch' }}>
              <section
                style={{
                  border: '1px solid var(--line-strong)',
                  background: 'var(--panel)',
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {TABS.map((item) => {
                    const active = item.id === tab
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setTab(item.id)}
                        className="mono"
                        style={{
                          height: 30,
                          padding: '0 10px',
                          border: `1px solid ${active ? 'var(--brand-2)' : 'var(--line)'}`,
                          background: active ? 'var(--brand-soft)' : 'var(--panel)',
                          color: active ? 'var(--brand-2)' : 'var(--ink-3)',
                          fontSize: 10.5,
                          letterSpacing: '0.08em',
                          cursor: 'pointer',
                        }}
                      >
                        {item.label}
                      </button>
                    )
                  })}
                </div>
                <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10 }}>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder={placeholder}
                    className="mono"
                    style={{
                      height: 42,
                      border: '1px solid var(--line-strong)',
                      padding: '0 12px',
                      background: 'var(--panel-2)',
                      color: 'var(--ink)',
                      fontSize: 12,
                      letterSpacing: '0.04em',
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      height: 42,
                      padding: '0 16px',
                      border: '1px solid var(--brand-2)',
                      background: 'var(--brand-2)',
                      color: '#fff',
                      fontSize: 13,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Buscar -&gt;
                  </button>
                </form>
              </section>

              <aside style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                {KPI_ROWS.map((row) => (
                  <article key={row.label} style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <StatusDot tone="live" />
                      <div className="mono" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.04em' }}>
                        {row.value}
                      </div>
                    </div>
                    <div className="mono" style={{ marginTop: 8, fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
                      {row.label}
                    </div>
                  </article>
                ))}
              </aside>
            </div>
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '30px 20px 20px' }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <article style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <h2 style={{ margin: 0, fontSize: 21, letterSpacing: '-0.02em' }}>Mapa de representacao federal</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                UF ATIVA: {activeUf}
              </span>
            </div>
            <BrazilDots active={activeUf} onPick={setActiveUf} />
          </article>

          <article style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
            <div className="label" style={{ marginBottom: 8 }}>
              ULTIMAS VOTACOES
            </div>
            <div
              className="mono"
              style={{
                border: '1px dashed var(--line-strong)',
                background: 'var(--panel-2)',
                minHeight: 92,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--ink-3)',
                fontSize: 12,
                letterSpacing: '0.08em',
                textAlign: 'center',
                padding: 16,
              }}
            >
              [ STREAM EM PREPARO ]
            </div>
          </article>

          <article style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
            <h3 style={{ margin: 0, fontSize: 18 }}>Por que confiar</h3>
            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {TRUST_ROWS.map((row) => (
                <div key={row.text} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <StatusDot tone={row.ok ? 'pos' : 'warn'} />
                  <span style={{ fontSize: 13.5, color: 'var(--ink-2)' }}>{row.ok ? '✓' : '✕'} {row.text}</span>
                </div>
              ))}
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
