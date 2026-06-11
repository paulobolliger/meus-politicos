'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── Types ────────────────────────────────────────────────────────────────────
export type CandidatoData = {
  id: string
  nome: string
  nome_urna: string | null
  slug: string | null
  cargo: string
  uf: string
  situacao: string | null
  genero: string | null
  cor_raca: string | null
  sequencial_tse: string | null
  escolaridade: string | null
  ocupacao: string | null
  descricao: string | null
  link_foto: string | null
  foto_url: string | null          // da tabela politicos (se vinculado)
  partido_sigla: string | null
  partido_nome: string | null
  politico_slug: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
}

export type BemPatrimonial = {
  descricao: string | null
  valor: number
  ano: number
}

// ─── Constants ────────────────────────────────────────────────────────────────
const CARGO_LABEL: Record<string, string> = {
  presidente:        'Presidente da República',
  vice_presidente:   'Vice-Presidente',
  governador:        'Governador(a)',
  vice_governador:   'Vice-Governador(a)',
  senador:           'Senador(a)',
  deputado_federal:  'Deputado(a) Federal',
  deputado_estadual: 'Deputado(a) Estadual',
}

const TABS = [
  { id: 'visao-geral', label: 'VISÃO GERAL' },
  { id: 'propostas',   label: 'PROPOSTAS' },
  { id: 'historico',   label: 'HISTÓRICO' },
  { id: 'bens',        label: 'BENS DECLARADOS' },
] as const

type TabId = typeof TABS[number]['id']

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getSituacaoBadge(s: string | null) {
  const lower = (s ?? '').toLowerCase()
  if (lower.includes('deferido') && !lower.includes('in')) {
    return { bg: '#dcfce7', color: '#15803d', border: '#bbf7d0', label: '✓ DEFERIDO' }
  }
  if (lower.includes('indeferido') || lower.includes('cassado') || lower.includes('cancelado')) {
    return { bg: '#fee2e2', color: '#b91c1c', border: '#fecaca', label: '✗ INDEFERIDO' }
  }
  return { bg: '#fef3c7', color: '#92400e', border: '#fde68a', label: '⏳ EM JULGAMENTO' }
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase()
}

const AVATAR_BG = ['#1d3a8a','#5b21b6','#065f46','#7c2d12','#164e63']
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_BG[Math.abs(h) % AVATAR_BG.length]
}

