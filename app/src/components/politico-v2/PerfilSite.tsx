import Link from 'next/link'
import { GlossaryTooltip } from '@/components/civic'

import { BotaoAcompanhar } from '@/components/politico/BotaoAcompanhar'

// ─── types ─────────────────────────────────────────────────────────────────

export type PerfilSiteData = {
  politico: {
    id: string
    slug: string | null
    nome: string | null
    nome_eleitoral: string | null
    foto_url: string | null
    cargo: string | null
    uf: string | null
    partido_id: string | null
    mandato_inicio: string | null
    mandato_fim: string | null
    presenca_pct_atual: number | null
    gasto_total_ano: number | null
    total_votacoes: number | null
  }
  partido: { sigla: string } | null
  votacoes: {
    id: string
    voto: string | null
    descricao_simples: string | null
    proposicao: string | null
    data: string | null
  }[]
  gastos: {
    valor: number | null
    categoria: string | null
  }[]
  presencaRows: {
    percentual: number | null
    mes: number | null
    ano: number | null
    total_sessoes: number | null
    presencas: number | null
  }[]
  emendas: {
    id: string
    valor: number | null
    valor_pago: number | null
    municipio_destino: string | null
    uf_destino: string | null
    area: string | null
    municipio_nome: string | null
    uf_municipio: string | null
    funcao: string | null
    ano: number | null
    tipo_emenda?: string | null
  }[]
  aba: string
  isSeguindo?: boolean
  followIntent?: boolean
  emendasPixActive?: boolean
  expliqueVotacaoActive?: boolean
}

// ─── helpers ───────────────────────────────────────────────────────────────

const CARGO_LABEL: Record<string, string> = {
  presidente:        'Presidente',
  vice_presidente:   'Vice-Presidente',
  governador:        'Governador',
  senador:           'Senador',
  deputado_federal:  'Dep. Federal',
  deputado_estadual: 'Dep. Estadual',
  prefeito:          'Prefeito',
  vereador:          'Vereador',
}

const CARGO_COLORS: Record<string, { bg: string; fg: string }> = {
  presidente:        { bg: '#dde3f5', fg: '#0f1f4d' },
  governador:        { bg: '#fff0e8', fg: '#7a3000' },
  senador:           { bg: '#e8f5ee', fg: '#085041' },
  deputado_federal:  { bg: '#e8eefb', fg: '#1a2b5e' },
  deputado_estadual: { bg: '#fef9e8', fg: '#7a6000' },
  prefeito:          { bg: '#f0e8ff', fg: '#3c1489' },
  vereador:          { bg: '#fce8f0', fg: '#7a0040' },
}

const SALARIO_MENSAL: Record<string, number> = {
  presidente:        30934,
  senador:           35462,
  governador:        30000,
  deputado_federal:  35462,
  deputado_estadual: 15000,
  prefeito:          10000,
  vereador:           7000,
}

const VOTO_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  Sim:       { label: '✓ SIM',  bg: 'var(--pos-soft)',  color: 'var(--pos)'   },
  Não:       { label: '✗ NÃO',  bg: 'var(--neg-soft)',  color: 'var(--neg)'   },
  Ausente:   { label: '— AUS',  bg: 'var(--bg-2)',      color: 'var(--ink-3)' },
  Abstenção: { label: '~ ABS',  bg: 'var(--warn-soft)', color: 'var(--warn)'  },
}

const TABS = [
  { id: 'votacoes', label: 'Votações' },
  { id: 'gastos',   label: 'Gastos'   },
  { id: 'presenca', label: 'Presença' },
  { id: 'emendas',  label: 'Emendas'  },
]

function fmt(n: number) {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
}

function initials(nome: string) {
  const parts = nome.trim().split(/\s+/)
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase()
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
}

// ─── component ─────────────────────────────────────────────────────────────

