'use client'

import { useState } from 'react'

const TABS = [
  { id: 'votacoes',  label: 'Votações' },
  { id: 'gastos',    label: 'Gastos' },
  { id: 'atuacao',   label: 'Atuação' },
  { id: 'biografia', label: 'Biografia' },
]

export type VerTabData = {
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
  ver:        VerTabData
  cor:        string
  pCor:       string
  sigla:      string
  cidadeNome: string
  atuacaoActive?: boolean
}

export function VereadorTabs({ ver, cor, cidadeNome, atuacaoActive }: Props) {
  const [active, setActive] = useState('biografia') // Default to biografia for local politicians as biography is most relevant

  const GASTOS_CATS = [
    'Manutenção de gabinete', 'Material de escritório', 'Divulgação',
    'Locação de veículos', 'Combustível', 'Serviços de consultoria',
  ]

  const fmtData = (d: string | null): string => {
    if (!d) return '—'
    return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
  }

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
                Votos nominais em plenário na Câmara Municipal — legislatura 2025–2028
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

            {/* Skeleton Table */}
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
              {[1, 2, 3].map(i => (
                <div key={i} className="flex flex-col sm:grid sm:grid-cols-[90px_1fr_80px_120px] gap-3 sm:gap-3 p-4 sm:p-4 border-b border-[var(--line)] last:border-b-0 sm:items-center" style={{
                  opacity: 1 - i * 0.2,
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
                      background: i % 2 === 0 ? 'var(--pos-soft)' : 'var(--neg-soft)',
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
              Histórico de votações dos vereadores de {cidadeNome} será disponibilizado após as integrações com os diários oficiais.
            </p>
          </div>
        )}

        {/* ── GASTOS ───────────────────────────────────── */}
        {active === 'gastos' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <p style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                  Cotas Parlamentares (Gastos de Gabinete)
                </p>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>
                  Despesas custeadas com verbas públicas reembolsadas pela Câmara Municipal
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
                    <span style={{ fontSize: 12, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>—</span>
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
                💡 Cada vereador dispõe de verbas indenizatórias para custear o funcionamento do seu mandato. Os relatórios de gastos oficiais da Câmara Municipal de {cidadeNome} serão publicados em breve.
              </p>
            </div>
          </div>
        )}

        {/* ── ATUAÇÃO ──────────────────────────────────── */}
        {active === 'atuacao' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  PROJETOS DE LEI, REQUERIMENTOS E INDICAÇÕES
                </div>
                {!atuacaoActive && (
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 10px', borderRadius: 999,
                    background: 'var(--warn-soft)', color: 'var(--warn)',
                  }}>Em breve</span>
                )}
              </div>
              <div style={{
                border: '1px dashed var(--line)', borderRadius: 10, padding: '32px',
                textAlign: 'center', color: 'var(--ink-3)', fontSize: 13,
              }}>
                {atuacaoActive
                  ? `Nenhum projeto de lei, requerimento ou indicação de autoria de ${ver.nome_eleitoral} foi localizado no banco de dados para a legislatura atual.`
                  : `📄 Projetos apresentados pelo(a) vereador(a) serão carregados em breve do portal da transparência local.`}
              </div>
            </div>
          </div>
        )}

        {/* ── BIOGRAFIA ────────────────────────────────── */}
        {active === 'biografia' && (
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px' }}>
              Informações Pessoais
            </h3>

            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: '20px 32px', marginBottom: 32,
            }}>
              {[
                { label: 'Nome Completo', value: ver.nome },
                { label: 'Gênero', value: ver.sexo === 'F' ? 'Feminino' : ver.sexo === 'M' ? 'Masculino' : '—' },
                { label: 'Data de Nascimento', value: fmtData(ver.data_nascimento) },
                { label: 'Naturalidade', value: ver.naturalidade },
                { label: 'Escolaridade', value: ver.escolaridade },
                { label: 'Ocupação Declarada', value: ver.ocupacao },
              ].map(item => (
                <div key={item.label} style={{ borderBottom: '1px solid var(--line)', paddingBottom: 10 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block', textTransform: 'uppercase', marginBottom: 4 }}>
                    {item.label}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>
                    {item.value ?? '—'}
                  </span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px' }}>
              Histórico Eleitoral e Mandatos
            </h3>
            <div style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              <p style={{ margin: '0 0 8px' }}>
                Eleito(a) no pleito municipal para exercer o mandato correspondente à legislatura <strong>2025–2028</strong>.
              </p>
              <p style={{ margin: 0 }}>
                Início do mandato: <strong>{ver.mandato_inicio ? fmtData(ver.mandato_inicio) : '01/01/2025'}</strong>.
              </p>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
