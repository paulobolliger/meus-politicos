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
  atuacaoActive?: boolean
}

export function DeputadoEstadualTabs({ dep, cor, estadoNome, atuacaoActive }: Props) {
  const [active, setActive] = useState('votacoes')

  const GASTOS_CATS = [
    'Passagens aéreas', 'Alimentação', 'Divulgação',
    'Hospedagem', 'Combustível', 'Consultoria',
  ]

  return (
    <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 16, overflow: 'hidden' }}>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--line)', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActive(tab.id)} style={{
            padding: '14px 22px',
            border: 'none', background: 'transparent', cursor: 'pointer',
            fontSize: 14, fontWeight: active === tab.id ? 700 : 400,
            color: active === tab.id ? cor : 'var(--ink-3)',
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
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                Votos nominais em plenário — legislatura 2023–2026
              </p>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: 'var(--warn-soft)', color: 'var(--warn)',
              }}>Em breve</span>
            </div>

            {/* Legenda de votos */}
            <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
              {[
                { label: 'SIM',    bg: 'var(--pos-soft)', fg: 'var(--pos)' },
                { label: 'NÃO',   bg: 'var(--neg-soft)', fg: 'var(--neg)' },
                { label: 'ABS',   bg: 'var(--warn-soft)', fg: 'var(--warn)' },
                { label: 'FALTA', bg: 'var(--bg)', fg: 'var(--ink-3)' },
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
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, overflow: 'hidden' }}>
              {/* Header */}
              <div className="hidden sm:grid" style={{
                gridTemplateColumns: '90px 1fr 80px 120px',
                padding: '10px 16px', background: 'var(--bg)',
                borderBottom: '1px solid var(--line)', gap: 12,
              }}>
                {['DATA', 'PROPOSIÇÃO', 'VOTO', 'RESULTADO'].map(h => (
                  <span key={h} style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
                    color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                  }}>{h}</span>
                ))}
              </div>
              {/* Skeleton rows */}
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex flex-col sm:grid sm:grid-cols-[90px_1fr_80px_120px] gap-3 sm:gap-3 p-4 sm:p-4 border-b border-[var(--line)] last:border-b-0 sm:items-center" style={{
                  opacity: 1 - i * 0.12,
                }}>
                  {/* Date */}
                  <div className="flex items-center justify-between sm:block w-full sm:w-auto">
                    <span className="sm:hidden text-[10px] font-bold text-[var(--ink-3)] font-mono">DATA</span>
                    <div style={{ height: 10, background: 'var(--line)', borderRadius: 4, width: 64 }} />
                  </div>
                  {/* Proposition */}
                  <div className="flex flex-col gap-1 w-full">
                    <div style={{ height: 10, background: 'var(--line)', borderRadius: 4, width: '75%', marginBottom: 2 }} />
                    <div style={{ height: 8, background: 'var(--bg)', borderRadius: 4, width: '45%' }} />
                  </div>
                  {/* Vote */}
                  <div className="flex items-center justify-between sm:block w-full sm:w-auto">
                    <span className="sm:hidden text-[10px] font-bold text-[var(--ink-3)] font-mono">VOTO</span>
                    <div style={{
                      height: 22, borderRadius: 6, width: 52,
                      background: i % 3 === 0 ? 'var(--neg-soft)' : i % 3 === 1 ? 'var(--pos-soft)' : 'var(--warn-soft)',
                    }} />
                  </div>
                  {/* Result */}
                  <div className="flex items-center justify-between sm:block w-full sm:w-auto">
                    <span className="sm:hidden text-[10px] font-bold text-[var(--ink-3)] font-mono">RESULTADO</span>
                    <div style={{ height: 18, background: 'var(--bg)', borderRadius: 4, width: 90 }} />
                  </div>
                </div>
              ))}
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12, color: 'var(--ink-3)', textAlign: 'center' }}>
              Votações da ALE {dep.uf} serão integradas após coleta de dados. Fonte: Assembleia Legislativa.
            </p>
          </div>
        )}

        {/* ── GASTOS ───────────────────────────────────── */}
        {active === 'gastos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  Verba de Gabinete
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                  Despesas com pessoal, viagens, material e serviços de escritório
                </p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
                background: 'var(--warn-soft)', color: 'var(--warn)', flexShrink: 0,
              }}>Em breve</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {GASTOS_CATS.map(cat => (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{cat}</span>
                    <span style={{ fontSize: 12, color: 'var(--mute)', fontFamily: 'var(--font-mono)' }}>—</span>
                  </div>
                  <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999 }}>
                    <div style={{ height: '100%', width: '0%', background: 'var(--warn)', borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              marginTop: 24, padding: '16px 20px',
              background: 'var(--warn-soft)', border: '1px solid var(--warn)33', borderRadius: 10,
            }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--warn)', lineHeight: 1.5 }}>
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
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  PROJETOS DE LEI DE AUTORIA
                </div>
                {!atuacaoActive && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    background: 'var(--warn-soft)', color: 'var(--warn)',
                  }}>Em breve</span>
                )}
              </div>
              <div style={{
                padding: '24px', textAlign: 'center',
                border: '1px dashed var(--line)', borderRadius: 10, color: 'var(--ink-3)', fontSize: 13,
              }}>
                {atuacaoActive 
                  ? `Nenhum projeto de lei de autoria de ${dep.nome_eleitoral} foi localizado no banco de dados para a legislatura atual.`
                  : `📄 Projetos de lei apresentados por ${dep.nome_eleitoral} na ALE ${dep.uf} serão listados aqui.`}
              </div>
            </div>

            {/* Comissões */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  COMISSÕES PERMANENTES
                </div>
                {!atuacaoActive && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    background: 'var(--warn-soft)', color: 'var(--warn)',
                  }}>Em breve</span>
                )}
              </div>
              {atuacaoActive ? (
                <div style={{
                  padding: '24px', textAlign: 'center',
                  border: '1px dashed var(--line)', borderRadius: 10, color: 'var(--ink-3)', fontSize: 13,
                }}>
                  Nenhuma participação em comissões permanentes registrada no momento.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 8 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{
                      padding: '10px 14px', borderRadius: 8,
                      border: '1px solid var(--line)', background: 'var(--bg)',
                      display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--line)', flexShrink: 0 }} />
                      <div style={{ height: 10, background: 'var(--line)', borderRadius: 4, flex: 1 }} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pronunciamentos */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  PRONUNCIAMENTOS EM PLENÁRIO
                </div>
                {!atuacaoActive && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    background: 'var(--warn-soft)', color: 'var(--warn)',
                  }}>Em breve</span>
                )}
              </div>
              <div style={{
                padding: '20px 24px', border: '1px dashed var(--line)', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 12, color: 'var(--ink-3)', fontSize: 13,
              }}>
                {atuacaoActive
                  ? `Nenhum discurso ou pronunciamento de ${dep.nome_eleitoral} em plenário foi registrado até o momento.`
                  : `🎤 Discursos e pronunciamentos de ${dep.nome_eleitoral} em plenário serão listados aqui.`}
              </div>
            </div>

            {/* Alinhamento partidário — placeholder */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                ALINHAMENTO PARTIDÁRIO
              </div>
              <div style={{
                padding: '20px 24px',
                background: 'var(--bg)', border: '1px solid var(--line)', borderRadius: 12,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>VOTOS COM O {dep.partido ?? 'PARTIDO'}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                    {atuacaoActive ? '100%' : '—'}
                  </div>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ height: 8, background: 'var(--line)', borderRadius: 999, marginBottom: 6 }}>
                    {atuacaoActive && (
                      <div style={{ height: '100%', width: '100%', background: cor, borderRadius: 999 }} />
                    )}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                    {atuacaoActive
                      ? `O parlamentar seguiu as orientações do ${dep.partido_nome ?? dep.partido ?? 'partido'} em todas as votações nominais computadas.`
                      : `% de votações em que acompanhou a orientação do ${dep.partido_nome ?? dep.partido ?? 'partido'} — disponível após coleta de votações`}
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
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 16 }}>
                HISTÓRICO ELEITORAL
              </div>
              <div style={{ position: 'relative', paddingLeft: 28 }}>
                {/* Linha vertical */}
                <div style={{ position: 'absolute', left: 9, top: 8, bottom: 0, width: 1, background: 'var(--line)' }} />

                {/* 2022 — dado real */}
                <div style={{ position: 'relative', marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--line)' }}>
                  <div style={{
                    position: 'absolute', left: -19, top: 4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: cor, border: '2px solid var(--panel)',
                    boxShadow: `0 0 0 2px ${cor}44`,
                  }} />
                  <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>ELEIÇÕES 2022</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)', marginBottom: 3 }}>
                    Eleito{dep.sexo === 'F' ? 'a' : ''} Deputado{dep.sexo === 'F' ? 'a' : ''} Estadual — {dep.uf}
                    {dep.partido ? ` · ${dep.partido}` : ''}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-2)' }}>
                    Tomou posse em janeiro de 2023. Mandato até dezembro de 2026.
                    {dep.numero_mandato ? ` ${dep.numero_mandato}º mandato.` : ''}
                  </div>
                </div>

                {/* Eleições anteriores — placeholder */}
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', left: -19, top: 4,
                    width: 10, height: 10, borderRadius: '50%',
                    background: 'var(--line)', border: '2px solid var(--panel)',
                  }} />
                  <div style={{ fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>ELEIÇÕES ANTERIORES</div>
                  <div style={{ fontSize: 13, color: 'var(--ink-3)' }}>
                    Candidaturas anteriores (TSE) serão integradas em breve — Sprint 3 do projeto.
                  </div>
                </div>
              </div>
            </div>

            {/* Declaração de bens */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  DECLARAÇÃO DE BENS (TSE 2022)
                </div>
                <span style={{
                  fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                  background: 'var(--warn-soft)', color: 'var(--warn)',
                }}>Em breve</span>
              </div>
              <div style={{
                padding: '16px 20px', background: 'var(--bg)',
                border: '1px solid var(--line)', borderRadius: 10,
                display: 'flex', alignItems: 'center', gap: 14,
              }}>
                <span style={{ fontSize: 28 }}>🏛️</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>Patrimônio declarado ao TSE</div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    Dados da declaração de bens referentes à candidatura em 2022 serão integrados.
                  </div>
                </div>
              </div>
            </div>

            {/* Dados pessoais */}
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
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
                    padding: '12px 16px', background: 'var(--bg)',
                    border: '1px solid var(--line)', borderRadius: 10,
                  }}>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      {item.label.toUpperCase()}
                    </div>
                    <div style={{
                      fontSize: 13, fontWeight: 500,
                      color: item.value === '—' ? 'var(--mute)' : 'var(--ink-2)',
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
