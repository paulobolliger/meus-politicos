'use client'

import { CEAP_TETO_UF, NA, PoliticoDashboardV2Data, formatGabinetePhone, normalizePlatform } from '@/components/politico-v2/shared'

type Tone = 'pos' | 'warn' | 'neg' | 'info' | 'mute'

type QuestionCardProps = {
  number: string
  tone: Tone
  question: string
  answer: string
  explanation: string
  children: React.ReactNode
}

function toneColors(tone: Tone) {
  if (tone === 'pos') return { strong: 'var(--pos)', soft: 'var(--pos-soft)' }
  if (tone === 'warn') return { strong: 'var(--warn)', soft: 'var(--warn-soft)' }
  if (tone === 'neg') return { strong: 'var(--neg)', soft: 'var(--neg-soft)' }
  if (tone === 'info') return { strong: 'var(--info)', soft: 'var(--info-soft)' }
  return { strong: 'var(--ink-3)', soft: 'var(--bg-2)' }
}

function formatMilAno(value: number | null) {
  if (value == null) return 'Dados sendo coletados'
  const mil = value / 1000
  const casas = mil >= 100 ? 0 : 1
  const numero = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  }).format(mil)
  return `R$ ${numero} mil/ano`
}

function socialVisual(platform: string) {
  if (platform.includes('twitter') || platform === 'x') return { icon: '𝕏', label: 'Twitter/X', bg: 'var(--panel)', color: 'var(--ink)' }
  if (platform.includes('instagram')) return { icon: '◉', label: 'Instagram', bg: 'linear-gradient(135deg, var(--brand) 0%, var(--accent) 100%)', color: 'var(--ink)' }
  if (platform.includes('youtube')) return { icon: '▶', label: 'YouTube', bg: 'var(--neg)', color: 'var(--ink)' }
  if (platform.includes('facebook')) return { icon: 'f', label: 'Facebook', bg: 'var(--info)', color: 'var(--ink)' }
  return { icon: '◎', label: 'Site oficial', bg: 'var(--line-strong)', color: 'var(--ink)' }
}

function QuestionCard({ number, tone, question, answer, explanation, children }: QuestionCardProps) {
  const colors = toneColors(tone)

  return (
    <article
      style={{
        border: '1px solid var(--line)',
        borderRadius: 16,
        background: 'rgba(30, 41, 59, 0.45)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
        padding: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div className="mono" style={{ fontSize: 12, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
          {number}
        </div>
        <span
          style={{
            width: 9,
            height: 9,
            borderRadius: 999,
            background: colors.strong,
          }}
        />
      </div>

      <h3 style={{ margin: '10px 0 6px', fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.01em', color: 'var(--ink)' }}>{question}</h3>
      <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: colors.strong }}>{answer}</p>
      <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)', lineHeight: 1.6 }}>{explanation}</p>

      <div style={{ marginTop: 16 }}>{children}</div>

      <div
        style={{
          marginTop: 16,
          border: `1px solid ${colors.strong}`,
          background: colors.soft,
          borderRadius: 10,
          padding: '12px 14px',
          fontSize: 13,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
        }}
      >
        {tone === 'pos' && 'O que isso significa? Deputados ganham para estar lá. Acima de 90% é considerado bom comparecimento.'}
        {tone === 'info' && 'O que isso significa? Gastos parlamentares têm teto por UF. O mais importante é a transparência e a evolução ao longo do tempo.'}
        {tone === 'warn' && 'O que isso significa? O histórico de votações ajuda a entender alinhamento partidário e decisões concretas em temas-chave.'}
      </div>
    </article>
  )
}

function CircleScore({ value, label, tone }: { value: number | null; label: string; tone: Tone }) {
  const percent = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)))
  const r = 34
  const stroke = 8
  const c = 2 * Math.PI * r
  const off = c - (percent / 100) * c
  const color = toneColors(tone).strong

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={r} stroke="var(--bg-2)" strokeWidth={stroke} fill="none" />
        <circle
          cx="44"
          cy="44"
          r={r}
          stroke={color}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={c}
          strokeDashoffset={off}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="44" y="47" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--ink)">
          {value == null ? '--' : `${percent}%`}
        </text>
      </svg>
      <div>
        <p className="mono" style={{ margin: 0, fontSize: 10.5, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
          INDICADOR
        </p>
        <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--ink-2)' }}>{label}</p>
      </div>
    </div>
  )
}

function CompareRow({ label, value, color, highlight }: { label: string; value: number | null; color: string; highlight?: boolean }) {
  const pct = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 64px', alignItems: 'center', gap: 10 }}>
      <span className="mono" style={{ fontSize: 11, color: highlight ? 'var(--ink)' : 'var(--ink-3)' }}>
        {label}
      </span>
      <div style={{ height: 8, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: highlight ? 'var(--ink)' : 'var(--ink-3)', textAlign: 'right' }}>
        {value == null ? '–' : `${pct}%`}
      </span>
    </div>
  )
}

type Props = {
  politico: PoliticoDashboardV2Data
}

