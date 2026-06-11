'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { BrazilDots, Panel, PanelHeader, Sparkline, StatusDot, VoteChip } from '@/components/civic'

// ─── tipos ───────────────────────────────────────────────────────────────────

type SearchTab = 'nome' | 'cep' | 'partido' | 'estado'

type VotacaoRow = {
  id: string
  materia: string
  casa: string
  sim: number
  nao: number
  abs: number
  resultado: string
}

// ─── dados mock ──────────────────────────────────────────────────────────────

const TABS: { id: SearchTab; label: string }[] = [
  { id: 'nome', label: 'Nome' },
  { id: 'cep', label: 'CEP' },
  { id: 'partido', label: 'Partido' },
  { id: 'estado', label: 'Estado' },
]

const VOTACOES: VotacaoRow[] = [
  { id: '2025-PL-1087', materia: 'PL 1087/2025 — Regulamentação IA em serviços públicos', casa: 'CAM', sim: 421, nao: 78, abs: 14, resultado: 'APROV' },
  { id: '2025-PLP-068', materia: 'PLP 68/2024 — Reforma tributária regulamentação', casa: 'SEN', sim: 58, nao: 19, abs: 4, resultado: 'APROV' },
  { id: '2025-PEC-015', materia: 'PEC 15/2025 — Emenda constitucional segurança pública', casa: 'CAM', sim: 289, nao: 201, abs: 23, resultado: 'REJ' },
  { id: '2025-MPV-012', materia: 'MPV 1227/2024 — Compensação fiscal setorial', casa: 'CAM', sim: 312, nao: 167, abs: 34, resultado: 'APROV' },
  { id: '2025-PL-0891', materia: 'PL 891/2025 — Marco regulatório transporte aéreo', casa: 'SEN', sim: 49, nao: 27, abs: 5, resultado: 'APROV' },
  { id: '2025-PDL-044', materia: 'PDL 44/2025 — Decreto legislativo acordos internacionais', casa: 'CAM', sim: 198, nao: 288, abs: 27, resultado: 'REJ' },
  { id: '2025-PL-0744', materia: 'PL 744/2025 — Fundo nacional habitação popular', casa: 'CAM', sim: 401, nao: 89, abs: 23, resultado: 'APROV' },
]

const UF_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia',
  CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás',
  MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais',
  PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí',
  RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul',
  RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo',
  SE: 'Sergipe', TO: 'Tocantins',
}

const DEP_POR_UF: Record<string, number> = {
  SP: 70, MG: 53, RJ: 46, BA: 39, RS: 31, PR: 30, PE: 25, CE: 22, PA: 17,
  GO: 17, MA: 18, SC: 16, PB: 12, PI: 10, ES: 10, RN: 8, MT: 8, AL: 9,
  MS: 8, TO: 8, AM: 8, DF: 8, SE: 8, RR: 8, AP: 8, AC: 8, RO: 8,
}

// ─── sub-componentes inline ───────────────────────────────────────────────────

function GridBackdrop() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.3 }}
    >
      <defs>
        <pattern id="grid-home" width="6" height="6" patternUnits="userSpaceOnUse">
          <path d="M 6 0 L 0 0 0 6" fill="none" stroke="var(--line-strong)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100" height="100" fill="url(#grid-home)" />
    </svg>
  )
}

