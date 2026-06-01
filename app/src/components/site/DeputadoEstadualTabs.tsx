'use client'

import { useState } from 'react'

const TABS = [
  { id: 'votacoes',  label: 'Votações' },
  { id: 'gastos',    label: 'Gastos' },
  { id: 'atuacao',   label: 'Atuação' },
  { id: 'biografia', label: 'Biografia' },
]

export type DepTabData = {
  nome_eleitoral: string
  nome:           string | null
  sexo:           string | null
  data_nascimento: string | null
  naturalidade:   string | null
  escolaridade:   string | null
  ocupacao:       string | null
  partido:        string | null
  partido_nome:   string | null
  uf:             string
  presenca_pct_atual:       string | null
  gasto_total_ano:          string | null
  total_votacoes:           number | null
  total_emendas_ano:        string | null
  total_emendas_historico:  string | null
  numero_mandato:           number | null
  mandato_inicio:           string | null
  mandato_fim:              string | null
}

interface Props {
  dep:        DepTabData
  cor:        string
  pCor:       string
  sigla:      string
  estadoNome: string
}

export function DeputadoEstadualTabs({ dep, cor, pCor, sigla, estadoNome }: Props) {
  const [active, setActive] = useState('votacoes')

  const GASTOS_CATS = [
    'Passagens aéreas', 'Alimentação', 'Divulgação',
    'Hospedagem', 'Combustível', 'Consultoria',
  ]

  return (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: 14, overflow: 'hidden' }}>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid #e5e7eb', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            padding: '14px 22px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 14, fontWeight: active === tab.id ? 700 : 400,
            color: active === tab.id ? cor : '#6b7280',
            borderBottom: active === tab.id ? `2px solid ${cor}` : '2px solid transparent',
            marginBottom: -1, whiteSpace: 'nowrap',
            transition: 'all 0.15s', fontFamily: 'var(--font-sans)', flexShrink: 0,
          }}>
            {tab.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px' }}>

        {/* ── VOTAÇÕES ─────────────────────────────────── */}
        {active === 'votacoes' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                Votos nominais em plenário — legislatura 2023–2026
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: '#fef3c7', color: '#d97706',
              }}>Em breve</span>
            </div>

            {/* Legenda de votos */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'SIM',    bg: '#dcfce7', fg: '#15803d' },
                { label: 'NÃO',   bg: '#fee2e2', fg: '#dc2626' },
                { label: 'ABS',   bg: '#fef3c7', fg: '#d97706' },
                { label: 'FALTA', bg: '#f3f4f6', fg: '#6b7280' },
              ].map(v => (
                <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '1px 8px', borderRadius: 999,
                    background: v.bg, color: v.fg,
                  }}>{v.label}</span>
                </div>
              ))}
            </div>

            {/* Skeleton da tabela */}
            <div style={{ border: '1px solid #f3f4f6', borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div style={{
                display: 'grid', gridTemplateColumns: '90px 1fr 80px 120px',
                padding: '10px 16px', background: '#f9fafb',
                borderBottom: '1px solid #f3f4f6', gap: 12,
              }}>
                {['DATA', 'PROPOSIÇÃO', 'VOTO', 'RESULTADO'].map(h => (
                  <span key={h} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: '#9ca3af', fontFamily: 'var(--font-mono)',
                  }}>{h}</span>
                ))}
              </div>
              {/* Skeleton rows */}
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} style={{
                  display: 'grid', gridTemplateColumns: '90px 1fr 80px 120px',
                  padding: '14px 16px', borderBottom: '1px solid #f9fafb',
                  alignItems: 'center', gap: 12,
                  opacity: 1 - i * 0.12,
                }}>
                  <div style={{ height: 10, background: '#e5e7eb', borderRadius: 4, width: 64 }} />
                  <div>
                    <div style={{ height: 10, background: '#e5e7eb', borderRadius: 4, width: '75%', marginBottom: 6 }} />
                    <div style={{ height: 8, background: '#f3f4f6', borderRadius: 4, width: '45%' }} />
                  </div>
                  <div style={{
                    height: 22, borderRadius: 6, width: 52,
                    background: i % 3 === 0 ? '#fee2e2' : i % 3 === 1 ? '#dcfce7' : '#fef3c7',
                  }} />
                  <div style={{ height: 18, background: '#f3f4f6', borderRadius: 4, width: 90 }} />
                </div>
              ))}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12, color: '#9ca3af', textAlign: 'center' }}>
              Votações da ALE {dep.uf} serão integradas após coleta de dados. Fonte: Assembleia Legislativa.
            </p>
          </div>
        )}

        {/* ── GASTOS ───────────────────────────────────── */}
        {active === 'gastos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: '#111827' }}>
                  Verba de Gabinete
                </p>
                <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
                  Despesas com pessoal, viagens, material e serviços de escritório
                </p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: '#fef3c7', color: '#d97706', flexShrink: 0,
              }}>Em breve</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GASTOS_CATS.map(cat => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: '#374151' }}>{cat}</span>
                    <span style={{ fontSize: 12, color: '#d1d5db', fontFamily: 'var(--font-mono)' }}>—</span>
                  </div>
                  <div style={{ height: 6, background: '#f3f4f6', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: '0%', background: '#D97706', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 24, padding: '16px 20px',
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: '#92400e' }}>
                💡 <strong>Sabia que?</strong> Cada deputado estadual tem direito a uma verba de gabinete
                para custear assessores, viagens e material de trabalho. Os valores variam por estado.
                Os dados de {estadoNome} serão integrados em breve.
              </p>
            </div>
          </div>
        )}

        {/* ── ATUAÇÃO ──────────────────────────────────── */}
        {active === 'atuacao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* PLs de autoria */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                  PROJETOS DE LEI DE AUTORIA
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                  background: '#fef3c7', color: '#d97706',
                }}>Em breve</span>
              </div>
              <div style={{
                padding: '24px', textAlign: 'center',
                border: '1px dashed #e5e7eb', borderRadius: 10, color: '#9ca3af', fontSize: 13,
              }}>
                📄 Projetos de lei apresentados por {dep.nome_eleitoral} na ALE {dep.uf} serão listados aqui.
              </div>
            </div>

            {/* Comissões */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                  COMISSÕES PERMANENTES
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                  background: '#fef3c7', color: '#d97706',
                }}>Em breve</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    padding: '10px 14px', borderRadius: 8,
                    border: '1px solid #e5e7eb', background: '#f9fafb',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#e5e7eb', flexShrink: 0 }} />
                    <div style={{ height: 10, background: '#e5e7eb', borderRadius: 4, flex: 1 }} />
                  </div>
                ))}
              </div>
            </div>

            {/* Pronunciamentos */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                  PRONUNCIAMENTOS EM PLENÁRIO
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                  background: '#fef3c7', color: '#d97706',
                }}>Em breve</span>
              </div>
              <div style={{
                padding: '20px 24px', border: '1px dashed #e5e7eb', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 12, color: '#9ca3af', fontSize: 13,
              }}>
                🎤 Discursos e pronunciamentos de {dep.nome_eleitoral} em plenário serão listados aqui.
              </div>
            </div>

            {/* Alinhamento partidário — placeholder */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                ALINHAMENTO PARTIDÁRIO
              </div>
              <div style={{
                padding: '20px 24px',
                background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>VOTOS COM O {dep.partido ?? 'PARTIDO'}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: '#e5e7eb', fontFamily: 'var(--font-display)' }}>—</div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, background: '#e5e7eb', borderRadius: 999, marginBottom: 6 }} />
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>
                    % de votações em que acompanhou a orientação do {dep.partido_nome ?? dep.partido ?? 'partido'} — disponível após coleta de votações
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── BIOGRAFIA ────────────────────────────────── */}
        {active === 'biografia' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Histórico eleitoral */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                HISTÓRICO ELEITORAL
              </div>
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* Linha vertical */}
                <div style={{ position: 'absolute', left: 9, top: 8, bottom: 0, width: 1, background: '#e5e7eb' }} />

                {/* 2022 — dado real */}
                <div style={{ position: 'relative', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid #f3f4f6' }}>
                  <div style={{
                    position: 'absolute', left: -19, top: 4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: cor, border: '2px solid white',
                    boxShadow: `0 0 0 2px ${cor}44`,
                  }} />
                  <div style={{ fontSize: 11, color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>ELEIÇÕES 2022</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#111827', marginBottom: 3 }}>
                    Eleito{dep.sexo === 'F' ? 'a' : ''} Deputado{dep.sexo === 'F' ? 'a' : ''} Estadual — {dep.uf}
                    {dep.partido ? ` · ${dep.partido}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: '#6b7280' }}>
                    Tomou posse em janeiro de 2023. Mandato até dezembro de 2026.
                    {dep.numero_mandato ? ` ${dep.numero_mandato}º mandato.` : ''}
                  </div>
                </div>

                {/* Eleições anteriores — placeholder */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -19, top: 4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: '#e5e7eb', border: '2px solid white',
                  }} />
                  <div style={{ fontSize: 11, color: '#d1d5db', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>ELEIÇÕES ANTERIORES</div>
                  <div style={{ fontSize: 13, color: '#9ca3af' }}>
                    Candidaturas anteriores (TSE) serão integradas em breve — Sprint 3 do projeto.
                  </div>
                </div>
              </div>
            </div>

            {/* Declaração de bens */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)' }}>
                  DECLARAÇÃO DE BENS (TSE 2022)
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                  background: '#fef3c7', color: '#d97706',
                }}>Em breve</span>
              </div>
              <div style={{
                padding: '16px 20px', background: '#f9fafb',
                border: '1px solid #e5e7eb', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ fontSize: 28 }}>🏛️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: '#374151' }}>Patrimônio declarado ao TSE</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                    Dados da declaração de bens referentes à candidatura em 2022 serão integrados.
                  </div>
                </div>
              </div>
            </div>

            {/* Dados pessoais */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                DADOS PESSOAIS
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Nome civil',    value: dep.nome ?? '—' },
                  { label: 'Escolaridade',  value: dep.escolaridade ?? '—' },
                  { label: 'Naturalidade',  value: dep.naturalidade ?? '—' },
                  { label: 'Ocupação',      value: dep.ocupacao ?? '—' },
                ].map(item => (
                  <div key={item.label} style={{
                    padding: '12px 16px', background: '#f9fafb',
                    border: '1px solid #e5e7eb', borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 10, color: '#9ca3af', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      {item.label.toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      color: item.value === '—' ? '#d1d5db' : '#374151',
                    }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
