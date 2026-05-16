'use client'

import Image from 'next/image'
import { useState } from 'react'

import { Panel, PanelHeader, Sparkline, StatusDot, VoteChip } from '@/components/civic'
import { ResumoInterpretativoCard } from '@/components/politico-v2/ResumoInterpretativoCard'
import { ModoCidadao } from '@/components/politico-v2/ModoCidadao'
import {
  CARGO_LABEL,
  CEAP_TETO_UF,
  NA,
  formatCurrency,
  formatDate,
  formatGabinetePhone,
  formatOptionalNumber,
  initials,
  normalizePlatform,
  yearsInOffice,
} from '@/components/politico-v2/shared'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'

// ── types ────────────────────────────────────────────────────────────────────

type GastoItem = {
  valor: number
  categoria: string | null
  mes: number
  ano: number
}

type PresencaItem = {
  percentual: number
  mes: number | null
  ano: number
  total_sessoes: number
  presencas: number
}

type VotacaoItem = {
  id: string
  voto: string
  descricao_simples: string | null
  data: string
  proposicao: string | null
}

type Politico = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  uf_nascimento?: string | null
  sexo?: string | null
  foto_url: string | null
  email: string | null
  gabinete_nome: string | null
  gabinete_telefone: string | null
  gabinete_email: string | null
  data_nascimento: string | null
  naturalidade: string | null
  escolaridade: string | null
  ocupacao: string | null
  mandato_inicio: string | null
  mandato_fim: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  dado_estado: string | null
  collected_at: string | null
  cpf?: string | null
  partidos: { sigla: string | null; nome: string | null; numero: number | null } | null
  redes_sociais: Array<{ plataforma: string | null; url: string | null }> | null
}

type Props = {
  politico: Politico
  votacoes: VotacaoItem[]
  gastos: GastoItem[]
  presenca: PresencaItem[]
}

// ── constants ─────────────────────────────────────────────────────────────────

const TABS = ['Visão geral', 'Votações', 'Gastos', 'Presença', 'Histórico', 'Fontes'] as const
type Tab = typeof TABS[number]

// ── helpers ───────────────────────────────────────────────────────────────────