export function PerfilSite({ politico, partido, votacoes, gastos, presencaRows, emendas, aba, isSeguindo, followIntent, emendasPixActive, expliqueVotacaoActive }: PerfilSiteData) {
  const nome        = politico.nome_eleitoral ?? politico.nome ?? 'Político'
  const sigla       = partido?.sigla ?? '—'
  const cargoLabel  = CARGO_LABEL[politico.cargo ?? ''] ?? politico.cargo ?? '—'
  const cores       = CARGO_COLORS[politico.cargo ?? ''] ?? { bg: 'var(--bg-2)', fg: 'var(--ink-2)' }
  const uf          = politico.uf ?? '—'
  const slug        = politico.slug ?? politico.id

  const mandatoInicio = politico.mandato_inicio ? new Date(politico.mandato_inicio).getFullYear() : null
  const mandatoFim    = politico.mandato_fim    ? new Date(politico.mandato_fim).getFullYear()    : null
  const mandatoLabel  = mandatoInicio && mandatoFim ? `${mandatoInicio}–${mandatoFim}` : null

  const presencaPct   = politico.presenca_pct_atual ?? null
  const gastoAno      = politico.gasto_total_ano ?? null
  const totalVotacoes = politico.total_votacoes ?? votacoes.length

  const salarioMensal = SALARIO_MENSAL[politico.cargo ?? ''] ?? 35462
  const mesesMandato  = mandatoInicio && mandatoFim ? (mandatoFim - mandatoInicio) * 12 : 48
  const custoTotal    = salarioMensal * mesesMandato + (gastoAno ?? 0) * (mesesMandato / 12)

  // gastos por categoria
  const gastosByCat: Record<string, number> = {}
  for (const g of gastos) {
    const cat = g.categoria ?? 'Outros'
    gastosByCat[cat] = (gastosByCat[cat] ?? 0) + (g.valor ?? 0)
  }
  const gastosOrdenados = Object.entries(gastosByCat).sort(([, a], [, b]) => b - a).slice(0, 8)
  const totalGasto = gastosOrdenados.reduce((s, [, v]) => s + v, 0)

  const presencaMedia = presencaRows.length
    ? presencaRows.reduce((s, r) => s + (r.percentual ?? 0), 0) / presencaRows.length
    : null

  const totalEmendas = emendas.reduce((s, e) => s + (e.valor_pago ?? e.valor ?? 0), 0)
  const emendasPix = emendas.filter(e => e.tipo_emenda === 'pix')
  const totalPix = emendasPix.reduce((s, e) => s + (e.valor_pago ?? e.valor ?? 0), 0)

  const activeTab = TABS.find(t => t.id === aba)?.id ?? 'votacoes'

  const pillStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', height: 26,
    padding: '0 10px', borderRadius: 999, fontSize: 12, fontWeight: 500,
    background: 'rgba(255,255,255,0.15)', color: '#fff',
    border: '1px solid rgba(255,255,255,0.35)',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--brand)', padding: '40px 24px 56px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div className="perfil-hero">
            <div style={{ width: 88, height: 88, borderRadius: '50%', flexShrink: 0, overflow: 'hidden', background: cores.bg }}>
              {politico.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={politico.foto_url} alt={nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: cores.fg, fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>
                  {initials(nome)}
                </div>
              )}
            </div>
            <div className="perfil-identity">
              <h1 style={{ margin: 0, fontSize: 'clamp(26px, 5vw, 42px)', fontWeight: 800, color: '#fff', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
                {nome}
              </h1>
              {politico.nome && politico.nome !== nome && (
                <div style={{ marginTop: 4, fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>{politico.nome}</div>
              )}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {[cargoLabel, sigla, uf, ...(mandatoLabel ? [`Mandato ${mandatoLabel}`] : [])].map((s, i) => (
                  <span key={i} style={pillStyle}>{s}</span>
                ))}
              </div>
            </div>
            <div className="perfil-actions">
              <BotaoAcompanhar
                politicoId={politico.id}
                politicoSlug={slug}
                initialIsSeguindo={isSeguindo}
                followIntent={followIntent}
                variant="hero"
              />
              <button style={{ width: '100%', height: 44, padding: '0 16px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.4)', color: '#fff', fontSize: 13, cursor: 'pointer' }}>
                ↗ Compartilhar
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <div style={{ maxWidth: 1100, margin: '-28px auto 0', padding: '0 24px' }}>
        <div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
          style={{
            background: 'var(--panel)', border: '1.5px solid var(--line)',
            borderRadius: 16, boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          {[
            { label: 'Presença nas votações', value: presencaPct != null ? `${presencaPct.toFixed(0)}%` : '—', color: presencaPct != null ? (presencaPct >= 75 ? 'var(--pos)' : presencaPct >= 50 ? 'var(--warn)' : 'var(--neg)') : 'var(--ink)' },
            { label: 'Gasto da cota / ano',   value: gastoAno != null ? fmt(gastoAno) : '—', color: 'var(--ink)' },
            { label: 'Votações registradas',  value: totalVotacoes ? totalVotacoes.toLocaleString('pt-BR') : '—', color: 'var(--ink)' },
            { label: 'Custo est. do mandato', value: custoTotal > 0 ? fmt(custoTotal) : '—', color: 'var(--ink)' },
          ].map((s, i) => (
            <div key={i} className="kpi-stat-item" style={{ padding: '16px 20px' }}>
              <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)', fontWeight: 500 }}>{s.label}</div>
              <div style={{ marginTop: 6, fontSize: 22, fontWeight: 700, letterSpacing: '-0.02em', color: s.color }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── CUSTO DO MANDATO ── */}
      {custoTotal > 0 && (
        <div style={{ maxWidth: 1100, margin: '20px auto 0', padding: '0 24px' }}>
          <div style={{ background: 'var(--brand-soft)', border: '1px solid rgba(29,58,138,0.2)', borderRadius: 16, padding: '16px 20px' }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
              Este mandato custou aproximadamente {fmt(custoTotal)} aos contribuintes
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 10, fontSize: 12 }}>
              <div>
                <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Salário</div>
                <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--ink-2)' }}>{fmt(salarioMensal)}/mês</div>
              </div>
              {gastoAno != null && (
                <div>
                  <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Cota parlamentar</div>
                  <div style={{ fontWeight: 700, marginTop: 2, color: 'var(--ink-2)' }}>{fmt(gastoAno / 12)}/mês</div>
                </div>
              )}
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: 'var(--brand)' }}>↗ Fonte: Portal da Transparência</div>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ maxWidth: 1100, margin: '24px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', gap: 24, borderBottom: '1.5px solid var(--line-soft)', overflowX: 'auto' }}>
          {TABS.map(t => (
            <Link
              key={t.id}
              href={`/politicos/${slug}?aba=${t.id}`}
              style={{
                padding: '12px 4px',
                borderBottom: activeTab === t.id ? '2px solid var(--brand)' : '2px solid transparent',
                color: activeTab === t.id ? 'var(--brand)' : 'var(--ink-3)',
                fontWeight: activeTab === t.id ? 700 : 400,
                fontSize: 14, textDecoration: 'none', whiteSpace: 'nowrap',
              }}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {/* ── TAB CONTENT ── */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 60px' }}>

        {/* VOTAÇÕES */}
        {activeTab === 'votacoes' && (
          <>
            {votacoes.length === 0 ? <EmptyState msg="Nenhuma votação registrada ainda." /> : (
              <>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>Últimas {votacoes.length} votações</div>
                <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                  {votacoes.map((v) => {
                    const cfg = VOTO_CONFIG[v.voto ?? ''] ?? { label: v.voto ?? '—', bg: 'var(--bg-2)', color: 'var(--ink-3)' }
                    const data = v.data ? new Date(v.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—'
                    return (
                      <div key={v.id} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:py-3 sm:px-4 border-b border-[var(--line-soft)] last:border-b-0 sm:items-center">
                        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto flex-shrink-0">
                          <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{data}</span>
                          <span className="sm:hidden" style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div style={{ flex: 1, fontSize: 13, color: 'var(--ink)', lineHeight: 1.4 }}>
                          <div>{v.proposicao ?? '(sem descrição)'}</div>
                          {expliqueVotacaoActive && v.descricao_simples && (
                            <details style={{ marginTop: 6, cursor: 'pointer' }}>
                              <summary style={{ fontSize: 11, color: 'var(--brand-2)', fontWeight: 600, userSelect: 'none' }}>
                                ✨ Explicar Lei (IA)
                              </summary>
                              <div style={{
                                marginTop: 6, padding: '10px 14px', borderRadius: 8,
                                background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)',
                                color: 'var(--ink-2)', fontSize: 12.5, lineHeight: 1.5,
                              }}>
                                {v.descricao_simples}
                              </div>
                            </details>
                          )}
                        </div>
                        <span className="hidden sm:inline-flex" style={{ display: 'inline-flex', alignItems: 'center', height: 24, padding: '0 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: cfg.bg, color: cfg.color, flexShrink: 0 }}>
                          {cfg.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)' }}>Fonte: Câmara dos Deputados / Senado Federal</div>
              </>
            )}
          </>
        )}

        {/* GASTOS */}
        {activeTab === 'gastos' && (
          <>
            {gastosOrdenados.length === 0 ? <EmptyState msg="Nenhum gasto registrado para este ano." /> : (
              <>
                <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 16 }}>Cota parlamentar (<GlossaryTooltip term="CEAP">CEAP</GlossaryTooltip>) — {new Date().getFullYear()}</div>
                <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                  {gastosOrdenados.map(([cat, valor], i) => {
                    const pct = totalGasto > 0 ? (valor / totalGasto) * 100 : 0
                    return (
                      <div key={cat} style={{ padding: '14px 16px', borderBottom: i < gastosOrdenados.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 13, color: 'var(--ink)', fontWeight: 500 }}>{cat}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmt(valor)}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--brand-2)', borderRadius: 3 }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 12, padding: '12px 16px', background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 700 }}>Total {new Date().getFullYear()}</span>
                  <span style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fmt(totalGasto)}</span>
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)' }}>Fonte: Portal da Transparência</div>
              </>
            )}
          </>
        )}

        {/* PRESENÇA */}
        {activeTab === 'presenca' && (
          <>
            {presencaRows.length === 0 ? <EmptyState msg="Dados de presença não disponíveis ainda." /> : (
              <>
                {presencaMedia != null && (
                  <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--line)', padding: '20px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 20 }}>
                    <div>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Média do período</div>
                      <div style={{ fontSize: 40, fontWeight: 800, letterSpacing: '-0.04em', color: presencaMedia >= 75 ? 'var(--pos)' : presencaMedia >= 50 ? 'var(--warn)' : 'var(--neg)' }}>
                        {presencaMedia.toFixed(0)}%
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 10, background: 'var(--bg-2)', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${presencaMedia}%`, background: presencaMedia >= 75 ? 'var(--pos)' : presencaMedia >= 50 ? 'var(--warn)' : 'var(--neg)', borderRadius: 5 }} />
                      </div>
                    </div>
                  </div>
                )}
                <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                  {presencaRows.map((p, i) => {
                    const pct = p.percentual ?? 0
                    const mesNome = p.mes ? new Date(2020, p.mes - 1).toLocaleString('pt-BR', { month: 'long' }) : '—'
                    return (
                      <div key={i} className="flex flex-col sm:flex-row gap-3 sm:gap-4 p-4 sm:py-2.5 sm:px-4 border-b border-[var(--line-soft)] last:border-b-0 sm:items-center">
                        <div className="flex items-center justify-between sm:w-32 sm:flex-shrink-0">
                          <span style={{ fontSize: 12, color: 'var(--ink-3)', textTransform: 'capitalize' }}>{mesNome} {p.ano}</span>
                          <span className="sm:hidden" style={{ fontSize: 13, fontWeight: 700, color: pct >= 75 ? 'var(--pos)' : pct >= 50 ? 'var(--warn)' : 'var(--neg)', fontFamily: 'var(--font-mono)' }}>
                            {pct.toFixed(0)}%
                          </span>
                        </div>
                        <div className="flex-1 flex items-center gap-3 w-full">
                          <div style={{ flex: 1, height: 6, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${pct}%`, background: pct >= 75 ? 'var(--pos)' : pct >= 50 ? 'var(--warn)' : 'var(--neg)', borderRadius: 3 }} />
                          </div>
                        </div>
                        <div className="hidden sm:block" style={{ fontSize: 13, fontWeight: 700, color: pct >= 75 ? 'var(--pos)' : pct >= 50 ? 'var(--warn)' : 'var(--neg)', width: 40, textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                          {pct.toFixed(0)}%
                        </div>
                        {p.total_sessoes != null && (
                          <div style={{ fontSize: 10, color: 'var(--ink-3)' }} className="sm:w-[70px] text-right flex-shrink-0">
                            <span className="sm:hidden">Sessões: </span>{p.presencas}/{p.total_sessoes}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)' }}>Fonte: Câmara dos Deputados / Senado Federal</div>
              </>
            )}
          </>
        )}

        {/* EMENDAS */}
        {activeTab === 'emendas' && (
          <>
            {emendas.length === 0 ? <EmptyState msg="Nenhuma emenda registrada para este parlamentar." /> : (
              <>
                <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--line)', padding: '14px 20px', flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Total pago</div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, fontFamily: 'var(--font-mono)' }}>{fmt(totalEmendas)}</div>
                  </div>
                  {emendasPixActive && (
                    <div style={{ background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--line)', padding: '14px 20px', flex: 1, minWidth: 160 }}>
                      <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Emendas Pix (Especiais)</div>
                      <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4, color: 'var(--pos)', fontFamily: 'var(--font-mono)' }}>{fmt(totalPix)}</div>
                    </div>
                  )}
                  <div style={{ background: 'var(--panel)', borderRadius: 12, border: '1px solid var(--line)', padding: '14px 20px', flex: 1, minWidth: 160 }}>
                    <div style={{ fontSize: 10.5, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--ink-3)' }}>Municípios beneficiados</div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>{new Set(emendas.map(e => e.municipio_destino ?? e.municipio_nome).filter(Boolean)).size}</div>
                  </div>
                </div>
                <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px solid var(--line)', overflow: 'hidden' }}>
                  {emendas.map((e, i) => (
                    <div key={e.id} className="perfil-emenda-row" style={{ borderBottom: i < emendas.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                          {e.municipio_destino ?? e.municipio_nome ?? '—'}{(e.uf_destino ?? e.uf_municipio) ? ` / ${e.uf_destino ?? e.uf_municipio}` : ''}
                          {emendasPixActive && e.tipo_emenda === 'pix' && (
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 4, background: 'var(--pos-soft)', color: 'var(--pos)' }}>PIX</span>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{e.area ?? e.funcao ?? '—'} · {e.ano}</div>
                      </div>
                      <div className="perfil-emenda-value">{fmt(e.valor_pago ?? e.valor ?? 0)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10, fontSize: 11, color: 'var(--ink-3)' }}>Fonte: Portal da Transparência / Siga Brasil</div>
              </>
            )}
          </>
        )}

      </div>
      <style>{`
        .perfil-hero {
          display: grid;
          grid-template-columns: 88px minmax(0, 1fr);
          gap: 16px;
          align-items: start;
        }
        .perfil-identity {
          min-width: 0;
        }
        .perfil-actions {
          display: grid;
          grid-column: 1 / -1;
          gap: 8px;
          width: 100%;
        }
        .perfil-emenda-row {
          display: flex;
          flex-direction: column;
          gap: 8px;
          padding: 14px 16px;
        }
        .perfil-emenda-value {
          color: var(--ink);
          font-family: var(--font-mono);
          font-size: 13px;
          font-weight: 700;
        }
        .kpi-stat-item {
          border-top: 1px solid var(--line-soft);
        }
        .kpi-stat-item:first-child {
          border-top: none;
        }
        @media (min-width: 640px) {
          .perfil-hero {
            grid-template-columns: 88px minmax(0, 1fr) auto;
            gap: 24px;
          }
          .perfil-actions {
            display: flex;
            flex-direction: column;
            grid-column: auto;
            min-width: 150px;
          }
          .perfil-emenda-row {
            align-items: center;
            flex-direction: row;
            gap: 16px;
            padding: 12px 16px;
          }
          .perfil-emenda-value {
            flex-shrink: 0;
            text-align: right;
          }
          .kpi-stat-item {
            border-top: none;
          }
          .kpi-stat-item:nth-child(even) {
            border-left: 1px solid var(--line-soft);
          }
          .kpi-stat-item:nth-child(n+3) {
            border-top: 1px solid var(--line-soft);
          }
        }
        @media (min-width: 1024px) {
          .kpi-stat-item {
            border-top: none !important;
            border-left: 1px solid var(--line-soft) !important;
          }
          .kpi-stat-item:first-child {
            border-left: none !important;
          }
        }
      `}</style>
    </div>
  )
}

function EmptyState({ msg }: { msg: string }) {
  return (
    <div style={{ background: 'var(--panel)', borderRadius: 16, border: '1px dashed var(--line-strong)', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ fontSize: 36, marginBottom: 12 }}>📭</div>
      <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-3)' }}>{msg}</p>
      <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--mute)' }}>Os dados são coletados de fontes oficiais e podem demorar alguns dias para aparecer.</p>
    </div>
  )
}