export function ModoCidadao({ politico }: Props) {
  const nomeExibicao = politico.nome_eleitoral ?? politico.nome

  const presenca = politico.presenca_pct_atual
  const presencaTone: Tone =
    presenca == null ? 'mute' : presenca >= 80 ? 'pos' : presenca >= 60 ? 'warn' : 'neg'

  const presencaResposta =
    presenca == null
      ? 'Dados sendo coletados'
      : presenca >= 80
        ? 'Sim, quase sempre.'
        : presenca >= 60
          ? 'Na média.'
          : 'Abaixo da média.'

  const gastoResposta = formatMilAno(politico.gasto_total_ano)
  const tetoUf = CEAP_TETO_UF[politico.uf ?? ''] ?? null
  const gastoPct =
    politico.gasto_total_ano != null && tetoUf != null && tetoUf > 0
      ? Math.max(0, Math.min(100, Math.round((politico.gasto_total_ano / tetoUf) * 100)))
      : null

  const contatoEmail = politico.gabinete_email ?? politico.email
  const telefoneGabinete = formatGabinetePhone(politico.gabinete_telefone)
  const gabineteNome = politico.gabinete_nome ? `Gabinete ${politico.gabinete_nome}` : NA
  const redesComUrl = (politico.redes_sociais ?? []).filter((item) => item.url)

  return (
    <main style={{ background: 'var(--bg)', padding: '22px 0 40px' }}>
      <section style={{ maxWidth: 1320, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ maxWidth: 980 }}>
          <div className="label" style={{ marginBottom: 10 }}>
            LEITURA CIDADÃ
          </div>
          <h2 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 50px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
            O que você precisa saber
            <br />
            sobre {nomeExibicao}
          </h2>
        </div>

        <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
          <QuestionCard
            number="01 · PRESENÇA"
            tone={presencaTone}
            question="Aparece pra trabalhar?"
            answer={presencaResposta}
            explanation="Presença em sessões deliberativas e comparação com referenciais públicos."
          >
            <CircleScore value={presenca} label="Presença atual" tone={presencaTone === 'mute' ? 'pos' : presencaTone} />
            <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
              <CompareRow label="Presença dele/a" value={presenca} color="var(--brand)" highlight />
              <CompareRow label="Média da UF" value={null} color="var(--ink-3)" />
              <CompareRow label="Média da Câmara" value={63} color="var(--pos)" />
            </div>
          </QuestionCard>

          <QuestionCard
            number="02 · GASTOS"
            tone="info"
            question="No que gasta dinheiro público?"
            answer={gastoResposta}
            explanation="Uso da cota parlamentar anual em relação ao teto da UF."
          >
            <div style={{ display: 'grid', gap: 8 }}>
              <div className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                USO DA COTA PARLAMENTAR
              </div>
              <div style={{ height: 10, borderRadius: 999, background: 'var(--bg-2)', overflow: 'hidden' }}>
                <div style={{ width: `${gastoPct ?? 0}%`, height: '100%', background: 'linear-gradient(90deg, var(--info) 0%, var(--brand-2) 100%)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--ink-3)' }}>
                <span>{politico.gasto_total_ano == null ? 'Dados sendo coletados' : `Usado: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(politico.gasto_total_ano)}`}</span>
                <span>{tetoUf == null ? 'Teto UF: –' : `Teto UF: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(tetoUf)}`}</span>
              </div>
            </div>
          </QuestionCard>

          <QuestionCard
            number="03 · VOTAÇÕES"
            tone="warn"
            question="Como vota?"
            answer={politico.total_votacoes == null ? 'Dados sendo coletados' : `${politico.total_votacoes} votações registradas`}
            explanation="Sinal de alinhamento e comportamento em decisões nominais da casa legislativa."
          >
            <div
              style={{
                border: '1px dashed var(--line-strong)',
                borderRadius: 10,
                padding: '18px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 116,
                background: 'var(--panel-2)',
              }}
            >
              <div style={{ fontSize: 26 }}>🗳️</div>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>Detalhamento das votações em breve</p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>Estamos organizando as últimas votações nominais para esta página.</p>
            </div>
          </QuestionCard>
        </div>

        <div
          style={{
            marginTop: 40,
            padding: '24px',
            background: 'linear-gradient(135deg, var(--brand) 0%, var(--brand-2) 100%)',
            borderRadius: 16,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
            color: 'white',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div className="label" style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>
              QUER IR FUNDO?
            </div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Use o app analitico.</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
              Votacoes detalhadas, scores cientificos, radar de desempenho.
            </div>
          </div>
          <a
            href={`https://app.meuspoliticos.com.br/politicos/${politico.slug}`}
            style={{
              padding: '12px 24px',
              background: 'var(--accent)',
              color: 'white',
              textDecoration: 'none',
              fontSize: 14,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            Abrir no app -&gt;
          </a>
        </div>
      </section>

      <section style={{ maxWidth: 1320, margin: '18px auto 0', padding: '0 24px' }}>
        <div
          style={{
            border: '1px solid var(--line)',
            borderRadius: 16,
            background: 'rgba(30, 41, 59, 0.45)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            padding: 20,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 24, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Quer falar com {nomeExibicao}?</h3>
          <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel-2)', padding: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>Email do gabinete</p>
              <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                {contatoEmail && contatoEmail !== NA ? (
                  <a href={`mailto:${contatoEmail}`} style={{ color: 'var(--brand-2)', textDecoration: 'none' }}>
                    {contatoEmail}
                  </a>
                ) : (
                  NA
                )}
              </p>
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel-2)', padding: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>Telefone</p>
              <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>{telefoneGabinete}</p>
            </div>
            <div style={{ border: '1px solid var(--line)', borderRadius: 10, background: 'var(--panel-2)', padding: 14 }}>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>Gabinete</p>
              <p style={{ margin: '6px 0 0', fontSize: 14, fontWeight: 600, color: 'var(--ink)' }}>
                {gabineteNome === NA ? NA : `${gabineteNome} — Câmara dos Deputados, Brasília/DF`}
              </p>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <p className="mono" style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', color: 'var(--ink-3)' }}>
              REDES SOCIAIS
            </p>
            {redesComUrl.length === 0 ? (
              <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-3)' }}>Sem redes sociais cadastradas</p>
            ) : (
              <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
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
                        gap: 8,
                        padding: '9px 12px',
                        borderRadius: 999,
                        border: '1px solid transparent',
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
        </div>
      </section>
    </main>
  )
}
