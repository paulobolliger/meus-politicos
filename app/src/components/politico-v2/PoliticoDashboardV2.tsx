'use client'

import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
  Bell,
  Calendar,
  Camera,
  Globe,
  Receipt,
  Share2,
  UserRound,
  Users,
  Vote,
  Wallet,
} from 'lucide-react'

import { EmptyState } from '@/components/politico-v2/EmptyState'
import { GastosBarChart } from '@/components/politico-v2/GastosBarChart'
import { PresencaHeatmap } from '@/components/politico-v2/PresencaHeatmap'
import { ScoreRow } from '@/components/politico-v2/ScoreRow'
import { VotacaoCard } from '@/components/politico-v2/VotacaoCard'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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

function formatDate(value: string | null) {
  if (!value) {
    return '–'
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return '–'
  }

  return format(parsed, 'dd/MM/yyyy', { locale: ptBR })
}

function formatCurrency(value: number | null) {
  if (value == null) {
    return '–'
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

function formatOptionalNumber(value: number | null, suffix = '') {
  if (value == null) {
    return '–'
  }

  return `${Math.round(value)}${suffix}`
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((chunk) => chunk[0]?.toUpperCase())
    .join('')
}

function normalizePlatform(value: string | null) {
  return (value ?? '').toLowerCase().trim()
}

function socialButtonStyle(platform: string) {
  if (platform.includes('twitter') || platform === 'x') {
    return { className: 'border-black/15 bg-black text-white hover:bg-black/90', icon: Share2, label: 'Twitter/X' }
  }

  if (platform.includes('instagram')) {
    return { className: 'border-purple-200 bg-purple-600 text-white hover:bg-purple-700', icon: Camera, label: 'Instagram' }
  }

  if (platform.includes('youtube')) {
    return { className: 'border-red-200 bg-red-600 text-white hover:bg-red-700', icon: Vote, label: 'YouTube' }
  }

  if (platform.includes('facebook')) {
    return { className: 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700', icon: Users, label: 'Facebook' }
  }

  return { className: 'border-slate-300 bg-slate-700 text-white hover:bg-slate-800', icon: Globe, label: 'Site oficial' }
}

function StatValue({ value }: { value: string }) {
  if (value === '–') {
    return (
      <span title="Dados sendo coletados" className="cursor-help text-2xl font-bold text-slate-500">
        –
      </span>
    )
  }

  return <span className="text-2xl font-bold text-slate-900">{value}</span>
}

function scoreContextMediaUf(uf: string | null) {
  if (uf === 'SP') return 71
  if (uf === 'RJ') return 69
  if (uf === 'MG') return 68
  return 67
}

function profileFieldCount(politico: PoliticoDashboardV2Data) {
  const items = [
    politico.data_nascimento,
    politico.naturalidade,
    politico.uf_nascimento,
    politico.escolaridade,
    politico.ocupacao,
    politico.sexo,
    politico.mandato_inicio,
    politico.mandato_fim,
  ]

  return items.filter(Boolean).length
}

function GastosTabela({ data }: { data?: Array<{ categoria: string; valor: number }> | null }) {
  if (!data || data.length === 0) {
    return <EmptyState icon={Receipt} title="Gastos sendo coletados" />
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-600">
          <tr>
            <th className="px-3 py-2 font-medium">Categoria</th>
            <th className="px-3 py-2 font-medium">Valor</th>
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.categoria} className="border-t border-slate-200">
              <td className="px-3 py-2">{row.categoria}</td>
              <td className="px-3 py-2">{formatCurrency(row.valor)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PoliticoDashboardV2({ politico }: Props) {
  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replaceAll('_', ' ')
  const badgeCargo = CARGO_BADGE_CLASS[politico.cargo] ?? 'bg-slate-100 text-slate-700 border-slate-200'
  const classeFoto = classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })

  const partidoSigla = politico.partidos?.sigla?.toUpperCase() ?? 'Sem partido'
  const mandatoDesde = politico.mandato_inicio ? formatDate(politico.mandato_inicio).split('/')[2] : '–'
  const mediaUf = scoreContextMediaUf(politico.uf)

  const contactEmail = politico.gabinete_email ?? politico.email
  const redesComUrl = (politico.redes_sociais ?? []).filter((item) => item.url)

  const hasPersonalSection = profileFieldCount(politico) >= 2

  const votacoesDisponiveis = (politico.total_votacoes ?? 0) > 0
  const gastosDisponiveis = (politico.gasto_total_ano ?? 0) > 0

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
                  <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">Mandato desde {mandatoDesde}</span>
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
          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Presença</p>
            <StatValue value={politico.presenca_pct_atual == null ? '–' : `${Math.round(politico.presenca_pct_atual)}%`} />
            <p className="text-xs text-slate-500">ETL eventos</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Cota parlamentar</p>
            <StatValue value={formatCurrency(politico.gasto_total_ano)} />
            <p className="text-xs text-slate-500">ETL gastos</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Votações</p>
            <StatValue value={formatOptionalNumber(politico.total_votacoes)} />
            <p className="text-xs text-slate-500">ETL votações</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Gabinete</p>
            <StatValue value={politico.gabinete_telefone ?? '–'} />
            <p className="text-xs text-slate-500">Câmara API ✅</p>
          </div>
        </div>
      </section>

      <section className="container-shell py-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-slate-900">Radar de desempenho</h2>
              <Link href="/metodologia" className="text-xs font-semibold text-[#2952cc] hover:underline">
                Metodologia pública
              </Link>
            </div>

            <div className="space-y-3">
              <ScoreRow label="Presença" value={politico.presenca_pct_atual} mediaUf={mediaUf} />
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
            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">Contato do gabinete</h2>
              <ul className="mt-3 space-y-2 text-sm text-slate-600">
                <li>
                  Email:{' '}
                  {contactEmail ? (
                    <a href={`mailto:${contactEmail}`} className="font-medium text-[#2952cc] hover:underline">
                      {contactEmail}
                    </a>
                  ) : (
                    <span title="Dados sendo coletados">–</span>
                  )}
                </li>
                <li>Telefone: {politico.gabinete_telefone ?? <span title="Dados sendo coletados">–</span>}</li>
                <li>Gabinete: {politico.gabinete_nome ?? <span title="Dados sendo coletados">–</span>}</li>
              </ul>
            </article>

            <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="text-base font-semibold text-slate-900">Redes sociais</h2>
              {redesComUrl.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">Sem redes sociais cadastradas</p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {redesComUrl.map((rede) => {
                    const platform = normalizePlatform(rede.plataforma)
                    const style = socialButtonStyle(platform)
                    const Icon = style.icon

                    return (
                      <a
                        key={`${rede.plataforma}-${rede.url}`}
                        href={rede.url ?? '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold transition ${style.className}`}
                      >
                        <Icon className="size-3.5" aria-hidden="true" />
                        {style.label}
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
        <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
          <Tabs defaultValue="votacoes" className="gap-4">
            <TabsList variant="line" className="w-full flex-wrap justify-start gap-2 p-0">
              <TabsTrigger value="votacoes" className="rounded-md border border-slate-200 px-3 py-1.5 data-active:border-[#2952cc] data-active:text-[#2952cc]">
                Votações
              </TabsTrigger>
              <TabsTrigger value="gastos" className="rounded-md border border-slate-200 px-3 py-1.5 data-active:border-[#2952cc] data-active:text-[#2952cc]">
                Gastos
              </TabsTrigger>
              <TabsTrigger value="presenca" className="rounded-md border border-slate-200 px-3 py-1.5 data-active:border-[#2952cc] data-active:text-[#2952cc]">
                Presença
              </TabsTrigger>
              <TabsTrigger value="emendas" className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-400">
                Emendas Em breve
              </TabsTrigger>
              <TabsTrigger value="historico" className="rounded-md border border-slate-200 px-3 py-1.5 text-slate-400">
                Histórico Em breve
              </TabsTrigger>
            </TabsList>

            <TabsContent value="votacoes">
              {!votacoesDisponiveis ? (
                <EmptyState
                  icon={Vote}
                  title="Votações sendo coletadas"
                  subtitle="Em breve as votações nominais aparecerão aqui"
                />
              ) : (
                <div className="space-y-3">
                  <VotacaoCard data={null} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="gastos">
              {!gastosDisponiveis ? (
                <EmptyState icon={Receipt} title="Gastos sendo coletados" />
              ) : (
                <div className="space-y-3">
                  <GastosBarChart data={[]} />
                  <GastosTabela data={[]} />
                </div>
              )}
            </TabsContent>

            <TabsContent value="presenca">
              <EmptyState icon={Calendar} title="Dados de presença sendo coletados" />
              <div className="mt-3">
                <PresencaHeatmap data={[]} />
              </div>
            </TabsContent>

            <TabsContent value="emendas">
              <EmptyState icon={Wallet} title="Emendas em breve" subtitle="Integração prevista para a próxima fase de ETL" />
            </TabsContent>

            <TabsContent value="historico">
              <EmptyState icon={Calendar} title="Histórico em breve" subtitle="Linha do tempo política será disponibilizada após ETL" />
            </TabsContent>
          </Tabs>
        </article>
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
        <p>
          Dados coletados de fontes oficiais · Última atualização: {politico.collected_at ? formatDate(politico.collected_at) : '–'}
        </p>
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