function ActivityTicker() {
  const items = [
    '● CÂMARA · Votação nominal PL 1087/2025 — 421 Sim · 78 Não',
    '● SENADO · Aprovado PLP 68/2024 — Reforma tributária regulamentação',
    '● CÂMARA · Presença registrada — 487/513 deputados',
    '● PORTAL · Emenda parlamentar publicada — R$ 2.4M · AP',
    '● API · Dados atualizados há 4 minutos',
  ]
  return (
    <div style={{ background: 'var(--ink)', borderBottom: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden', height: 36 }}>
      <style>{`@keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-50%) } }`}</style>
      <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
        <div
          className="mono"
          style={{
            padding: '0 16px',
            fontSize: 10.5,
            color: 'var(--accent)',
            letterSpacing: '0.12em',
            fontWeight: 600,
            whiteSpace: 'nowrap',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            flexShrink: 0,
          }}
        >
          AO VIVO
        </div>
        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div
            className="mono"
            style={{
              display: 'inline-flex',
              gap: 48,
              animation: 'marquee 32s linear infinite',
              fontSize: 11,
              color: 'rgba(255,255,255,0.65)',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
              padding: '0 32px',
            }}
          >
            {[...items, ...items].map((item, i) => <span key={i}>{item}</span>)}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── componente principal ─────────────────────────────────────────────────────

export function HomeApp() {
  const router = useRouter()
  const [tab, setTab] = useState<SearchTab>('nome')
  const [query, setQuery] = useState('')
  const [activeUf, setActiveUf] = useState('SP')

  const placeholder = useMemo(() => {
    if (tab === 'cep') return 'Digite o CEP (ex: 13010001)'
    if (tab === 'partido') return 'Digite sigla do partido (ex: PL)'
    if (tab === 'estado') return 'Digite a UF (ex: SP)'
    return '$ buscar --politico '
  }, [tab])

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const value = query.trim()
    if (!value) return
    if (tab === 'cep') { router.push(`/meu-estado?cep=${encodeURIComponent(value)}`); return }
    if (tab === 'estado') { router.push(`/busca?uf=${encodeURIComponent(value.toUpperCase())}`); return }
    if (tab === 'partido') { router.push(`/busca?partido=${encodeURIComponent(value.toUpperCase())}`); return }
    router.push(`/busca?q=${encodeURIComponent(value)}`)
  }

  const ufName = UF_NAMES[activeUf] ?? activeUf
  const ufDep = DEP_POR_UF[activeUf] ?? 8

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── SEÇÃO 1: Hero ──────────────────────────────────────────────────── */}
      <section
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderBottom: '1px solid var(--line)',
          background: 'linear-gradient(180deg, var(--panel) 0%, var(--bg) 100%)',
          padding: '36px 0 48px',
        }}
      >
        {/* Glows */}
        <div aria-hidden="true" style={{
          position: 'absolute', right: '-10%', top: '-20%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(107,140,255,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', left: '-8%', bottom: '-10%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,162,92,0.09) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <GridBackdrop />

        <div style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px', position: 'relative' }}>
          {/* Label mono */}
          <div
            className="mono"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              border: '1px solid var(--line-strong)',
              background: 'var(--panel)',
              padding: '7px 14px',
              fontSize: 10.5,
              letterSpacing: '0.1em',
              color: 'var(--ink-3)',
              marginBottom: 24,
            }}
          >
            <StatusDot tone="live" />
            MEUS POLÍTICOS / TRANSPARÊNCIA CÍVICA / V2.8
          </div>

          {/* H1 */}
          <h1 style={{ margin: '0 0 20px', fontSize: 'clamp(48px, 7vw, 88px)', lineHeight: 1.0, letterSpacing: '-0.04em', fontWeight: 700 }}>
            O mandato<br />
            público,<br />
            <span style={{ color: 'var(--accent)' }}>auditável.</span>
          </h1>

          {/* Terminal search */}
          <div style={{ maxWidth: 720, border: '1px solid var(--line-strong)', background: 'var(--panel)', marginBottom: 20 }}>
            {/* Barra de título */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px', borderBottom: '1px solid var(--line)',
              background: 'var(--panel-2)',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
              <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                mp@dados ~ / consulta-pública
              </span>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 14px 0' }}>
              {TABS.map((item) => {
                const active = item.id === tab
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTab(item.id)}
                    className="mono"
                    style={{
                      height: 28,
                      padding: '0 10px',
                      border: `1px solid ${active ? 'var(--brand-2)' : 'var(--line)'}`,
                      background: active ? 'var(--brand-soft)' : 'transparent',
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

            {/* Input */}
            <form onSubmit={onSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 0, padding: 14 }}>
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={placeholder}
                className="mono"
                style={{
                  height: 44,
                  border: '1px solid var(--line-strong)',
                  borderRight: 'none',
                  padding: '0 14px',
                  background: 'var(--panel-2)',
                  color: 'var(--ink)',
                  fontSize: 12.5,
                  letterSpacing: '0.04em',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                className="mono"
                style={{
                  height: 44,
                  padding: '0 20px',
                  border: '1px solid var(--brand-2)',
                  background: 'var(--brand-2)',
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '0.06em',
                  cursor: 'pointer',
                }}
              >
                BUSCAR →
              </button>
            </form>

            {/* Sugestões chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 14px 10px' }}>
              {['Tabata Amaral', 'Arthur Lira', 'Nikolas Ferreira', 'Gleisi Hoffmann'].map((nome) => (
                <button
                  key={nome}
                  type="button"
                  onClick={() => { setTab('nome'); setQuery(nome); }}
                  className="mono"
                  style={{
                    height: 24,
                    padding: '0 9px',
                    border: '1px solid var(--line)',
                    background: 'transparent',
                    color: 'var(--ink-3)',
                    fontSize: 10.5,
                    cursor: 'pointer',
                    letterSpacing: '0.04em',
                  }}
                >
                  {nome}
                </button>
              ))}
            </div>

            {/* Footer terminal */}
            <div
              className="mono"
              style={{
                padding: '8px 14px',
                borderTop: '1px solid var(--line)',
                fontSize: 10.5,
                color: 'var(--mute)',
                letterSpacing: '0.06em',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>513 resultados indexados</span>
              <span>fonte: api.camara.leg.br</span>
            </div>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 border border-[var(--line-strong)] max-w-[720px]">
            {[
              { value: '513', label: 'REPRESENTANTES' },
              { value: '378.695', label: 'VOTAÇÕES' },
              { value: 'R$ 604k', label: 'GASTOS' },
              { value: '4min', label: 'ATUALIZAÇÃO' },
            ].map((kpi, i) => (
              <div
                key={kpi.label}
                className="p-[14px_16px] border-l border-t sm:border-t-0 border-[var(--line-strong)] [&:nth-child(2n+1)]:border-l-0 sm:[&:nth-child(2n+1)]:border-l sm:first:border-l-0 [&:nth-child(-n+2)]:border-t-0"
              >
                <div className="mono" style={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--ink)' }}>
                  {kpi.value}
                </div>
                <div className="mono" style={{ fontSize: 9.5, color: 'var(--ink-3)', letterSpacing: '0.1em', marginTop: 4 }}>
                  {kpi.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 2: ActivityTicker ────────────────────────────────────────── */}
      <ActivityTicker />

      {/* ── SEÇÃO 3: Votações + Mapa ───────────────────────────────────────── */}
      <section className="max-w-[1320px] mx-auto p-[24px_24px_0]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-4 items-start">

          {/* Tabela de votações */}
          <Panel>
            <PanelHeader
              title="VOTAÇÕES NOMINAIS · ÚLT. 24H"
              action={
                <Link
                  href="/votacoes"
                  className="mono"
                  style={{ fontSize: 10.5, color: 'var(--brand-2)', textDecoration: 'none', letterSpacing: '0.06em' }}
                >
                  TODAS →
                </Link>
              }
            />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11.5 }}>
                <thead>
                  <tr style={{ background: 'var(--panel-2)' }}>
                    {['ID', 'Matéria', 'Casa', 'SIM', 'NÃO', 'ABS', 'Resultado'].map((col) => (
                      <th
                        key={col}
                        className="mono"
                        style={{
                          padding: '8px 12px',
                          textAlign: 'left',
                          fontSize: 9.5,
                          letterSpacing: '0.1em',
                          color: 'var(--ink-3)',
                          fontWeight: 500,
                          borderBottom: '1px solid var(--line)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {VOTACOES.map((row, i) => (
                    <tr
                      key={row.id}
                      style={{
                        borderBottom: i < VOTACOES.length - 1 ? '1px solid var(--line)' : undefined,
                      }}
                    >
                      <td className="mono" style={{ padding: '9px 12px', fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                        {row.id.slice(-8)}
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--ink-2)', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {row.materia}
                      </td>
                      <td className="mono" style={{ padding: '9px 12px', fontSize: 10, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>
                        {row.casa}
                      </td>
                      <td className="mono" style={{ padding: '9px 12px', color: 'var(--pos)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.sim}
                      </td>
                      <td className="mono" style={{ padding: '9px 12px', color: 'var(--neg)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.nao}
                      </td>
                      <td className="mono" style={{ padding: '9px 12px', color: 'var(--warn)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                        {row.abs}
                      </td>
                      <td style={{ padding: '9px 12px', whiteSpace: 'nowrap' }}>
                        <VoteChip vote={row.resultado === 'APROV' ? 'SIM' : 'NÃO'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          {/* Mapa */}
          <Panel>
            <PanelHeader
              title="MAPA · CLIQUE NO ESTADO"
              action={
                <span className="mono" style={{ fontSize: 11, color: 'var(--accent)', letterSpacing: '0.08em', fontWeight: 700 }}>
                  {activeUf}
                </span>
              }
            />
            <div style={{ padding: '8px 0 0' }}>
              <BrazilDots active={activeUf} onPick={setActiveUf} height={340} />
            </div>
            <div style={{
              padding: '12px 20px',
              borderTop: '1px solid var(--line)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{ufName}</div>
                <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', marginTop: 2, letterSpacing: '0.06em' }}>
                  {ufDep} dep · 3 sen
                </div>
              </div>
              <Link
                href={`/busca?uf=${activeUf}`}
                className="mono"
                style={{
                  padding: '6px 12px',
                  border: '1px solid var(--brand-2)',
                  color: 'var(--brand-2)',
                  fontSize: 10.5,
                  textDecoration: 'none',
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}
              >
                Ver representantes →
              </Link>
            </div>
          </Panel>
        </div>
      </section>

      {/* ── SEÇÃO 4: KPI grid com sparklines ──────────────────────────────── */}
      <section className="max-w-[1320px] mx-auto p-[24px_24px_0]">
        <div className="grid grid-cols-2 lg:grid-cols-4 border border-[var(--line-strong)]">
          {[
            {
              label: 'PRESENÇA MÉDIA · 30D',
              value: '63,2%',
              delta: '↑ calculado',
              tone: 'var(--pos)',
              data: [58, 61, 59, 64, 62, 65, 63, 67, 63],
            },
            {
              label: 'GASTO CÂMARA · 2025',
              value: 'R$ 190,5M',
              delta: 'total real',
              tone: 'var(--info)',
              data: [140, 148, 155, 162, 170, 175, 178, 185, 190],
            },
            {
              label: 'VOTAÇÕES NOMINAIS · 2025',
              value: '160.944',
              delta: 'desde 2023',
              tone: 'var(--pos)',
              data: [120, 130, 138, 142, 148, 152, 155, 158, 160],
            },
            {
              label: 'REGISTROS PRESENÇA',
              value: '16.572',
              delta: 'monitorados',
              tone: 'var(--pos)',
              data: [12, 13, 13.5, 14, 14.8, 15.2, 15.6, 16, 16.5],
            },
          ].map((kpi, i) => (
            <div
              key={kpi.label}
              className="p-[20px_20px_16px] border-l border-t lg:border-t-0 border-[var(--line-strong)] [&:nth-child(2n+1)]:border-l-0 lg:[&:nth-child(2n+1)]:border-l lg:first:border-l-0 [&:nth-child(-n+2)]:border-t-0"
            >
              <div className="mono" style={{ fontSize: 9.5, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 8 }}>
                {kpi.label}
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1 }}>
                {kpi.value}
              </div>
              <div className="mono" style={{ fontSize: 10.5, color: kpi.tone, marginTop: 4 }}>
                {kpi.delta}
              </div>
              <div style={{ marginTop: 12 }}>
                <Sparkline data={kpi.data} w={120} h={32} color={kpi.tone} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── SEÇÃO 5: Rastreabilidade ───────────────────────────────────────── */}
      <section className="max-w-[1320px] mx-auto p-[48px_24px_0]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* Esquerda: texto */}
          <div>
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: '0.14em', color: 'var(--accent)', marginBottom: 16 }}>
              02 · RASTREABILIDADE
            </div>
            <h2 style={{ margin: '0 0 24px', fontSize: 'clamp(28px, 3vw, 40px)', lineHeight: 1.1, letterSpacing: '-0.03em', fontWeight: 700 }}>
              Cada dado tem fonte,<br />hash e timestamp.
            </h2>
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                { label: 'Fonte', value: 'api.camara.leg.br · dados.senado.leg.br · portaldatransparencia.gov.br' },
                { label: 'Frequência', value: 'Ingestão a cada 4 minutos via cronjob' },
                { label: 'Validação', value: 'Schema validation + hash SHA-256 por registro' },
                { label: 'Bronze layer', value: 'Raw JSON preservado por 24 meses' },
                { label: 'Retenção', value: 'Série histórica completa desde 2003' },
              ].map((attr) => (
                <div key={attr.label} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 12, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                  <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.08em', paddingTop: 2 }}>
                    {attr.label}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                    {attr.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Direita: terminal SQL */}
          <div>
            <div style={{ border: '1px solid var(--line-strong)', background: 'var(--panel)' }}>
              {/* Barra título terminal */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderBottom: '1px solid var(--line)',
                background: 'var(--panel-2)',
              }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e', display: 'inline-block' }} />
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840', display: 'inline-block' }} />
                <span className="mono" style={{ marginLeft: 8, fontSize: 11, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
                  postgres@meuspoliticos ~ / schema
                </span>
              </div>
              {/* Código SQL */}
              <pre
                className="mono"
                style={{
                  padding: '20px 20px',
                  fontSize: 11.5,
                  lineHeight: 1.7,
                  color: 'var(--ink-2)',
                  overflowX: 'auto',
                  margin: 0,
                  background: 'transparent',
                }}
              >
                <span style={{ color: 'var(--mute)' }}>{`-- votações nominais (câmara)\n`}</span>
                <span style={{ color: 'var(--brand-2)' }}>SELECT </span>
                {`v.id_votacao,\n`}
                {'       '}
                {`v.data_hora_registro,\n`}
                {'       '}
                <span style={{ color: 'var(--brand-2)' }}>COUNT</span>
                {`(CASE WHEN voto = `}
                <span style={{ color: 'var(--pos)' }}>{`'Sim'`}</span>
                {` THEN 1 END) AS sim,\n`}
                {'       '}
                <span style={{ color: 'var(--brand-2)' }}>COUNT</span>
                {`(CASE WHEN voto = `}
                <span style={{ color: 'var(--neg)' }}>{`'Não'`}</span>
                {` THEN 1 END) AS nao\n`}
                <span style={{ color: 'var(--brand-2)' }}>FROM </span>
                {`votos_deputados vd\n`}
                <span style={{ color: 'var(--brand-2)' }}>JOIN  </span>
                {`votacoes v ON vd.id_votacao = v.id\n`}
                <span style={{ color: 'var(--brand-2)' }}>WHERE </span>
                {`v.data_hora_registro >= `}
                <span style={{ color: 'var(--warn)' }}>NOW</span>
                {`() - `}
                <span style={{ color: 'var(--accent)' }}>{`INTERVAL '24h'`}</span>
                {`\n`}
                <span style={{ color: 'var(--brand-2)' }}>GROUP BY </span>
                {`v.id_votacao, v.data_hora_registro\n`}
                <span style={{ color: 'var(--brand-2)' }}>ORDER BY </span>
                {`v.data_hora_registro `}
                <span style={{ color: 'var(--brand-2)' }}>DESC</span>
                {`;\n`}
              </pre>
            </div>

            {/* Card auditoria */}
            <div style={{
              marginTop: 16,
              padding: '16px 20px',
              border: '1px solid var(--pos)',
              background: 'var(--pos-soft)',
              display: 'flex',
              gap: 14,
              alignItems: 'flex-start',
            }}>
              <StatusDot tone="pos" />
              <div>
                <div className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--pos)', marginBottom: 4 }}>
                  AUDITORIA EM TEMPO REAL
                </div>
                <div style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.5 }}>
                  Cada query pública é logada com timestamp, hash de resultado e versão do schema. Disponível via API aberta para pesquisadores e jornalistas.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SEÇÃO 6: CTA ──────────────────────────────────────────────────── */}
      <section className="max-w-[1320px] mx-auto p-[48px_24px_64px]">
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-0 border border-[var(--line-strong)] bg-[var(--panel)]">
          {/* Esquerda */}
          <div className="p-6 md:p-12 border-b lg:border-b-0 lg:border-r border-[var(--line-strong)]">
            <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', color: 'var(--ink-3)', marginBottom: 20 }}>
              $ mp register --account
            </div>
            <h2 style={{ margin: '0 0 16px', fontSize: 'clamp(24px, 2.5vw, 36px)', lineHeight: 1.15, letterSpacing: '-0.03em', fontWeight: 700 }}>
              Crie seu painel cívico pessoal.<br />
              <span style={{ color: 'var(--accent)' }}>Gratuito, sem ranking, sem ruído.</span>
            </h2>
            <p style={{ margin: '0 0 32px', fontSize: 14.5, color: 'var(--ink-3)', lineHeight: 1.6 }}>
              Acompanhe representantes · alertas por categoria · feed personalizado.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link
                href="/register"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 46,
                  padding: '0 24px',
                  background: 'var(--accent)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                  letterSpacing: '0.02em',
                }}
              >
                Criar conta →
              </Link>
              <Link
                href="/busca"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  height: 46,
                  padding: '0 20px',
                  border: '1px solid var(--line-strong)',
                  color: 'var(--ink-2)',
                  fontSize: 14,
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                Explorar sem login ›
              </Link>
            </div>
          </div>

          {/* Direita: stats */}
          <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 28 }}>
            {[
              { n: '513', desc: 'deputados federais monitorados em tempo real' },
              { n: '0', desc: 'opinião editorial ou ranking ideológico' },
              { n: '100%', desc: 'fontes oficiais — dados.gov, câmara e senado' },
            ].map((stat) => (
              <div key={stat.n} style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                <div className="mono" style={{ fontSize: 32, fontWeight: 700, color: 'var(--brand-2)', lineHeight: 1, minWidth: 60 }}>
                  {stat.n}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--ink-3)', lineHeight: 1.5, paddingTop: 6 }}>
                  {stat.desc}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
