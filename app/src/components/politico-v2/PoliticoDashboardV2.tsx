'use client'

import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Calendar, Info, Receipt, Share2, UserRound, Vote, Wallet } from 'lucide-react'

import { EmptyState } from '@/components/politico-v2/EmptyState'
import { ScoreRow } from '@/components/politico-v2/ScoreRow'
import { Button } from '@/components/ui/button'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'

type SocialLink = {
  plataforma: string | null
  url: string | null
}

type PoliticoDashboardV2Data = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  uf_nascimento: string | null
  sexo: string | null
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
  partidos: { sigla: string | null; nome: string | null; numero: number | null } | null
  redes_sociais: SocialLink[]
}

type Props = {
  politico: PoliticoDashboardV2Data
}

type VotoItem = {
  id: string
  descricao: string
  voto: 'sim' | 'nao' | 'abstencao'
  data: string
}

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  vice_presidente: 'Vice-presidente',
  governador: 'Governador',
  vice_governador: 'Vice-governador',
  senador: 'Senador',
  deputado_federal: 'Deputado Federal',
  deputado_estadual: 'Deputado Estadual',
  prefeito: 'Prefeito',
  vice_prefeito: 'Vice-prefeito',
  vereador: 'Vereador',
}

const CARGO_BADGE_CLASS: Record<string, string> = {
  presidente: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  vice_presidente: 'bg-purple-100 text-purple-800 border-purple-200',
  governador: 'bg-sky-100 text-sky-800 border-sky-200',
  vice_governador: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  senador: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  deputado_federal: 'bg-blue-100 text-blue-800 border-blue-200',
  deputado_estadual: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  prefeito: 'bg-amber-100 text-amber-800 border-amber-200',
  vice_prefeito: 'bg-orange-100 text-orange-800 border-orange-200',
  vereador: 'bg-rose-100 text-rose-800 border-rose-200',
}

const CEAP_TETO_UF: Record<string, number> = {
  AC: 57359.87,
  AL: 46968.18,
  AM: 56151.46,
  AP: 53972.72,
  BA: 51543.56,
  CE: 51052.44,
  DF: 41612.55,
  ES: 49474.84,
  GO: 48186.75,
  MA: 51543.56,
  MG: 50148.34,
  MS: 48186.75,
  MT: 50328.66,
  PA: 53359.38,
  PB: 50034.78,
  PE: 50347.21,
  PI: 50358.53,
  PR: 48186.75,
  RJ: 50034.78,
  RN: 51287.06,
  RO: 51850.45,
  RR: 53247.70,
  RS: 48186.75,
  SC: 48186.75,
  SE: 50503.14,
  SP: 48727.46,
  TO: 51406.33,
}

function formatDate(value: string | null) {
  if (!value) return '–'

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '–'

  return format(parsed, 'dd/MM/yyyy', { locale: ptBR })
}

