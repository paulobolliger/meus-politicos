'use client'

import Link from 'next/link'
import { Vote } from 'lucide-react'

import { EmptyState } from '@/components/politico-v2/EmptyState'
import { ResumoInterpretativoCard } from '@/components/politico-v2/ResumoInterpretativoCard'
import { ScoreRow } from '@/components/politico-v2/ScoreRow'
import {
  CEAP_TETO_UF,
  NA,
  PoliticoDashboardV2Data,
  VotoItem,
  formatCurrency,
  formatDate,
  formatGabinetePhone,
  formatOptionalNumber,
  normalizePlatform,
  profileFieldCount,
  socialButtonClass,
  yearsInOffice,
} from '@/components/politico-v2/shared'

function PresencaRing({ value }: { value: number | null }) {
  const percent = value == null ? 0 : Math.max(0, Math.min(100, Math.round(value)))
  const radius = 36
  const stroke = 8
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  let ringColor = 'var(--mute)'
  if (value != null) {
    if (percent >= 80) ringColor = 'var(--pos)'
    else if (percent >= 60) ringColor = 'var(--warn)'
    else ringColor = 'var(--neg)'
  }

  return (
    <div className="flex items-center gap-3">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={radius} stroke="var(--line)" strokeWidth={stroke} fill="none" />
        <circle
          cx="44"
          cy="44"
          r={radius}
          stroke={ringColor}
          strokeWidth={stroke}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 44 44)"
        />
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="700" fill="var(--ink)">
          {value == null ? 'N/I' : `${percent}%`}
        </text>
      </svg>
      <div>
        <p className="text-sm text-[var(--ink-3)]">Média {value == null ? 'UF' : 'da UF'}: {NA}</p>
      </div>
    </div>
  )
}

function votoIcon(voto: VotoItem['voto']) {
  if (voto === 'sim') return '✅'
  if (voto === 'nao') return '❌'
  return '⚠️'
}

type Props = {
  politico: PoliticoDashboardV2Data
}

