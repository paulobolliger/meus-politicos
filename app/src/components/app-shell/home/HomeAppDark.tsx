'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { BrazilDots, StatusDot } from '@/components/civic'

const STATS = [
  { value: '513', label: 'REPRESENTANTES' },
  { value: '378.695', label: 'VOTOS' },
  { value: '604.845', label: 'GASTOS' },
  { value: '16.572', label: 'PRESENCAS' },
]

function GridBackdropDark() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.24 }}
    >
      <defs>
        <pattern id="grid-dark" width="5" height="5" patternUnits="userSpaceOnUse">
          <path d="M 5 0 L 0 0 0 5" fill="none" stroke="var(--line-strong)" strokeWidth="0.45" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid-dark)" />
    </svg>
  )
}

export function HomeAppDark() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeUf, setActiveUf] = useState('SP')

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    router.push(`/busca?q=${encodeURIComponent(value)}`)
  }

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--line)',
          padding: '28px 0 40px',
          background: 'linear-gradient(180deg, var(--bg) 0%, var(--bg-2) 100%)',
        }}
      >
        <GridBackdropDark />

        <div
          style={{
            position: 'absolute',
            width: 420,
            height: 420,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(138,163,255,0.28) 0%, rgba(138,163,255,0) 68%)',
            top: -100,
            right: -90,
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: 380,
            height: 380,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,162,92,0.24) 0%, rgba(245,162,92,0) 72%)',
            bottom: -120,
            left: -120,
          }}
        />

        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 20px', position: 'relative' }}>
          <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)' }}>
            MEUS POLITICOS / TRANSPARENCIA CIVICA / V2.8
          </div>

          <h1
            style={{
              margin: '14px 0 0',
              fontSize: 'clamp(44px, 13vw, 88px)',
              lineHeight: 0.95,
              letterSpacing: '-0.04em',
              color: 'var(--ink)',
            }}
          >
            O mandato
            <br />
            publico,
            <br />
            <span style={{ color: 'var(--accent)' }}>auditavel.</span>
          </h1>

          <p style={{ margin: '18px 0 0', maxWidth: 860, fontSize: 16, lineHeight: 1.65, color: 'var(--ink-3)' }}>
            Auditoria civica sobre <span style={{ color: 'var(--ink)', fontWeight: 700 }}>513 representantes</span>,
            com dados de votacoes, presenca, gastos e atividade parlamentar para consulta tecnica e rastreavel.
          </p>

          <form
            onSubmit={onSubmit}
            style={{
              marginTop: 22,
              display: 'grid',
              gridTemplateColumns: '1fr auto',
              gap: 10,
              border: '1px solid var(--line-strong)',
              background: 'var(--panel)',
              padding: 10,
            }}
          >
            <label className="mono" style={{ display: 'none' }} htmlFor="app-dark-search">
              Buscar politico
            </label>
            <input
              id="app-dark-search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="$ buscar por nome, partido, tema..."
              className="mono"
              style={{
                height: 42,
                border: '1px solid var(--line-strong)',
                background: 'var(--panel)',
                color: 'var(--ink)',
                padding: '0 12px',
                fontSize: 12,
                letterSpacing: '0.05em',
              }}
            />
            <button
              type="submit"
              className="mono"
              style={{
                height: 42,
                border: '1px solid var(--line-strong)',
                background: 'var(--bg-2)',
                color: 'var(--ink)',
                padding: '0 14px',
                fontSize: 11,
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              EXECUTAR -&gt;
            </button>
          </form>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(148px, 1fr))', gap: 10, marginTop: 14 }}>
            {STATS.map((item) => (
              <div key={item.label} style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 10 }}>
                <div className="mono tnum" style={{ fontSize: 21, letterSpacing: '0.03em', color: 'var(--ink)' }}>
                  {item.value}
                </div>
                <div className="mono" style={{ marginTop: 4, fontSize: 10.5, letterSpacing: '0.09em', color: 'var(--ink-3)' }}>
                  {item.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '22px 20px 28px' }}>
        <div style={{ display: 'grid', gap: 14 }}>
          <article style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 20 }}>ATIVIDADE PARLAMENTAR · AO VIVO</h2>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                STATUS: STANDBY
              </span>
            </div>
            <div
              className="mono"
              style={{
                border: '1px dashed var(--line-strong)',
                background: 'var(--bg-2)',
                minHeight: 88,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                letterSpacing: '0.08em',
                fontSize: 11,
                color: 'var(--ink-3)',
                textAlign: 'center',
                padding: 14,
              }}
            >
              [ NENHUM EVENTO CRITICO NESTE MOMENTO ]
            </div>
          </article>

          <article style={{ border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', marginBottom: 12 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Mapa federal</h3>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                UF: {activeUf}
              </span>
            </div>
            <BrazilDots active={activeUf} onPick={setActiveUf} dark />
          </article>

          <article
            style={{
              border: '1px solid var(--line)',
              background: 'linear-gradient(135deg, var(--panel) 0%, var(--panel-2) 100%)',
              padding: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <StatusDot tone="live" />
              <span className="label" style={{ color: 'var(--ink-3)' }}>
                API PUBLICA
              </span>
            </div>
            <div
              className="mono"
              style={{
                marginTop: 10,
                border: '1px solid var(--line-strong)',
                background: 'var(--bg-2)',
                padding: 12,
                fontSize: 11,
                lineHeight: 1.7,
                color: 'var(--ink-2)',
                overflowX: 'auto',
              }}
            >
              curl https://api.meuspoliticos.com.br/v1/politicos?uf=SP&limite=10
            </div>
          </article>
        </div>
      </section>
    </main>
  )
}
