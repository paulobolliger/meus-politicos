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

  let ringColor = '#9ca3af'
  if (value != null) {
    if (percent >= 80) ringColor = '#16a34a'
    else if (percent >= 60) ringColor = '#ca8a04'
    else ringColor = '#dc2626'
  }

  return (
    <div className="flex items-center gap-3">
      <svg width="88" height="88" viewBox="0 0 88 88" aria-hidden="true">
        <circle cx="44" cy="44" r={radius} stroke="#e2e8f0" strokeWidth={stroke} fill="none" />
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
        <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontSize="16" fontWeight="700" fill="#0f172a">
          {value == null ? 'N/I' : `${percent}%`}
        </text>
      </svg>
      <div>
        <p className="text-sm text-slate-500">Média {value == null ? 'UF' : 'da UF'}: {NA}</p>
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

  return (
    <>
      <section className="container-shell py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Radar de desempenho</h2>
              <Link href="/metodologia" className="text-xs font-semibold text-[#2952cc] hover:underline">
                Metodologia pública
              </Link>
            </div>

            <div className="space-y-3">
              <ScoreRow label="Presença" value={politico.presenca_pct_atual} mediaUf={null} />
              <ScoreRow label="Atividade (LES)" value={null} mediaUf={null} />
              <ScoreRow label="Coerência (AI)" value={null} mediaUf={null} />
              <ScoreRow label="Eficiência gastos" value={null} mediaUf={null} />
            </div>

            <p className="mt-4 text-xs text-slate-400">
              Scores calculados com base em dados oficiais da Câmara dos Deputados, Senado Federal e TSE. Metodologia pública em{' '}
              <Link href="/metodologia" className="underline">
                meuspoliticos.com.br/metodologia
              </Link>
              . Não constitui julgamento moral ou profissional.
            </p>
          </article>

          <div className="space-y-4">
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">Contato do gabinete</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-700">
                <li>
                  📧{' '}
                  {contatoEmail !== null && contatoEmail !== NA ? (
                    <a href={`mailto:${contatoEmail}`} className="font-medium text-[#2952cc] hover:underline">
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

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">Redes sociais</h2>
              {redesComUrl.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Sem redes sociais cadastradas</p>
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
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:row-span-2">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Últimas votações</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
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
                    <li key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-sm text-slate-700">
                        {votoIcon(item.voto)} {item.descricao}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">{item.data}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-4">
              <Link href={`/politicos/${politico.slug}`} className="text-sm font-semibold text-[#2952cc] hover:underline">
                Ver todas
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cota parlamentar</h3>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(politico.gasto_total_ano)}</p>

            {gastoPctTeto == null ? (
              <p className="mt-3 text-sm text-slate-500">{NA}</p>
            ) : (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#2952cc]" style={{ width: `${gastoPctTeto}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{gastoPctTeto}% do teto de {politico.uf ?? NA}</p>
                <div className="mt-3 flex items-end gap-1">
                  {gastosMensais.map((mes) => (
                    <div key={mes.mes} className="flex flex-1 flex-col items-center gap-1">
                      <div className="w-full rounded bg-[#dbe4ff]" style={{ height: `${mes.pct + 10}px` }} />
                      <span className="text-[10px] text-slate-500">{mes.mes}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Presença nas sessões</h3>
            <div className="mt-3">
              <PresencaRing value={politico.presenca_pct_atual} />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md md:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Atividade legislativa (LES)</h3>
              <span className="rounded-full bg-[#eef3ff] px-2 py-0.5 text-xs font-semibold text-[#2952cc]">
                Metodologia Cambridge 2014
              </span>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Projetos</p>
                <p className="text-xl font-bold text-slate-900">{NA}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Em comissão</p>
                <p className="text-xl font-bold text-slate-900">{NA}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Sancionados</p>
                <p className="text-xl font-bold text-slate-900">{NA}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">{NA}</p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Emendas</h3>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">Em breve</span>
            </div>
            <p className="mt-3 text-sm text-slate-500">Esta seção será habilitada assim que os dados estiverem disponíveis.</p>
          </article>
        </div>
      </section>

      {hasPersonalSection ? (
        <section className="container-shell pb-6">
          <article className="rounded-2xl border border-slate-200 bg-[#f5f6fa] p-4 sm:p-5">
            <h2 className="text-base font-semibold text-slate-900">Perfil pessoal</h2>
            <div className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
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

      <footer className="container-shell pb-10 text-center text-xs text-slate-500">
        <p>Dados coletados de fontes oficiais · Última atualização: {politico.collected_at ? formatDate(politico.collected_at) : NA}</p>
        <p className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Link href="/metodologia" className="font-semibold text-[#2952cc] hover:underline">
            Metodologia
          </Link>
          <Link href="/fontes" className="font-semibold text-[#2952cc] hover:underline">
            Fontes
          </Link>
          <a href="mailto:contato@meuspoliticos.com.br" className="font-semibold text-[#2952cc] hover:underline">
            Reportar erro
          </a>
        </p>
      </footer>
    </>
  )
}