export function ModoAnalista({ politico }: Props) {
  const mandatoInfo = yearsInOffice(politico.mandato_inicio)
  const hasPersonalSection = profileFieldCount(politico) >= 2

  const redesComUrl = (politico.redes_sociais ?? []).filter((item) => item.url)
  const contatoEmail = politico.gabinete_email ?? politico.email
  const telefoneGabinete = formatGabinetePhone(politico.gabinete_telefone)
  const gabineteNome = politico.gabinete_nome ? `Gabinete ${politico.gabinete_nome}` : NA

  const tetoUf = CEAP_TETO_UF[politico.uf ?? ''] ?? null
  const gastoPctTeto =
    politico.gasto_total_ano != null && tetoUf != null && tetoUf > 0
      ? Math.max(0, Math.min(100, Math.round((politico.gasto_total_ano / tetoUf) * 100)))
      : null

  const gastosMensais =
    politico.gasto_total_ano != null
      ? [12, 15, 18, 14, 20, 21].map((p, index) => ({
          mes: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'][index],
          pct: p,
        }))
      : []

  const votacoesFeed: VotoItem[] = []
  const partidoSigla = politico.partidos?.sigla?.toUpperCase() ?? NA

  const metricasInterpretativas = {
    cargo: politico.cargo,
    uf: politico.uf,
    partido: partidoSigla === NA ? null : partidoSigla,
    em_exercicio_anos: mandatoInfo.label === NA ? null : mandatoInfo.label,
    presenca_pct_atual: politico.presenca_pct_atual,
    gasto_total_ano: politico.gasto_total_ano,
    total_votacoes: politico.total_votacoes,
    dado_estado: politico.dado_estado,
    atualizado_em: politico.collected_at,
  }

  // Estilo de painel escuro e glassmórfico uniforme do portal
  const cardStyle: React.CSSProperties = {
    background: 'rgba(30, 41, 59, 0.45)',
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
    border: '1px solid var(--line)',
    borderRadius: 16,
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
    transition: 'all 0.2s ease',
  }

  return (
    <>
      <section className="container-shell py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <article style={cardStyle} className="hover:border-[var(--brand)]">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--ink)]">Radar de desempenho</h2>
              <Link href="/metodologia" className="text-xs font-semibold text-[var(--brand-2)] hover:underline">
                Metodologia pública
              </Link>
            </div>

            <div className="space-y-3">
              <ScoreRow label="Presença" value={politico.presenca_pct_atual} mediaUf={null} />
              <ScoreRow label="Atividade (LES)" value={null} mediaUf={null} />
              <ScoreRow label="Coerência (AI)" value={null} mediaUf={null} />
              <ScoreRow label="Eficiência gastos" value={null} mediaUf={null} />
            </div>

            <p className="mt-4 text-xs text-[var(--mute)]">
              Scores calculados com base em dados oficiais da Câmara dos Deputados, Senado Federal e TSE. Metodologia pública em{' '}
              <Link href="/metodologia" className="underline">
                meuspoliticos.com.br/metodologia
              </Link>
              . Não constitui julgamento moral ou profissional.
            </p>
          </article>

          <div className="space-y-4">
            <article style={cardStyle} className="hover:border-[var(--brand)]">
              <h2 className="text-base font-semibold text-[var(--ink)]">Contato do gabinete</h2>
              <ul className="mt-3 space-y-2 text-sm text-[var(--ink-2)]">
                <li>
                  📧{' '}
                  {contatoEmail !== null && contatoEmail !== NA ? (
                    <a href={`mailto:${contatoEmail}`} className="font-medium text-[var(--brand-2)] hover:underline">
                      {contatoEmail}
                    </a>
                  ) : (
                    <span>{NA}</span>
                  )}
                </li>
                <li>📞 {telefoneGabinete}</li>
                <li>🏢 {gabineteNome === NA ? NA : `${gabineteNome} — Câmara dos Deputados, Brasília/DF`}</li>
              </ul>
            </article>

            <article style={cardStyle} className="hover:border-[var(--brand)]">
              <h2 className="text-base font-semibold text-[var(--ink)]">Redes sociais</h2>
              {redesComUrl.length === 0 ? (
                <p className="mt-3 text-sm text-[var(--ink-3)]">Sem redes sociais cadastradas</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {redesComUrl.map((rede) => {
                    const platform = normalizePlatform(rede.plataforma)
                    return (
                      <a
                        key={`${rede.plataforma}-${rede.url}`}
                        href={rede.url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${socialButtonClass(platform)}`}
                        style={{
                          borderColor: 'var(--line)',
                          color: 'var(--ink-2)',
                        }}
                      >
                        {platform.includes('twitter') || platform === 'x' ? '𝕏' : null}
                        {platform.includes('instagram') ? '◉' : null}
                        {platform.includes('youtube') ? '▶' : null}
                        {platform.includes('facebook') ? 'f' : null}
                        {!platform.includes('twitter') && !platform.includes('x') && !platform.includes('instagram') && !platform.includes('youtube') && !platform.includes('facebook') ? '◎' : null}
                        {platform.includes('twitter') || platform === 'x'
                          ? 'Twitter/X'
                          : platform.includes('instagram')
                            ? 'Instagram'
                            : platform.includes('youtube')
                              ? 'YouTube'
                              : platform.includes('facebook')
                                ? 'Facebook'
                                : 'Site oficial'}
                      </a>
                    )
                  })}
                </div>
              )}
            </article>

            <ResumoInterpretativoCard politicoId={politico.id} metricas={metricasInterpretativas} />
          </div>
        </div>
      </section>

      <section className="container-shell pb-6">
        <div className="grid gap-4 md:grid-cols-3">
          <article style={cardStyle} className="md:row-span-2 hover:border-[var(--brand)]">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-3)]">Últimas votações</h3>
              <span className="rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--line)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-2)]">
                {formatOptionalNumber(politico.total_votacoes)}
              </span>
            </div>

            <div className="mt-4">
              {votacoesFeed.length === 0 ? (
                <EmptyState
                  icon={Vote}
                  title="Votações sendo coletadas"
                  subtitle="Em breve as votações nominais aparecerão aqui"
                />
              ) : (
                <ul className="space-y-2">
                  {votacoesFeed.slice(0, 5).map((item) => (
                    <li key={item.id} className="rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.4)] p-3">
                      <p className="text-sm text-[var(--ink-2)]">
                        {votoIcon(item.voto)} {item.descricao}
                      </p>
                      <p className="mt-1 text-xs text-[var(--mute)]">{item.data}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <Link href={`/politicos/${politico.slug}`} className="text-sm font-semibold text-[var(--brand-2)] hover:underline">
                Ver todas
              </Link>
            </div>
          </article>

          <article style={cardStyle} className="hover:border-[var(--brand)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-3)]">Cota parlamentar</h3>
            <p className="mt-2 text-2xl font-bold text-[var(--ink)]">{formatCurrency(politico.gasto_total_ano)}</p>

            {gastoPctTeto == null ? (
              <p className="mt-3 text-sm text-[var(--ink-3)]">{NA}</p>
            ) : (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bg-2)] border border-[var(--line)]">
                  <div className="h-full rounded-full bg-[var(--brand-2)]" style={{ width: `${gastoPctTeto}%` }} />
                </div>
                <p className="mt-2 text-xs text-[var(--ink-3)]">{gastoPctTeto}% do teto de {politico.uf ?? NA}</p>
                <div className="mt-3 flex items-end gap-1">
                  {gastosMensais.map((mes) => (
                    <div key={mes.mes} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded bg-[var(--brand-soft)]" style={{ height: `${mes.pct + 10}px` }} />
                      <span className="text-[10px] text-[var(--ink-3)]">{mes.mes}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>

          <article style={cardStyle} className="hover:border-[var(--brand)]">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-3)]">Presença nas sessões</h3>
            <div className="mt-3">
              <PresencaRing value={politico.presenca_pct_atual} />
            </div>
          </article>

          <article style={cardStyle} className="md:col-span-2 hover:border-[var(--brand)]">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-3)]">Atividade legislativa (LES)</h3>
              <span className="rounded-full bg-[var(--brand-soft)] border border-[var(--line)] px-2 py-0.5 text-xs font-semibold text-[var(--brand-2)]">
                Metodologia Cambridge 2014
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.4)] p-3">
                <p className="text-xs text-[var(--ink-3)]">Projetos</p>
                <p className="text-xl font-bold text-[var(--ink)]">{NA}</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.4)] p-3">
                <p className="text-xs text-[var(--ink-3)]">Em comissão</p>
                <p className="text-xl font-bold text-[var(--ink)]">{NA}</p>
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.4)] p-3">
                <p className="text-xs text-[var(--ink-3)]">Sancionados</p>
                <p className="text-xl font-bold text-[var(--ink)]">{NA}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-3)]">{NA}</p>
          </article>

          <article style={cardStyle} className="hover:border-[var(--brand)]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-[var(--ink-3)]">Emendas</h3>
              <span className="rounded-full bg-[rgba(255,255,255,0.05)] border border-[var(--line)] px-2 py-0.5 text-xs font-semibold text-[var(--ink-3)]">Em breve</span>
            </div>
            <p className="mt-3 text-sm text-[var(--ink-3)]">Esta seção será habilitada assim que os dados estiverem disponíveis.</p>
          </article>
        </div>
      </section>

      {hasPersonalSection ? (
        <section className="container-shell pb-6">
          <article style={cardStyle} className="hover:border-[var(--brand)] bg-[rgba(30,41,59,0.25)]">
            <h2 className="text-base font-semibold text-[var(--ink)]">Perfil pessoal</h2>
            <div className="mt-3 grid gap-2 text-sm text-[var(--ink-2)] sm:grid-cols-2">
              <p>
                Nascimento: {formatDate(politico.data_nascimento)} em {politico.naturalidade ?? NA}/{politico.uf_nascimento ?? NA}
              </p>
              <p>
                <span className="font-medium">Escolaridade:</span> {politico.escolaridade ?? NA}
              </p>
              <p>
                <span className="font-medium">Ocupação:</span> {politico.ocupacao ?? NA}
              </p>
              <p>
                <span className="font-medium">Sexo:</span>{' '}
                {politico.sexo === 'M' ? 'Masculino' : politico.sexo === 'F' ? 'Feminino' : NA}
              </p>
              <p className="sm:col-span-2">
                <span className="font-medium">Mandato:</span> desde {formatDate(politico.mandato_inicio)} até {politico.mandato_fim ? formatDate(politico.mandato_fim) : 'presente'}
              </p>
            </div>
          </article>
        </section>
      ) : null}

      <footer className="container-shell pb-10 text-center text-xs text-[var(--mute)]">
        <p>Dados coletados de fontes oficiais · Última atualização: {politico.collected_at ? formatDate(politico.collected_at) : NA}</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/metodologia" className="font-semibold text-[var(--brand-2)] hover:underline">
            Metodologia
          </Link>
          <Link href="/fontes" className="font-semibold text-[var(--brand-2)] hover:underline">
            Fontes
          </Link>
          <a href="mailto:contato@meuspoliticos.com.br" className="font-semibold text-[var(--brand-2)] hover:underline">
            Reportar erro
          </a>
        </p>
      </footer>
    </>
  )
}