function maskCpf(cpf: string | null | undefined) {
  if (!cpf) return NA
  const d = cpf.replace(/\D/g, '')
  if (d.length !== 11) return NA
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.***-**`
}

function calcAge(dataNasc: string | null) {
  if (!dataNasc) return null
  const d = new Date(dataNasc)
  if (isNaN(d.getTime())) return null
  const diff = Date.now() - d.getTime()
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))
}

function socialVisual(platform: string) {
  if (platform.includes('twitter') || platform === 'x') return { icon: '𝕏', label: 'Twitter/X', bg: '#111827', color: '#ffffff' }
  if (platform.includes('instagram')) return { icon: '◉', label: 'Instagram', bg: '#7c3aed', color: '#ffffff' }
  if (platform.includes('youtube')) return { icon: '▶', label: 'YouTube', bg: '#dc2626', color: '#ffffff' }
  if (platform.includes('facebook')) return { icon: 'f', label: 'Facebook', bg: '#2563eb', color: '#ffffff' }
  if (platform.includes('linkedin')) return { icon: 'in', label: 'LinkedIn', bg: '#0077b5', color: '#ffffff' }
  return { icon: '◎', label: 'Site oficial', bg: '#475569', color: '#ffffff' }
}

function votoToChip(voto: string): string {
  const map: Record<string, string> = {
    sim: 'SIM',
    nao: 'NÃO',
    abstencao: 'ABS',
    ausente: 'AUS',
    obstrucao: 'OBS',
    artigo_17: 'OBS',
  }
  return map[voto] ?? 'AUS'
}

// ── sub-components ────────────────────────────────────────────────────────────

function PlaceholderPanel({ title, badge, message }: { title: string; badge: string; message: string }) {
  return (
    <Panel>
      <PanelHeader title={title} action={
        <span style={{ fontSize: 10, color: 'var(--mute)', background: 'var(--bg-2)', padding: '2px 8px', border: '1px solid var(--line)' }}>
          {badge}
        </span>
      } />
      <div style={{ padding: '24px 20px', textAlign: 'center' }}>
        <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>{message}</p>
      </div>
    </Panel>
  )
}

function KpiCard({
  label,
  value,
  sub,
  sparkData,
  muted,
}: {
  label: string
  value: string
  sub?: string
  sparkData?: number[]
  muted?: boolean
}) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color: muted ? 'var(--mute)' : 'var(--ink)', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--mute)' }}>{sub}</div>}
      {sparkData && sparkData.length > 1 && (
        <div style={{ marginTop: 6 }}>
          <Sparkline data={sparkData} w={80} h={20} />
        </div>
      )}
    </div>
  )
}

function RadarCard({
  label,
  value,
  valueLabel,
  bar,
  median,
  medianLabel,
  badge,
}: {
  label: string
  value: string
  valueLabel?: string
  bar?: number | null
  median?: number
  medianLabel?: string
  badge?: string
}) {
  return (
    <Panel>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)' }}>{label}</div>
          {badge && (
            <span className="mono" style={{ fontSize: 9, color: 'var(--mute)', background: 'var(--bg-2)', padding: '2px 6px', border: '1px solid var(--line)', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: 'var(--ink)', lineHeight: 1 }}>{value}</div>
        {valueLabel && <div style={{ marginTop: 2, fontSize: 12, color: 'var(--ink-3)' }}>{valueLabel}</div>}
        {bar != null && (
          <div style={{ marginTop: 10 }}>
            <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 0, overflow: 'hidden' }}>
              <div style={{ width: `${Math.min(100, Math.max(0, bar))}%`, height: '100%', background: bar >= 80 ? 'var(--pos)' : bar >= 60 ? 'var(--warn)' : 'var(--neg)' }} />
            </div>
            {median != null && (
              <div style={{ marginTop: 6, fontSize: 11, color: 'var(--mute)' }}>
                Mediana câmara: {medianLabel ?? `${median}%`}
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  )
}

// ── main component ─────────────────────────────────────────────────────────────

export function PerfilApp({ politico, votacoes, gastos, presenca }: Props) {
  const [tab, setTab] = useState<Tab>('Visão geral')
  const [mode, setMode] = useState<'analista' | 'cidadao'>('analista')

  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const partidoSigla = politico.partidos?.sigla?.toUpperCase() ?? '–'
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replaceAll('_', ' ')
  const mandatoInfo = yearsInOffice(politico.mandato_inicio)
  const classeFoto = classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })

  const tetoUf = CEAP_TETO_UF[politico.uf ?? ''] ?? null
  const gastoPctTeto =
    politico.gasto_total_ano != null && tetoUf != null && tetoUf > 0
      ? Math.max(0, Math.min(100, Math.round((politico.gasto_total_ano / tetoUf) * 100)))
      : null

  const presencaRows = presenca

  // Gastos mensais para sparkline e mini bars
  const gastosPorMes = gastos.reduce<Record<string, number>>((acc, g) => {
    const key = `${g.ano}-${String(g.mes).padStart(2, '0')}`
    acc[key] = (acc[key] ?? 0) + g.valor
    return acc
  }, {})
  const gastosMesesOrdenados = Object.entries(gastosPorMes).sort((a, b) => a[0].localeCompare(b[0])).slice(-12)
  const gastosSparkData = gastosMesesOrdenados.map(([, v]) => v)

  // Gastos por categoria
  const gastosPorCategoria = gastos.reduce<Record<string, number>>((acc, g) => {
    const cat = g.categoria ?? 'Outros'
    acc[cat] = (acc[cat] ?? 0) + g.valor
    return acc
  }, {})
  const gastosCategoriasOrdenadas = Object.entries(gastosPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
  const maxCategoria = gastosCategoriasOrdenadas[0]?.[1] ?? 1

  // Presença sparkline
  const presencaOrdenada = [...presencaRows]
    .filter((p) => p.mes != null)
    .sort((a, b) => a.ano !== b.ano ? a.ano - b.ano : (a.mes ?? 0) - (b.mes ?? 0))
  const presencaSparkData = presencaOrdenada.map((p) => p.percentual)

  // Gasto 30d (último mês disponível)
  const gastoUltimoMes = gastosMesesOrdenados.at(-1)?.[1] ?? null

  const contatoEmail = politico.gabinete_email ?? politico.email
  const telefoneGabinete = formatGabinetePhone(politico.gabinete_telefone)
  const gabineteNome = politico.gabinete_nome ? `Gab. ${politico.gabinete_nome}` : null
  const redesComUrl = (politico.redes_sociais ?? []).filter((item) => item.url)
  const idade = calcAge(politico.data_nascimento)

  const metricasIA = {
    cargo: politico.cargo,
    uf: politico.uf,
    partido: partidoSigla === '–' ? null : partidoSigla,
    em_exercicio_anos: mandatoInfo.label === NA ? null : mandatoInfo.label,
    presenca_pct_atual: politico.presenca_pct_atual,
    gasto_total_ano: politico.gasto_total_ano,
    total_votacoes: politico.total_votacoes,
    dado_estado: politico.dado_estado,
    atualizado_em: politico.collected_at,
  }

  const atualizadoEm = politico.collected_at
    ? new Date(politico.collected_at).toLocaleDateString('pt-BR')
    : '–'

  // ── render ─────────────────────────────────────────────────────────────────

  if (mode === 'cidadao') {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
        <ModeBar mode={mode} setMode={setMode} atualizadoEm={atualizadoEm} />
        <ModoCidadao politico={{
          ...politico,
          uf_nascimento: politico.uf_nascimento ?? null,
          sexo: politico.sexo ?? null,
          redes_sociais: politico.redes_sociais ?? [],
        }} />
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── HERO ── */}
      <section style={{ background: 'var(--panel)', borderBottom: '1px solid var(--line)' }}>
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '28px 24px 24px' }}>
          <div style={{ display: 'flex', gap: 28, alignItems: 'flex-start', flexWrap: 'wrap' }}>

            {/* Foto */}
            <div
              style={{
                width: 120,
                height: 150,
                flexShrink: 0,
                background: 'var(--brand-soft)',
                border: '1px solid var(--line)',
                overflow: 'hidden',
                position: 'relative',
              }}
            >
              {politico.foto_url ? (
                <Image
                  src={politico.foto_url}
                  alt={`Foto de ${nomeExibicao}`}
                  fill
                  className={`object-cover ${classeFoto}`}
                  unoptimized
                />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 36,
                    fontWeight: 700,
                    color: 'var(--brand)',
                  }}
                >
                  {initials(nomeExibicao)}
                </div>
              )}
            </div>

            {/* Info principal */}
            <div style={{ flex: 1, minWidth: 260 }}>
              {/* Badges topo */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                <span className="mono" style={{ fontSize: 10.5, padding: '3px 8px', background: 'var(--brand)', color: '#fff', letterSpacing: '0.06em' }}>
                  {cargoNome.toUpperCase()}
                </span>
                <span className="mono" style={{ fontSize: 10.5, padding: '3px 8px', background: 'var(--panel-2)', border: '1px solid var(--line)', color: 'var(--ink-2)', letterSpacing: '0.06em' }}>
                  {partidoSigla} · {politico.uf ?? '–'}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, padding: '3px 8px', border: '1px solid var(--pos)', color: 'var(--pos)', background: 'var(--pos-soft)' }}>
                  <StatusDot tone="live" /> EM MANDATO
                </span>
              </div>

              {/* Nome */}
              <h1 style={{ margin: 0, fontSize: 'clamp(28px, 4vw, 46px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1, color: 'var(--ink)' }}>
                {nomeExibicao}
              </h1>
              <div className="mono" style={{ marginTop: 6, fontSize: 12, color: 'var(--mute)', letterSpacing: '0.04em' }}>
                /{politico.slug}
              </div>

              {/* Sub-info */}
              <div style={{ marginTop: 10, fontSize: 13, color: 'var(--ink-3)', display: 'flex', flexWrap: 'wrap', gap: '4px 16px' }}>
                <span>Mandato desde {mandatoInfo.year !== NA ? mandatoInfo.year : '–'}</span>
                <span>·</span>
                <span>Comissões — em breve</span>
              </div>

              {/* Grid 5 colunas */}
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 8, maxWidth: 680 }}>
                {[
                  { label: 'MANDATO', value: mandatoInfo.label !== NA ? mandatoInfo.label : '–' },
                  { label: 'ELEITO COM', value: politico.partidos?.numero != null ? String(politico.partidos.numero) : '–' },
                  { label: idade != null ? `${idade} ANOS` : 'IDADE', value: cargoNome },
                  { label: 'ESCOLARIDADE', value: politico.escolaridade ?? '–' },
                  { label: 'CPF', value: maskCpf(politico.cpf) },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '8px 10px' }}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--mute)' }}>{label}</div>
                    <div style={{ marginTop: 3, fontSize: 12, fontWeight: 600, color: 'var(--ink)', lineHeight: 1.3, wordBreak: 'break-word' }}>{value}</div>
                  </div>
                ))}
              </div>

              {/* Botões de ação */}
              <div style={{ marginTop: 16, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <button style={{ padding: '8px 18px', background: 'var(--brand)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  + Acompanhar
                </button>
                <button style={{ padding: '8px 14px', background: 'var(--panel)', color: 'var(--ink-2)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  Compartilhar
                </button>
                <a
                  href={`/api/politico/${politico.id}/export.json`}
                  style={{ padding: '8px 14px', background: 'var(--panel)', color: 'var(--ink-2)', border: '1px solid var(--line)', fontSize: 13, fontWeight: 600, cursor: 'pointer', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}
                >
                  EXPORTAR JSON ↓
                </a>
                <span style={{ fontSize: 11, color: 'var(--pos)', display: 'inline-flex', alignItems: 'center', gap: 5, background: 'var(--pos-soft)', padding: '4px 10px', border: '1px solid var(--pos)' }}>
                  ✓ Oficial · completo
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── TABS ── */}
        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', display: 'flex', gap: 0, overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: '12px 18px',
                background: 'transparent',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--brand)' : '2px solid transparent',
                color: tab === t ? 'var(--ink)' : 'var(--mute)',
                fontSize: 13,
                fontWeight: tab === t ? 600 : 400,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </section>

      {/* ── MODE BAR ── */}
      <ModeBar mode={mode} setMode={setMode} atualizadoEm={atualizadoEm} />

      {/* ── BODY ── */}
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '24px 24px 48px' }}>

        {/* ── KPI STRIP ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 1, marginBottom: 24, border: '1px solid var(--line)' }}>
          <KpiCard
            label="PRESENÇA"
            value={politico.presenca_pct_atual != null ? `${Math.round(politico.presenca_pct_atual)}%` : '–'}
            sub="sessões plenárias"
            sparkData={presencaSparkData.length > 1 ? presencaSparkData : undefined}
          />
          <KpiCard
            label="VOTAÇÕES"
            value={formatOptionalNumber(politico.total_votacoes)}
            sub="nominais registradas"
          />
          <KpiCard
            label="GASTOS · ÚLT. MÊS"
            value={gastoUltimoMes != null ? formatCurrency(gastoUltimoMes) : '–'}
            sub={politico.gasto_total_ano != null ? `${formatCurrency(politico.gasto_total_ano)} / ano` : undefined}
            sparkData={gastosSparkData.length > 1 ? gastosSparkData : undefined}
          />
          <KpiCard
            label="DISCURSOS"
            value="–"
            sub="em breve"
            muted
          />
          <KpiCard
            label="PROPOSIÇÕES"
            value="–"
            sub="em breve"
            muted
          />
        </div>

        {/* ── RADAR DE DESEMPENHO ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 1, marginBottom: 24, border: '1px solid var(--line)' }}>
          <RadarCard
            label="PRESENÇA"
            value={politico.presenca_pct_atual != null ? `${Math.round(politico.presenca_pct_atual)}%` : '–'}
            valueLabel="das sessões"
            bar={politico.presenca_pct_atual}
            median={63.2}
            medianLabel="63,2% câmara"
          />
          <RadarCard
            label="ATIVIDADE LES"
            value="–"
            valueLabel="em cálculo"
            badge="CAMBRIDGE 2014"
          />
          <RadarCard
            label="COERÊNCIA AI"
            value="–"
            valueLabel="em cálculo"
            badge="IA BETA"
          />
          <RadarCard
            label="EFICIÊNCIA GASTOS"
            value={gastoPctTeto != null ? `${gastoPctTeto}%` : '–'}
            valueLabel={gastoPctTeto != null ? `do teto ${politico.uf ?? ''}` : 'sem dados'}
            bar={gastoPctTeto}
          />
        </div>

        {/* ── GRID PRINCIPAL ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16, alignItems: 'start' }}>

          {/* ── COLUNA ESQUERDA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* VOTAÇÕES RECENTES */}
            <Panel>
              <PanelHeader
                title="VOTAÇÕES RECENTES"
                sub={politico.total_votacoes != null ? `${politico.total_votacoes} registradas` : undefined}
                source="Câmara"
              />
              <div style={{ padding: '0 0 4px' }}>
                {votacoes.length === 0 ? (
                  <div style={{ padding: '24px 20px', textAlign: 'center' }}>
                    <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em' }}>VOTAÇÕES SENDO COLETADAS</p>
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-2)' }}>
                        {['DATA', 'MATÉRIA', 'VOTO', 'RESULTADO'].map((h) => (
                          <th key={h} className="mono" style={{ padding: '8px 12px', textAlign: 'left', fontSize: 9.5, letterSpacing: '0.08em', color: 'var(--ink-3)', fontWeight: 600, borderBottom: '1px solid var(--line)' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {votacoes.map((v, i) => (
                        <tr key={v.id} style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? 'var(--panel)' : 'var(--bg)' }}>
                          <td className="mono" style={{ padding: '9px 12px', color: 'var(--mute)', fontSize: 11, whiteSpace: 'nowrap' }}>
                            {v.data ? new Date(v.data).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '–'}
                          </td>
                          <td style={{ padding: '9px 12px', color: 'var(--ink-2)', lineHeight: 1.4, maxWidth: 280 }}>
                            <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {v.descricao_simples ?? v.proposicao ?? '–'}
                            </span>
                          </td>
                          <td style={{ padding: '9px 12px' }}>
                            <VoteChip vote={votoToChip(v.voto)} />
                          </td>
                          <td style={{ padding: '9px 12px', color: 'var(--mute)', fontSize: 11 }}>–</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Panel>

            {/* GASTOS · COTA PARLAMENTAR */}
            <Panel>
              <PanelHeader title="GASTOS · COTA PARLAMENTAR" source="Portal Transparência" />
              <div style={{ padding: '16px 20px' }}>
                {/* Barra de teto UF */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12, color: 'var(--ink-3)' }}>
                    <span>Usado: <strong style={{ color: 'var(--ink)' }}>{politico.gasto_total_ano != null ? formatCurrency(politico.gasto_total_ano) : '–'}</strong></span>
                    <span>Teto {politico.uf ?? '–'}: {tetoUf != null ? formatCurrency(tetoUf) : '–'}</span>
                  </div>
                  <div style={{ height: 8, background: 'var(--bg-2)', overflow: 'hidden' }}>
                    <div style={{ width: `${gastoPctTeto ?? 0}%`, height: '100%', background: 'var(--brand-2)' }} />
                  </div>
                  {gastoPctTeto != null && (
                    <div className="mono" style={{ marginTop: 4, fontSize: 10, color: 'var(--mute)' }}>{gastoPctTeto}% do teto anual</div>
                  )}
                </div>

                {/* Mini barras mensais */}
                {gastosMesesOrdenados.length > 0 && (
                  <div style={{ marginBottom: 16 }}>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 8 }}>GASTOS MENSAIS</div>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 48 }}>
                      {gastosMesesOrdenados.map(([mes, val]) => {
                        const maxVal = Math.max(...gastosMesesOrdenados.map(([, v]) => v))
                        const pct = maxVal > 0 ? (val / maxVal) * 100 : 0
                        const [, m] = mes.split('-')
                        const mLabel = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'][parseInt(m, 10) - 1] ?? m
                        return (
                          <div key={mes} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                            <div style={{ width: '100%', height: `${Math.max(4, pct * 0.4)}px`, background: 'var(--brand-2)', minHeight: 4 }} />
                            <span className="mono" style={{ fontSize: 8, color: 'var(--mute)' }}>{mLabel}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* BarList por categoria */}
                {gastosCategoriasOrdenadas.length > 0 && (
                  <div>
                    <div className="mono" style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', marginBottom: 8 }}>POR CATEGORIA</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {gastosCategoriasOrdenadas.map(([cat, val]) => (
                        <div key={cat} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 11, color: 'var(--ink-2)', marginBottom: 3, lineHeight: 1.2 }}>{cat}</div>
                            <div style={{ height: 4, background: 'var(--bg-2)', overflow: 'hidden' }}>
                              <div style={{ width: `${(val / maxCategoria) * 100}%`, height: '100%', background: 'var(--brand-soft)' }} />
                            </div>
                          </div>
                          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', whiteSpace: 'nowrap' }}>{formatCurrency(val)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {gastos.length === 0 && (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em', textAlign: 'center', padding: '8px 0' }}>GASTOS SENDO COLETADOS</p>
                )}
              </div>
            </Panel>

            {/* PRESENÇA */}
            <Panel>
              <PanelHeader title="PRESENÇA NAS SESSÕES" source="Câmara" />
              <div style={{ padding: '16px 20px' }}>
                {presencaRows.length === 0 ? (
                  <p className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.06em', textAlign: 'center', padding: '8px 0' }}>DADOS SENDO COLETADOS</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {presencaOrdenada.map((p) => {
                      const mesNome = p.mes != null
                        ? new Date(p.ano, p.mes - 1).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
                        : String(p.ano)
                      const pct = Math.max(0, Math.min(100, Math.round(p.percentual)))
                      return (
                        <div key={`${p.ano}-${p.mes}`} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 40px', gap: 8, alignItems: 'center' }}>
                          <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>{mesNome}</span>
                          <div style={{ height: 6, background: 'var(--bg-2)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: pct >= 80 ? 'var(--pos)' : pct >= 60 ? 'var(--warn)' : 'var(--neg)' }} />
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--ink)', textAlign: 'right' }}>{pct}%</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Panel>

          </div>

          {/* ── COLUNA DIREITA ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* CONTATO DO GABINETE */}
            <Panel>
              <PanelHeader title="CONTATO DO GABINETE" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { icon: '✉', label: 'Email', value: contatoEmail, href: contatoEmail && contatoEmail !== NA ? `mailto:${contatoEmail}` : null },
                  { icon: '☎', label: 'Telefone', value: telefoneGabinete, href: null },
                  { icon: '⌂', label: 'Gabinete', value: gabineteNome ? `${gabineteNome} — Câmara dos Dep., Brasília/DF` : NA, href: null },
                ].map(({ icon, label, value, href }) => (
                  <div key={label}>
                    <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--mute)', marginBottom: 2 }}>{icon} {label.toUpperCase()}</div>
                    {href ? (
                      <a href={href} style={{ fontSize: 12, color: 'var(--brand-2)', textDecoration: 'none', wordBreak: 'break-word' }}>{value}</a>
                    ) : (
                      <div style={{ fontSize: 12, color: 'var(--ink-2)', wordBreak: 'break-word' }}>{value ?? NA}</div>
                    )}
                  </div>
                ))}
              </div>
            </Panel>

            {/* REDES SOCIAIS */}
            <Panel>
              <PanelHeader title="REDES SOCIAIS" />
              <div style={{ padding: '14px 16px' }}>
                {redesComUrl.length === 0 ? (
                  <p style={{ fontSize: 12, color: 'var(--mute)' }}>Sem redes cadastradas</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {redesComUrl.map((rede) => {
                      const platform = normalizePlatform(rede.plataforma)
                      const visual = socialVisual(platform)
                      return (
                        <a
                          key={`${rede.plataforma}-${rede.url}`}
                          href={rede.url ?? '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            padding: '7px 12px',
                            background: visual.bg,
                            color: visual.color,
                            textDecoration: 'none',
                            fontSize: 12,
                            fontWeight: 600,
                          }}
                        >
                          <span>{visual.icon}</span>
                          <span>{visual.label}</span>
                        </a>
                      )
                    })}
                  </div>
                )}
              </div>
            </Panel>

            {/* RESUMO IA */}
            <ResumoInterpretativoCard politicoId={politico.id} metricas={metricasIA} />

            {/* HISTÓRICO PARTIDÁRIO */}
            <PlaceholderPanel title="HISTÓRICO PARTIDÁRIO" badge="TSE" message="DADOS TSE EM BREVE" />

            {/* MAIORES DOADORES */}
            <PlaceholderPanel title="MAIORES DOADORES · 2022" badge="TSE" message="DADOS TSE EM BREVE" />

            {/* AGENDA */}
            <PlaceholderPanel title="AGENDA · PRÓX. SESSÕES" badge="CÂMARA" message="DADOS CÂMARA EM BREVE" />

            {/* FONTES */}
            <Panel>
              <PanelHeader title="FONTES UTILIZADAS" />
              <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Câmara dos Deputados', ok: true },
                  { name: 'TSE', ok: true },
                  { name: 'Portal Transparência', ok: true },
                  { name: 'IBGE', ok: true },
                ].map(({ name, ok }) => (
                  <div key={name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12 }}>
                    <span style={{ color: 'var(--ink-2)' }}>{name}</span>
                    <span style={{ color: ok ? 'var(--pos)' : 'var(--mute)', fontWeight: 600 }}>{ok ? '✓' : '–'}</span>
                  </div>
                ))}
                <div className="mono" style={{ marginTop: 4, fontSize: 10, color: 'var(--mute)', letterSpacing: '0.04em' }}>
                  ATUALIZADO {atualizadoEm}
                </div>
              </div>
            </Panel>

          </div>
        </div>
      </div>
    </div>
  )
}

// ── ModeBar ───────────────────────────────────────────────────────────────────

function ModeBar({
  mode,
  setMode,
  atualizadoEm,
}: {
  mode: 'analista' | 'cidadao'
  setMode: (m: 'analista' | 'cidadao') => void
  atualizadoEm: string
}) {
  return (
    <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)' }}>
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '10px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>VISUALIZAR COMO</span>
          <div style={{ display: 'inline-flex', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 999, padding: 3 }}>
            {([
              ['analista', '⚙ Analista', 'dados completos'],
              ['cidadao', '🙂 Cidadão', 'linguagem direta'],
            ] as const).map(([id, label, sub]) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                style={{
                  padding: '6px 14px',
                  borderRadius: 999,
                  border: 'none',
                  background: mode === id ? 'var(--ink)' : 'transparent',
                  color: mode === id ? 'var(--bg)' : 'var(--ink-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {label}
                <span className="mono" style={{ fontSize: 10, opacity: 0.6, letterSpacing: '0.04em', fontWeight: 500 }}>
                  · {sub}
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
          DADOS · ATUALIZADO {atualizadoEm} ·{' '}
          <a href="/metodologia" style={{ color: 'var(--brand-2)' }}>METODOLOGIA ↗</a>
        </div>
      </div>
    </div>
  )
}
