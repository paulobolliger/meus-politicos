'use client'

import Link from 'next/link'
import { useState } from 'react'

// ─── Grid background inline ───────────────────────────────────────────────────
const GRID_BG: React.CSSProperties = {
  backgroundImage: 'linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)',
  backgroundSize: '60px 60px',
}

type TipoApoio = 'mensal' | 'unica'

export default function ApoioPage() {
  const [pagamentoEmAndamento, setPagamentoEmAndamento] = useState<TipoApoio | null>(null)
  const [erroPagamento, setErroPagamento] = useState<string | null>(null)

  async function iniciarApoio(tipo: TipoApoio, valor: number) {
    const nome = window.prompt('Informe seu nome completo')
    if (!nome?.trim()) return

    const email = window.prompt('Informe seu e-mail')
    if (!email?.trim() || !email.includes('@')) {
      setErroPagamento('Informe um e-mail valido para gerar o link de pagamento.')
      return
    }

    setPagamentoEmAndamento(tipo)
    setErroPagamento(null)

    try {
      const response = await fetch('/api/apoio/criar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          email: email.trim(),
          tipo,
          valor,
        }),
      })
      const data = await response.json()

      if (!response.ok || !data.url) {
        setErroPagamento(data.error ?? 'Nao foi possivel gerar o link de pagamento.')
        return
      }

      window.location.href = data.url
    } catch {
      setErroPagamento('Falha de conexao ao gerar o link de pagamento.')
    } finally {
      setPagamentoEmAndamento(null)
    }
  }

  const buttonBase: React.CSSProperties = {
    display: 'block',
    width: '100%',
    padding: '14px 0',
    borderRadius: 12,
    fontSize: 15,
    fontWeight: 700,
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
  }

  return (
    <div style={{ background: '#f4f5f0', color: '#0a0e1a' }}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={{
        ...GRID_BG,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 24px',
        borderBottom: '1px solid #e5e7eb',
        minHeight: 480,
      }}>
        <div style={{ maxWidth: 800 }}>
          <h1 style={{
            fontSize: 52, fontWeight: 900, lineHeight: 1.1,
            letterSpacing: '-0.03em', margin: '0 0 24px',
            color: '#0a0e1a',
          }}>
            Política transparente só existe<br />quando alguém sustenta isso.
          </h1>
          <p style={{
            fontSize: 18, color: '#4b5563', lineHeight: 1.7,
            maxWidth: 600, margin: '0 auto 40px',
          }}>
            Meus Políticos transforma dados públicos em informação acessível
            para milhões de brasileiros — sem paywall político, sem alinhamento
            partidário e sem manipulação institucional.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="#apoiar" style={{
              background: '#1d3a8a', color: '#fff',
              padding: '16px 36px', borderRadius: 12,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              boxShadow: '0 8px 24px rgba(29,58,138,0.25)',
            }}>
              Sustentar agora
            </a>
            <Link href="/manifesto" style={{
              background: '#fff', color: '#0a0e1a',
              padding: '16px 36px', borderRadius: 12,
              fontWeight: 700, fontSize: 15, textDecoration: 'none',
              border: '1px solid #e5e7eb',
            }}>
              Ler Manifesto
            </Link>
          </div>
        </div>
      </section>

      {/* ── Custo tecnológico ────────────────────────────────────────────── */}
      <section style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{
          maxWidth: 1200, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 80, alignItems: 'center',
        }}>
          {/* Texto */}
          <div>
            <div style={{
              fontSize: 11, fontWeight: 700, color: '#1d3a8a',
              letterSpacing: '0.25em', textTransform: 'uppercase', marginBottom: 20,
            }}>
              Data Engineering &amp; Rigor
            </div>
            <h2 style={{
              fontSize: 34, fontWeight: 800, lineHeight: 1.2,
              margin: '0 0 20px', letterSpacing: '-0.02em',
            }}>
              O custo tecnológico da verdade
            </h2>
            <p style={{
              fontSize: 16, color: '#4b5563', lineHeight: 1.75, margin: '0 0 40px',
            }}>
              Manter uma plataforma que monitora 513 deputados, 81 senadores e
              milhares de gastos em tempo real exige uma infraestrutura de nível
              enterprise. Não somos apenas um site; somos um terminal de dados
              que processa terabytes de requisições mensais.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              {[
                {
                  icon: '📊',
                  title: 'Consumo Massivo de APIs',
                  desc: 'Executamos jobs de scraping e sincronização a cada 15 minutos para garantir latência zero.',
                },
                {
                  icon: '🧠',
                  title: 'Processamento Semântico',
                  desc: 'Utilizamos modelos de IA para categorizar projetos de lei e detectar anomalias em gastos públicos.',
                },
              ].map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 16 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 10,
                    background: 'rgba(29,58,138,0.06)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 20, flexShrink: 0,
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{item.title}</div>
                    <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Imagem / Server visual */}
          <div style={{ position: 'relative' }}>
            <div style={{
              position: 'absolute', inset: -16,
              background: 'rgba(29,58,138,0.04)', borderRadius: 24, zIndex: 0,
            }} />
            <div style={{
              background: '#111827', borderRadius: 16,
              overflow: 'hidden', border: '1px solid #e5e7eb',
              boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
              position: 'relative', zIndex: 1,
            }}>
              {/* Dark server room visual */}
              <div style={{
                height: 280,
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: 32,
              }}>
                <div style={{ width: '100%' }}>
                  {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      marginBottom: i < 5 ? 10 : 0,
                    }}>
                      <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: i % 3 === 0 ? '#4ade80' : i % 3 === 1 ? '#3b82f6' : '#f59e0b',
                      }} />
                      <div style={{
                        flex: 1, height: 20, borderRadius: 4,
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 4,
                          width: `${30 + (i * 13) % 55}%`,
                          background: `rgba(99,102,241,${0.3 + (i * 0.07)})`,
                        }} />
                      </div>
                      <span style={{
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 10, color: 'rgba(255,255,255,0.3)',
                        minWidth: 36, textAlign: 'right',
                      }}>
                        {(40 + i * 9) % 100}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status bar */}
              <div style={{
                background: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(8px)',
                borderTop: '1px solid #e5e7eb',
                padding: '12px 20px',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#4b5563' }}>
                  INFRA_STATUS: <span style={{ color: '#16a34a', fontWeight: 700 }}>OPERATIONAL</span>
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#1d3a8a', fontWeight: 700 }}>
                  UPTIME 99.98%
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Transparência em Tempo Real ──────────────────────────────────── */}
      <section style={{
        background: '#fafafa', borderTop: '1px solid #e5e7eb',
        borderBottom: '1px solid #e5e7eb', padding: '80px 24px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'flex-end', gap: 24, marginBottom: 48, flexWrap: 'wrap',
          }}>
            <div style={{ maxWidth: 520 }}>
              <h2 style={{
                fontSize: 32, fontWeight: 800, margin: '0 0 12px',
                letterSpacing: '-0.02em',
              }}>
                Transparência em Tempo Real
              </h2>
              <p style={{ fontSize: 15, color: '#4b5563', margin: 0, lineHeight: 1.6 }}>
                Cada centavo investido é revertido em independência técnica.
                Aqui está como dividimos nossos custos operacionais.
              </p>
            </div>
          </div>

          <div style={{
            background: '#fff', borderRadius: 24,
            border: '1px solid #e5e7eb', overflow: 'hidden',
            boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
          }}>
            <div style={{ padding: '32px 32px 28px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#4b5563',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 24,
              }}>
                Alocação de Recursos
              </div>

              {/* Bar chart */}
              <div style={{
                display: 'flex', height: 64, width: '100%',
                borderRadius: 16, overflow: 'hidden', marginBottom: 28,
              }}>
                {[
                  { pct: 35, bg: '#1d3a8a', label: 'Infraestrutura' },
                  { pct: 25, bg: '#3b82f6', label: 'Engenharia' },
                  { pct: 20, bg: '#93c5fd', label: 'Coleta' },
                  { pct: 10, bg: '#d97706', label: 'IA Semântica' },
                  { pct: 10, bg: '#d1d5db', label: 'Operação' },
                ].map((seg, i, arr) => (
                  <div
                    key={seg.label}
                    title={`${seg.label}: ${seg.pct}%`}
                    style={{
                      width: `${seg.pct}%`,
                      background: seg.bg,
                      borderRight: i < arr.length - 1 ? '2px solid rgba(255,255,255,0.3)' : 'none',
                    }}
                  />
                ))}
              </div>

              {/* Legend */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16,
              }}>
                {[
                  { cor: '#1d3a8a', label: 'Infraestrutura: 35%' },
                  { cor: '#3b82f6', label: 'Engenharia: 25%' },
                  { cor: '#93c5fd', label: 'Coleta: 20%' },
                  { cor: '#d97706', label: 'IA Semântica: 10%' },
                  { cor: '#d1d5db', label: 'Operação: 10%' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.cor, flexShrink: 0 }} />
                    <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Planos de Apoio ───────────────────────────────────────────────── */}
      <section id="apoiar" style={{ background: '#fff', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <h2 style={{
              fontSize: 40, fontWeight: 900, margin: '0 0 14px',
              letterSpacing: '-0.02em',
            }}>
              Seja um mantenedor da independência
            </h2>
            <p style={{ fontSize: 16, color: '#4b5563', maxWidth: 480, margin: '0 auto' }}>
              Escolha o plano que melhor se adapta à sua vontade de transformar a
              transparência no Brasil.
            </p>
          </div>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24,
            maxWidth: 900, margin: '0 auto',
          }}>

            {/* Card 1 — Recorrente */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 24, padding: '40px 36px',
              display: 'flex', flexDirection: 'column',
              transition: 'box-shadow 0.2s, border-color 0.2s',
            }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: '#f9fafb', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, marginBottom: 20,
                }}>
                  👤
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
                  Apoio Cívico Recorrente
                </h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                  Contribuição mensal automática para sustentar os custos de
                  infraestrutura de dados de um parlamentar.
                </p>
              </div>

              <div style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 42, fontWeight: 900 }}>R$ 25</span>
                <span style={{ fontSize: 14, color: '#4b5563' }}>/mês</span>
              </div>
              <div style={{ fontSize: 10, color: '#9ca3af', marginBottom: 32 }}>
                Valor sugerido para apoio recorrente
              </div>

              <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px', display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                {['Selo de Mantenedor', 'Relatório de Impacto'].map(b => (
                  <li key={b} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 14, fontWeight: 500 }}>
                    <span style={{ color: '#16a34a', fontSize: 18 }}>✓</span> {b}
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={() => iniciarApoio('mensal', 25)}
                disabled={pagamentoEmAndamento !== null}
                style={{
                  ...buttonBase,
                  border: '2px solid #1d3a8a',
                  background: 'transparent',
                  color: '#1d3a8a',
                  opacity: pagamentoEmAndamento !== null ? 0.6 : 1,
                }}
              >
                {pagamentoEmAndamento === 'mensal' ? 'Gerando link...' : 'Apoiar com R$ 25'}
              </button>
            </div>

            {/* Card 2 — Esporádico */}
            <div style={{
              background: '#fff', border: '1px solid #e5e7eb',
              borderRadius: 24, padding: '40px 36px',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ marginBottom: 32 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14,
                  background: '#f9fafb', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: 24, marginBottom: 20,
                }}>
                  📲
                </div>
                <h3 style={{ fontSize: 20, fontWeight: 800, margin: '0 0 8px' }}>
                  Apoio Esporádico
                </h3>
                <p style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6, margin: 0 }}>
                  Contribua com qualquer valor, quando quiser, sem compromisso mensal.
                </p>
              </div>

              <div style={{ marginBottom: 32 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#4b5563', display: 'block', marginBottom: 4 }}>
                  Qualquer valor
                </span>
              </div>

              {/* PIX placeholder */}
              <div style={{
                flex: 1,
                background: '#f9fafb', borderRadius: 16,
                border: '1.5px dashed #d1d5db',
                padding: 28, marginBottom: 32,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 10, textAlign: 'center',
              }}>
                <span style={{ fontSize: 40, opacity: 0.3 }}>⬛</span>
                <p style={{ fontSize: 12, fontStyle: 'italic', color: '#6b7280', margin: 0, lineHeight: 1.5 }}>
                  "Transparência não tem preço, mas tem custos fixos."
                </p>
              </div>

              <button
                type="button"
                onClick={() => iniciarApoio('unica', 50)}
                disabled={pagamentoEmAndamento !== null}
                style={{
                  ...buttonBase,
                  border: 'none',
                  background: '#f3f4f6',
                  color: '#0a0e1a',
                  opacity: pagamentoEmAndamento !== null ? 0.6 : 1,
                }}
              >
                {pagamentoEmAndamento === 'unica' ? 'Gerando link...' : 'Contribuir com R$ 50'}
              </button>
            </div>
          </div>

          {erroPagamento && (
            <p style={{ margin: '20px auto 0', maxWidth: 620, textAlign: 'center', color: '#b91c1c', fontSize: 13, lineHeight: 1.5 }}>
              {erroPagamento}
            </p>
          )}
        </div>
      </section>

      {/* ── Manifesto Closing ─────────────────────────────────────────────── */}
      <section style={{
        background: '#0a0e1a', color: '#fff',
        padding: '96px 24px', textAlign: 'center',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Grid overlay */}
        <div style={{
          ...GRID_BG,
          position: 'absolute', inset: 0,
          opacity: 0.04, pointerEvents: 'none',
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.15) 1px, transparent 1px)',
        }} />
        <div style={{ maxWidth: 800, margin: '0 auto', position: 'relative', zIndex: 1 }}>
          <h2 style={{
            fontSize: 44, fontWeight: 900, lineHeight: 1.15,
            margin: '0 0 24px', letterSpacing: '-0.02em',
          }}>
            Democracia transparente depende de infraestrutura independente.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', margin: '0 0 40px', lineHeight: 1.7 }}>
            Você está ajudando a manter a transparência política acessível e livre para todo o Brasil.
          </p>
          <div style={{ width: 96, height: 6, background: '#1d3a8a', borderRadius: 999, margin: '0 auto' }} />
        </div>
      </section>

    </div>
  )
}