function fmtMoeda(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`
  if (v >= 1_000)     return `R$ ${(v / 1_000).toFixed(0)}K`
  return `R$ ${v.toFixed(0)}`
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function InfoTag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 10,
      background: 'var(--bg-2)', border: '1px solid var(--line)',
    }}>
      <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontWeight: 700, marginBottom: 4 }}>
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)' }}>{value}</div>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function PropostaCard({ icon, titulo, texto }: { icon: string; titulo: string; texto: string }) {
  return (
    <div style={{
      background: 'var(--panel)', borderRadius: 10, padding: '20px',
      border: '1px solid var(--line)',
      transition: 'box-shadow 0.15s ease',
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      <div style={{
        width: 44, height: 44, borderRadius: 10,
        background: 'var(--bg-2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, flexShrink: 0,
      }}>
        {icon}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{titulo}</div>
      <div style={{ fontSize: 13, color: 'var(--ink-3)', lineHeight: 1.6 }}>{texto}</div>
    </div>
  )
}

// ─── Tab content ──────────────────────────────────────────────────────────────

function TabVisaoGeral({ c, bens }: { c: CandidatoData; bens: BemPatrimonial[] }) {
  // Calcular evolução patrimonial por ano
  const bemPorAno = new Map<number, number>()
  bens.forEach(b => bemPorAno.set(b.ano, (bemPorAno.get(b.ano) ?? 0) + b.valor))
  const bemAnos = Array.from(bemPorAno.entries()).sort((a, b) => a[0] - b[0])
  const maxBem = Math.max(...bemAnos.map(([, v]) => v), 1)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,2fr) minmax(0,1fr)', gap: 24, alignItems: 'start' }}>

      {/* ── Coluna esquerda ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* Bio */}
        <section style={{
          background: 'var(--panel)', borderRadius: 12, padding: '24px 28px',
          border: '1px solid var(--line)',
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18 }}>👤</span> Resumo Biográfico
          </h2>
          {c.descricao ? (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.75 }}>
              {c.descricao}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.75, fontStyle: 'italic' }}>
              Dados biográficos serão disponibilizados após a importação completa dos dados do TSE.
            </p>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 20 }}>
            <InfoTag label="Escolaridade" value={c.escolaridade ?? 'Não informado'} />
            <InfoTag label="Ocupação"     value={c.ocupacao     ?? 'Não informado'} />
            {c.genero    && <InfoTag label="Gênero"  value={c.genero} />}
            {c.cor_raca  && <InfoTag label="Cor/Raça" value={c.cor_raca} />}
          </div>
        </section>

        {/* Plano de governo */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>📋</span> Plano de Governo
            </h2>
            <span style={{
              fontSize: 12, fontWeight: 500, color: 'var(--ink-3)',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              📄 Plano registrado no TSE
            </span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <PropostaCard icon="🏥" titulo="Saúde"     texto="Ampliação do atendimento digital e fortalecimento da atenção básica." />
            <PropostaCard icon="🎓" titulo="Educação"  texto="Ensino técnico integrado e modernização da infraestrutura escolar." />
            <PropostaCard icon="🛡️" titulo="Segurança" texto="Integração de inteligência de dados e policiamento comunitário." />
            <PropostaCard icon="💰" titulo="Economia"  texto="Redução de burocracia e incentivos fiscais para inovação." />
          </div>
          <div style={{
            marginTop: 12, padding: '10px 14px', borderRadius: 8,
            background: 'var(--warn-soft)', border: '1px solid var(--warn)',
            fontSize: 12, color: 'var(--ink-2)',
          }}>
            <strong>⚠️ Nota:</strong> O plano de governo é fornecido pelo próprio candidato ao TSE. O conteúdo não é verificado pela plataforma.
          </div>
        </section>
      </div>

      {/* ── Coluna direita ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Patrimônio */}
        <section style={{
          background: 'var(--panel)', borderRadius: 12, padding: '24px',
          border: '1px solid var(--line)',
        }}>
          <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>📈</span> Evolução Patrimonial
          </h2>

          {bemAnos.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {bemAnos.map(([ano, valor]) => {
                const pct = Math.round((valor / maxBem) * 100)
                return (
                  <div key={ano}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                      <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{ano}</span>
                      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>{fmtMoeda(valor)}</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--ink-3)', fontSize: 13, fontStyle: 'italic' }}>
              Bens declarados ao TSE serão exibidos após importação do ETL.
            </div>
          )}
        </section>

        {/* IA Summary */}
        <section style={{
          background: 'var(--panel)', borderRadius: 12, padding: '20px',
          border: '1px solid var(--line)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontSize: 16 }}>✨</span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              RESUMO COM IA
            </span>
            <span style={{
              fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999,
              background: 'var(--brand-soft)', color: 'var(--brand)',
              letterSpacing: '0.06em',
            }}>
              IA CÍVICA
            </span>
          </div>

          <div style={{ padding: '12px', background: 'var(--bg-2)', borderRadius: 8, marginBottom: 12 }}>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.65 }}>
              {c.descricao
                ? `${c.nome_urna ?? c.nome} é candidato(a) a ${CARGO_LABEL[c.cargo] ?? c.cargo} por ${c.partido_sigla ?? 'partido não informado'} em ${c.uf}.`
                : 'Análise gerada por IA estará disponível após a importação completa dos dados e propostas do candidato.'
              }
            </p>
          </div>
        </section>

        {/* Fonte */}
        <div style={{
          padding: '14px 16px', borderRadius: 10,
          border: '1px solid var(--line)', background: 'var(--panel)',
          display: 'flex', gap: 10, alignItems: 'flex-start',
        }}>
          <span style={{ fontSize: 16, flexShrink: 0, marginTop: 1 }}>ℹ️</span>
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
              FONTE DOS DADOS
            </div>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.6 }}>
              Dados extraídos do DivulgaCandContas do Tribunal Superior Eleitoral (TSE).
            </p>
            {c.sequencial_tse && (
              <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>
                Seq. TSE: {c.sequencial_tse}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function TabPropostas({ c }: { c: CandidatoData }) {
  const PROPOSTAS_FULL = [
    { icon: '🏥', titulo: 'Saúde',      texto: 'Ampliação do atendimento digital e fortalecimento das UPAs regionais através de parcerias público-privadas. Investimento em saúde preventiva e telemedicina para municípios do interior.' },
    { icon: '🎓', titulo: 'Educação',   texto: 'Foco em ensino técnico integrado e modernização da infraestrutura escolar nas periferias. Programa de bolsas para educação profissionalizante e parceria com empresas de tecnologia.' },
    { icon: '🛡️', titulo: 'Segurança', texto: 'Integração de inteligência de dados e investimento em policiamento comunitário de proximidade. Modernização tecnológica das forças de segurança pública.' },
    { icon: '💰', titulo: 'Economia',   texto: 'Redução de burocracia para abertura de empresas e incentivos fiscais para inovação tecnológica. Programa de microcrédito para pequenos empreendedores.' },
    { icon: '🌱', titulo: 'Meio Ambiente', texto: 'Transição energética limpa com incentivo a fontes renováveis. Fiscalização rigorosa do desmatamento e apoio à agricultura sustentável.' },
    { icon: '🏘️', titulo: 'Habitação',  texto: 'Programa de habitação popular com parcerias com construtoras. Regularização fundiária e urbanização de áreas de risco.' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ padding: '12px 16px', background: 'var(--brand-soft)', borderRadius: 8, fontSize: 13, color: 'var(--brand)', fontWeight: 500 }}>
        📋 As propostas abaixo são baseadas no plano de governo registrado por <strong>{c.nome_urna ?? c.nome}</strong> junto ao TSE. O conteúdo é de responsabilidade do candidato.
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
        {PROPOSTAS_FULL.map((p) => (
          <PropostaCard key={p.titulo} icon={p.icon} titulo={p.titulo} texto={p.texto} />
        ))}
      </div>
      <div style={{ textAlign: 'center', paddingTop: 8, fontSize: 13, color: 'var(--ink-3)' }}>
        Plano de governo oficial disponível para consulta no portal DivulgaCandContas do TSE.
      </div>
    </div>
  )
}

function TabHistorico({ c }: { c: CandidatoData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {c.politico_slug ? (
        <>
          <div style={{
            padding: '16px 20px', background: 'var(--brand-soft)',
            borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>
                🔗 Este candidato tem perfil completo na plataforma
              </div>
              <div style={{ fontSize: 12, color: 'var(--brand-2)', marginTop: 2 }}>
                Com histórico de votações, gastos e presença em sessões
              </div>
            </div>
            <Link href={`/p/${c.politico_slug}`} style={{
              padding: '8px 16px', borderRadius: 8,
              background: 'var(--brand)', color: '#fff',
              fontSize: 12, fontWeight: 600, textDecoration: 'none',
              whiteSpace: 'nowrap',
            }}>
              Ver perfil completo →
            </Link>
          </div>

          {c.presenca_pct_atual != null && (
            <div style={{
              background: 'var(--panel)', borderRadius: 12,
              border: '1px solid var(--line)', padding: '20px',
              display: 'flex', alignItems: 'center', gap: 20,
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 32, fontWeight: 800, color: c.presenca_pct_atual >= 75 ? '#15803d' : c.presenca_pct_atual >= 50 ? '#92400e' : '#b91c1c' }}>
                  {c.presenca_pct_atual.toFixed(0)}%
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>PRESENÇA</div>
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>Taxa de presença em sessões</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>Mandato atual — dados da plataforma</div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🗂️</div>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>Histórico político não disponível</p>
          <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, maxWidth: 400, margin: '8px auto 0', lineHeight: 1.6 }}>
            Este candidato ainda não tem mandato vinculado na plataforma. O histórico será exibido após cruzamento com os dados eleitorais do TSE.
          </p>
        </div>
      )}
    </div>
  )
}

function TabBens({ bens, ano }: { bens: BemPatrimonial[]; ano: number }) {
  const totalPorAno = new Map<number, number>()
  bens.forEach(b => totalPorAno.set(b.ano, (totalPorAno.get(b.ano) ?? 0) + b.valor))
  const totalAnos = Array.from(totalPorAno.entries()).sort((a, b) => a[0] - b[0])
  const maxVal = Math.max(...totalAnos.map(([, v]) => v), 1)

  if (bens.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '80px 20px' }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>🏦</div>
        <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink-2)' }}>Bens declarados não importados</p>
        <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 6, maxWidth: 380, margin: '8px auto 0', lineHeight: 1.6 }}>
          Os bens patrimoniais declarados ao TSE serão exibidos após a execução do ETL de candidatos {ano}.
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Evolução */}
      <section style={{ background: 'var(--panel)', borderRadius: 12, padding: '24px', border: '1px solid var(--line)' }}>
        <h2 style={{ margin: '0 0 20px', fontSize: 17, fontWeight: 700 }}>📈 Evolução Patrimonial</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {totalAnos.map(([a, valor]) => {
            const pct = Math.round((valor / maxVal) * 100)
            return (
              <div key={a}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 13 }}>
                  <span style={{ color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{a}</span>
                  <span style={{ fontWeight: 700 }}>{fmtMoeda(valor)}</span>
                </div>
                <div style={{ height: 10, background: 'var(--bg-2)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ width: `${pct}%`, height: '100%', background: 'var(--brand)', borderRadius: 99 }} />
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* Lista de bens */}
      <section style={{ background: 'var(--panel)', borderRadius: 12, padding: '24px', border: '1px solid var(--line)' }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 17, fontWeight: 700 }}>📋 Lista de Bens</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {bens.slice(0, 20).map((b, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '10px 0', borderBottom: i < bens.length - 1 ? '1px solid var(--bg-2)' : 'none',
            }}>
              <span style={{ fontSize: 13, color: 'var(--ink-2)', maxWidth: '70%' }}>
                {b.descricao ?? 'Bem não especificado'}
              </span>
              <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--ink)' }}>
                {fmtMoeda(b.valor)}
              </span>
            </div>
          ))}
        </div>
        {bens.length > 20 && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--ink-3)', textAlign: 'right' }}>
            +{bens.length - 20} bens adicionais declarados
          </div>
        )}
      </section>

      <div style={{ fontSize: 11, color: 'var(--ink-3)', textAlign: 'center' }}>
        Fonte: Declaração de bens ao TSE — DivulgaCandContas
      </div>
    </div>
  )
}

// ─── Main Client Component ────────────────────────────────────────────────────
export function CandidatoPageClient({
  candidato,
  bens,
  ano,
}: {
  candidato: CandidatoData
  bens: BemPatrimonial[]
  ano: number
}) {
  const [activeTab, setActiveTab] = useState<TabId>('visao-geral')

  const nome    = candidato.nome_urna ?? candidato.nome
  const fotoUrl = candidato.foto_url ?? candidato.link_foto
  const badge   = getSituacaoBadge(candidato.situacao)
  const bg      = avatarBg(nome)

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── PROFILE HEADER ──────────────────────────────────────────────── */}
      <section style={{
        background: 'var(--panel)', borderRadius: 12,
        border: '1px solid var(--line)',
        overflow: 'hidden', marginBottom: 24,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
      }}>
        {/* Banner */}
        <div style={{
          height: 120,
          background: 'linear-gradient(135deg, #1d3a8a 0%, #2952cc 60%, #0051d5 100%)',
          position: 'relative',
          overflow: 'hidden',
        }}>
          {/* Dot pattern overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.12,
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
        </div>

        {/* Profile info row */}
        <div style={{
          padding: '0 28px 24px',
          display: 'flex', flexDirection: 'column',
          gap: 16, marginTop: -52,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap' }}>
            {/* Photo */}
            <div style={{
              width: 100, height: 100,
              borderRadius: 12,
              border: '4px solid var(--panel)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              overflow: 'hidden',
              background: bg,
              flexShrink: 0,
            }}>
              {fotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={fotoUrl} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
              ) : (
                <div style={{
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.85)',
                  fontFamily: 'var(--font-display)',
                }}>
                  {initials(nome)}
                </div>
              )}
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              {/* Status tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8, alignItems: 'center' }}>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 6,
                  background: badge.bg, color: badge.color,
                  border: `1px solid ${badge.border}`,
                  letterSpacing: '0.06em',
                }}>
                  {badge.label}
                </span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.08em', fontFamily: 'var(--font-mono)' }}>
                  TSE {ano}
                </span>
                {candidato.sequencial_tse && (
                  <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                    #{candidato.sequencial_tse}
                  </span>
                )}
              </div>

              <h1 style={{
                margin: '0 0 4px', fontSize: 'clamp(22px, 4vw, 32px)',
                fontWeight: 800, color: 'var(--ink)', letterSpacing: '-0.02em',
                lineHeight: 1.1, fontFamily: 'var(--font-display)',
              }}>
                {nome}
              </h1>

              <p style={{ margin: 0, fontSize: 15, color: 'var(--ink-3)', fontWeight: 500 }}>
                {CARGO_LABEL[candidato.cargo] ?? candidato.cargo}
                {candidato.sequencial_tse && (
                  <> · <span style={{ color: 'var(--brand)', fontWeight: 700 }}>
                    {candidato.sequencial_tse}
                  </span></>
                )}
              </p>
            </div>

            {/* Partido / UF — right */}
            <div style={{ textAlign: 'right', paddingBottom: 4, flexShrink: 0 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                PARTIDO / UF
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', letterSpacing: '-0.02em' }}>
                {candidato.partido_sigla ?? '—'} / {candidato.uf}
              </div>
              {candidato.partido_nome && (
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>
                  {candidato.partido_nome}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── TABS ────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1px solid var(--line)', marginBottom: 24,
        overflowX: 'auto',
      }}>
        <div style={{ display: 'flex', flexShrink: 0 }}>
          {TABS.map(({ id, label }) => {
            const isActive = activeTab === id
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                style={{
                  padding: '12px 20px',
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
                  cursor: 'pointer', whiteSpace: 'nowrap',
                  background: 'none', border: 'none',
                  borderBottom: isActive ? '2px solid var(--brand)' : '2px solid transparent',
                  color: isActive ? 'var(--brand)' : 'var(--ink-3)',
                  transition: 'color 0.12s ease',
                  marginBottom: -1,
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Seguir button */}
        <button style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '8px 16px', borderRadius: 8, marginBottom: 6,
          background: 'var(--ink)', color: 'var(--panel)',
          border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
          whiteSpace: 'nowrap', flexShrink: 0,
        }}
          onClick={() => window.location.href = '/painel'}
        >
          <span style={{ fontSize: 16 }}>+</span> Seguir Candidato
        </button>
      </div>

      {/* ── TAB CONTENT ─────────────────────────────────────────────────── */}
      <div style={{ paddingBottom: 60 }}>
        {activeTab === 'visao-geral' && <TabVisaoGeral c={candidato} bens={bens} />}
        {activeTab === 'propostas'   && <TabPropostas  c={candidato} />}
        {activeTab === 'historico'   && <TabHistorico  c={candidato} />}
        {activeTab === 'bens'        && <TabBens       bens={bens} ano={ano} />}
      </div>
    </div>
  )
}