function formatCurrency(value: number | null) {
  if (value == null) return '–'

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatOptionalNumber(value: number | null, suffix = '') {
  if (value == null) return '–'
  return `${Math.round(value)}${suffix}`
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function normalizePlatform(value: string | null) {
  return (value ?? '').toLowerCase().trim()
}

function socialButtonClass(platform: string) {
  if (platform.includes('twitter') || platform === 'x') {
    return 'border-black/15 bg-black text-white hover:bg-black/90'
  }

  if (platform.includes('instagram')) {
    return 'border-purple-200 bg-purple-600 text-white hover:bg-purple-700'
  }

  if (platform.includes('youtube')) {
    return 'border-red-200 bg-red-600 text-white hover:bg-red-700'
  }

  if (platform.includes('facebook')) {
    return 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700'
  }

  return 'border-slate-300 bg-slate-700 text-white hover:bg-slate-800'
}

function formatGabinetePhone(value: string | null) {
  if (!value) return '–'

  const normalized = value.trim()
  if (!normalized) return '–'
  if (normalized.startsWith('(61)')) return normalized
  if (normalized.startsWith('3215-')) return `(61) ${normalized}`

  const digits = normalized.replace(/\D/g, '')
  if (digits.length === 8) {
    return `(61) ${digits.slice(0, 4)}-${digits.slice(4)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  return normalized
}

function yearsInOffice(mandatoInicio: string | null) {
  if (!mandatoInicio) return { label: '–', year: '–' }

  const startDate = new Date(mandatoInicio)
  if (Number.isNaN(startDate.getTime())) return { label: '–', year: '–' }

  const now = new Date()
  const years = Math.max(0, now.getFullYear() - startDate.getFullYear())
  const suffix = years === 1 ? 'ano' : 'anos'

  return {
    label: `${years} ${suffix}`,
    year: String(startDate.getFullYear()),
  }
}

function profileFieldCount(politico: PoliticoDashboardV2Data) {
  const values = [
    politico.data_nascimento,
    politico.naturalidade,
    politico.uf_nascimento,
    politico.escolaridade,
    politico.ocupacao,
    politico.sexo,
    politico.mandato_inicio,
    politico.mandato_fim,
  ]

  return values.filter(Boolean).length
}

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
          {value == null ? '–' : `${percent}%`}
        </text>
      </svg>
      <div>
        <p className="text-sm text-slate-500">Média {value == null ? 'UF' : 'da UF'}: –%</p>
      </div>
    </div>
  )
}

function StatCard({
  title,
  value,
  subtitle,
  showCollectingHint = false,
}: {
  title: string
  value: string
  subtitle?: string
  showCollectingHint?: boolean
}) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold text-slate-900">{value}</p>
      <div className="mt-2 flex items-center gap-2">
        {subtitle ? <p className="text-xs text-slate-500">{subtitle}</p> : null}
        {showCollectingHint ? (
          <span title="Dados sendo coletados" className="inline-flex items-center text-slate-400">
            <Info className="size-3.5" aria-hidden="true" />
          </span>
        ) : null}
      </div>
    </article>
  )
}

function votoIcon(voto: VotoItem['voto']) {
  if (voto === 'sim') return '✅'
  if (voto === 'nao') return '❌'
  return '⚠️'
}

export function PoliticoDashboardV2({ politico }: Props) {
  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const classeFoto = classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replaceAll('_', ' ')
  const badgeCargo = CARGO_BADGE_CLASS[politico.cargo] ?? 'bg-slate-100 text-slate-700 border-slate-200'

  const partidoSigla = politico.partidos?.sigla?.toUpperCase() ?? 'Sem partido'
  const mandatoInfo = yearsInOffice(politico.mandato_inicio)
  const hasPersonalSection = profileFieldCount(politico) >= 2

  const redesComUrl = (politico.redes_sociais ?? []).filter((item) => item.url)
  const contatoEmail = politico.gabinete_email ?? politico.email
  const telefoneGabinete = formatGabinetePhone(politico.gabinete_telefone)
  const gabineteNome = politico.gabinete_nome ? `Gabinete ${politico.gabinete_nome}` : 'Gabinete –'

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

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <section className="bg-[#1a2b5e] text-white">
        <div className="container-shell py-6 sm:py-8">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20 bg-[#2952cc]">
                {politico.foto_url ? (
                  <Image
                    src={politico.foto_url}
                    alt={`Foto de ${nomeExibicao}`}
                    fill
                    className={`object-cover ${classeFoto}`}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl font-bold">{initials(nomeExibicao)}</div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">{nomeExibicao}</h1>
                <p className="mt-1 text-sm text-white/70 sm:text-base">{politico.nome_civil ?? 'Nome civil não disponível'}</p>

                <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className={`rounded-full border px-3 py-1 ${badgeCargo}`}>{cargoNome}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{partidoSigla}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{politico.uf ?? '–'}</span>
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Mandato desde {mandatoInfo.year}</span>
                </div>

                {(politico.naturalidade || politico.uf_nascimento || politico.escolaridade) && (
                  <p className="mt-3 text-sm text-white/80">
                    Nascido em {politico.naturalidade ?? '–'}/{politico.uf_nascimento ?? '–'} · {politico.escolaridade ?? '–'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button className="bg-[#2952cc] text-white hover:bg-[#3662e0]">
                <Bell className="size-4" />
                Acompanhar
              </Button>
              <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20">
                <UserRound className="size-4" />
                Comparar
              </Button>
              <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/20">
                <Share2 className="size-4" />
                Compartilhar
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="container-shell grid grid-cols-2 gap-4 py-4 sm:grid-cols-4">
          <StatCard
            title="Presença"
            value={formatOptionalNumber(politico.presenca_pct_atual, '%')}
            showCollectingHint
          />
          <StatCard title="Cota parlamentar" value={formatCurrency(politico.gasto_total_ano)} showCollectingHint />
          <StatCard title="Votações" value={formatOptionalNumber(politico.total_votacoes)} showCollectingHint />
          <StatCard title="Em exercício" value={mandatoInfo.label} subtitle={`desde ${mandatoInfo.year}`} />
        </div>
      </section>

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
                  {contatoEmail !== null && contatoEmail !== '–' ? (
                    <a href={`mailto:${contatoEmail}`} className="font-medium text-[#2952cc] hover:underline">
                      {contatoEmail}
                    </a>
                  ) : (
                    <span title="Dados sendo coletados">–</span>
                  )}
                </li>
                <li>📞 {telefoneGabinete}</li>
                <li>🏢 {gabineteNome} — Câmara dos Deputados, Brasília/DF</li>
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
              <Link href={`/politico/${politico.slug}`} className="text-sm font-semibold text-[#2952cc] hover:underline">
                Ver todas
              </Link>
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Cota parlamentar</h3>
            <p className="mt-2 text-2xl font-bold text-slate-900">{formatCurrency(politico.gasto_total_ano)}</p>

            {gastoPctTeto == null ? (
              <p className="mt-3 text-sm text-slate-500">Dados sendo coletados</p>
            ) : (
              <>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full rounded-full bg-[#2952cc]" style={{ width: `${gastoPctTeto}%` }} />
                </div>
                <p className="mt-2 text-xs text-slate-500">{gastoPctTeto}% do teto de {politico.uf ?? 'UF'}</p>
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
                <p className="text-xl font-bold text-slate-900">–</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Em comissão</p>
                <p className="text-xl font-bold text-slate-900">–</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Sancionados</p>
                <p className="text-xl font-bold text-slate-900">–</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-slate-500">Dados sendo coletados — Fase 2</p>
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
                <span className="font-medium">Nascimento:</span> {formatDate(politico.data_nascimento)} em {politico.naturalidade ?? '–'}/{politico.uf_nascimento ?? '–'}
              </p>
              <p>
                <span className="font-medium">Escolaridade:</span> {politico.escolaridade ?? '–'}
              </p>
              <p>
                <span className="font-medium">Ocupação:</span> {politico.ocupacao ?? '–'}
              </p>
              <p>
                <span className="font-medium">Sexo:</span>{' '}
                {politico.sexo === 'M' ? 'Masculino' : politico.sexo === 'F' ? 'Feminino' : '–'}
              </p>
              <p className="sm:col-span-2">
                <span className="font-medium">Mandato:</span> desde {formatDate(politico.mandato_inicio)} até {politico.mandato_fim ? formatDate(politico.mandato_fim) : 'presente'}
              </p>
            </div>
          </article>
        </section>
      ) : null}

      <footer className="container-shell pb-10 text-center text-xs text-slate-500">
        <p>Dados coletados de fontes oficiais · Última atualização: {politico.collected_at ? formatDate(politico.collected_at) : '–'}</p>
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
    </main>
  )
}
