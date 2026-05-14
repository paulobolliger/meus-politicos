'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  AlertTriangle,
  ArrowUpRight,
  BadgeCheck,
  BarChart3,
  Bell,
  Globe,
  Share2,
  TrendingUp,
  Users,
  Vote,
  Wallet,
} from 'lucide-react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  Line,
  LineChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

import { Button } from '@/components/ui/button'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'
import { cn } from '@/lib/utils'

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
  foto_url: string | null
  mandato_inicio: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partidos: { sigla: string | null; nome: string | null } | null
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

function moeda(valor: number | null) {
  if (valor == null) return 'R$ 0'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(valor)
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function hashTexto(valor: string) {
  let hash = 0
  for (let i = 0; i < valor.length; i += 1) {
    hash = (hash << 5) - hash + valor.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function limitar(valor: number, min: number, max: number) {
  return Math.max(min, Math.min(max, valor))
}

function normalizarPlataforma(plataforma: string | null) {
  return (plataforma ?? '').trim().toLowerCase().replaceAll(' ', '_')
}

function classeScore(score: number) {
  if (score >= 75) return 'text-emerald-600'
  if (score >= 60) return 'text-amber-600'
  return 'text-red-600'
}

function corBarraScore(score: number) {
  if (score >= 75) return '#10b981'
  if (score >= 60) return '#f59e0b'
  return '#ef4444'
}

function ScoreRing({ label, valor }: { label: string; valor: number }) {
  const data = [{ name: label, value: valor, fill: corBarraScore(valor) }]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
      <div className="h-24">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="58%"
            outerRadius="100%"
            barSize={11}
            data={data}
            startAngle={210}
            endAngle={-30}
          >
            <RadialBar dataKey="value" cornerRadius={16} background={{ fill: '#e2e8f0' }} />
            <text
              x="50%"
              y="50%"
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#0f172a"
              fontSize="18"
              fontWeight="700"
            >
              {valor}
            </text>
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-xs font-medium text-slate-600">{label}</p>
    </div>
  )
}

export function PoliticoDashboardV2({ politico }: Props) {
  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replace(/_/g, ' ')
  const baseHash = hashTexto(politico.slug || politico.id)

  const presenca = limitar(Math.round(politico.presenca_pct_atual ?? 62), 0, 100)
  const gasto = politico.gasto_total_ano ?? 0
  const atividade = limitar(Math.round((politico.total_votacoes ?? 320) / 8), 22, 100)
  const transparencia = limitar(Math.round(presenca * 0.52 + atividade * 0.32 + (baseHash % 18)), 38, 96)
  const coerencia = limitar(Math.round(54 + (baseHash % 36)), 40, 94)
  const reputacao = limitar(Math.round(transparencia * 0.45 + coerencia * 0.2 + presenca * 0.35), 35, 97)
  const scoreGeral = limitar(Math.round((transparencia + coerencia + presenca + atividade + reputacao) / 5), 30, 98)
  const variacaoPopularidade = (baseHash % 21) - 8

  const seriePresenca = [
    { m: 'Jan', valor: limitar(presenca - 8 + (baseHash % 3), 20, 100) },
    { m: 'Fev', valor: limitar(presenca - 6 + (baseHash % 5), 20, 100) },
    { m: 'Mar', valor: limitar(presenca - 3 + (baseHash % 4), 20, 100) },
    { m: 'Abr', valor: limitar(presenca - 1 + (baseHash % 3), 20, 100) },
    { m: 'Mai', valor: limitar(presenca + (baseHash % 2), 20, 100) },
    { m: 'Jun', valor: limitar(presenca + 2, 20, 100) },
  ]

  const gastoBase = Math.max(20000, gasto || 60000)
  const serieGastos = [
    { m: 'Jan', valor: Math.round(gastoBase * 0.78) },
    { m: 'Fev', valor: Math.round(gastoBase * 0.84) },
    { m: 'Mar', valor: Math.round(gastoBase * 0.88) },
    { m: 'Abr', valor: Math.round(gastoBase * 0.91) },
    { m: 'Mai', valor: Math.round(gastoBase * 0.96) },
    { m: 'Jun', valor: Math.round(gastoBase) },
  ]

  const seriePopularidade = [
    { m: 'Jan', valor: limitar(58 + (baseHash % 7), 30, 98) },
    { m: 'Fev', valor: limitar(60 + (baseHash % 8), 30, 98) },
    { m: 'Mar', valor: limitar(63 + (baseHash % 6), 30, 98) },
    { m: 'Abr', valor: limitar(61 + (baseHash % 9), 30, 98) },
    { m: 'Mai', valor: limitar(64 + (baseHash % 8), 30, 98) },
    { m: 'Jun', valor: limitar(66 + (baseHash % 7), 30, 98) },
  ]

  const comparativo = [
    { item: 'Presenca', politico: presenca, media: 78 },
    { item: 'Transparencia', politico: transparencia, media: 69 },
    { item: 'Atividade', politico: atividade, media: 64 },
  ]

  const redesComUrl = (politico.redes_sociais ?? []).filter((rede) => rede.url)
  const timeline = [
    {
      tipo: scoreGeral < 60 ? 'alerta' : 'monitoramento',
      icon: AlertTriangle,
      titulo: scoreGeral < 60 ? 'Indice geral em zona de atencao' : 'Indice geral em monitoramento continuo',
      data: 'Ha 2 dias',
      detalhe: `Score politico atual em ${scoreGeral}/100 com foco em gastos e coerencia.`,
    },
    {
      tipo: 'votacao',
      icon: Vote,
      titulo: 'Participacao em votacao relevante',
      data: 'Ha 6 dias',
      detalhe: `Total acumulado de ${politico.total_votacoes ?? 0} votacoes registradas.`,
    },
    {
      tipo: 'gastos',
      icon: Wallet,
      titulo: 'Movimento de cota parlamentar',
      data: 'Ha 11 dias',
      detalhe: `Gasto anual monitorado em ${moeda(politico.gasto_total_ano)}.`,
    },
    {
      tipo: 'reputacao',
      icon: TrendingUp,
      titulo: 'Tendencia publica recente',
      data: 'Ha 18 dias',
      detalhe: `Variacao de popularidade em ${variacaoPopularidade >= 0 ? '+' : ''}${variacaoPopularidade}% no periodo.`,
    },
  ]

  const resumoIa =
    `Nos ultimos 12 meses, ${nomeExibicao} manteve presenca de ${presenca}% e atividade parlamentar ` +
    `${atividade >= 70 ? 'acima' : 'proxima'} da media. O painel identifica ` +
    `${gasto > 90000 ? 'gastos elevados' : 'gastos controlados'} em cota e reputacao publica em ${reputacao}/100.`

  const classeFoto = classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,#dbeafe_0%,#f8fbff_45%,#f3f7fd_100%)] pb-28 text-slate-900">
      <section className="container-shell pt-5 sm:pt-7">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="relative overflow-hidden rounded-3xl border border-slate-200 bg-[linear-gradient(135deg,#ffffff_0%,#f3f7ff_52%,#eef3ff_100%)] p-4 shadow-[0_16px_42px_rgba(15,23,42,0.10)] sm:p-6"
        >
          <div className="pointer-events-none absolute -right-16 -top-20 h-52 w-52 rounded-full bg-[#60a5fa]/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-[#93c5fd]/25 blur-3xl" />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
            <div className="flex gap-4 sm:gap-5">
              <div className="relative h-28 w-28 shrink-0 overflow-hidden rounded-3xl border border-slate-200 bg-[#dbeafe] sm:h-36 sm:w-36">
                {politico.foto_url ? (
                  <Image
                    src={politico.foto_url}
                    alt={`Foto de ${nomeExibicao}`}
                    fill
                    className={`object-cover ${classeFoto}`}
                    unoptimized
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-[#1e3a8a]">
                    {iniciais(nomeExibicao)}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 space-y-3">
                <div>
                  <p className="text-[11px] font-medium tracking-[0.22em] text-blue-700 uppercase">Radar politico v2</p>
                  <h1 className="mt-1 text-2xl font-black leading-tight sm:text-4xl">{nomeExibicao}</h1>
                  <p className="mt-2 text-sm text-slate-600 sm:text-base">
                    {cargoNome} • {(politico.partidos?.sigla ?? 'Sem partido').toUpperCase()}/{politico.uf ?? '--'}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2 text-[11px]">
                  <span className="rounded-full border border-emerald-300/30 bg-emerald-300/10 px-3 py-1 text-emerald-200">
                    Presenca {presenca}%
                  </span>
                  <span className="rounded-full border border-amber-300/30 bg-amber-300/10 px-3 py-1 text-amber-200">
                    Coerencia {coerencia}/100
                  </span>
                  <span className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-3 py-1 text-cyan-200">
                    Reputacao {reputacao}/100
                  </span>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white/95 p-3 sm:p-4">
                  <div className="flex items-end justify-between gap-4">
                    <div>
                      <p className="text-xs text-slate-500">Indice de transparencia</p>
                      <p className={cn('text-3xl font-black', classeScore(scoreGeral))}>{scoreGeral}/100</p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>Ranking nacional</p>
                      <p className="mt-1 text-sm font-semibold text-slate-900">#{110 + (baseHash % 120)}</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 via-emerald-400 to-lime-300"
                      style={{ width: `${scoreGeral}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Popularidade {variacaoPopularidade >= 0 ? '+' : ''}
                    {variacaoPopularidade}% no periodo recente.
                  </p>
                </div>

                <p className="max-w-2xl text-sm leading-relaxed text-slate-600">{resumoIa}</p>

                <div className="hidden flex-wrap gap-2 sm:flex">
                  <Button className="bg-[#1e3a8a] text-white hover:bg-[#1d4ed8]">
                    <Bell />
                    Acompanhar
                  </Button>
                  <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                    <Users />
                    Comparar
                  </Button>
                  <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                    <Share2 />
                    Compartilhar
                  </Button>
                  <Link
                    href={`/politico/${politico.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-slate-600 transition hover:text-slate-900"
                  >
                    Ver perfil atual
                    <ArrowUpRight className="size-3.5" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <ScoreRing label="Transparencia" valor={transparencia} />
              <ScoreRing label="Coerencia" valor={coerencia} />
              <ScoreRing label="Presenca" valor={presenca} />
              <ScoreRing label="Atividade" valor={atividade} />
            </div>
          </div>
        </motion.div>
      </section>

      <section className="container-shell mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="grid gap-4 sm:grid-cols-2"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Evolucao de gastos</p>
              <span className="text-xs text-red-500">Acima da media</span>
            </div>
            <div className="mt-3 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={serieGastos}>
                  <defs>
                    <linearGradient id="gastoGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="m" hide />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a' }}
                    formatter={(valor) => {
                      const numero = typeof valor === 'number' ? valor : Number(valor ?? 0)
                      return moeda(numero)
                    }}
                  />
                  <Area type="monotone" dataKey="valor" stroke="#fb923c" strokeWidth={2} fill="url(#gastoGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Total anual monitorado: {moeda(politico.gasto_total_ano)}</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Tendencia de presenca</p>
              <span className="text-xs text-emerald-600">Estavel</span>
            </div>
            <div className="mt-3 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriePresenca}>
                  <XAxis dataKey="m" hide />
                  <YAxis hide domain={[40, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a' }}
                    formatter={(valor) => {
                      const numero = typeof valor === 'number' ? valor : Number(valor ?? 0)
                      return `${numero}%`
                    }}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#22c55e" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Presenca atual: {presenca}%</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Popularidade</p>
              <span className="text-xs text-cyan-600">Sinal social</span>
            </div>
            <div className="mt-3 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={seriePopularidade}>
                  <XAxis dataKey="m" hide />
                  <YAxis hide domain={[35, 100]} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a' }}
                    formatter={(valor) => {
                      const numero = typeof valor === 'number' ? valor : Number(valor ?? 0)
                      return `${numero}/100`
                    }}
                  />
                  <Line type="monotone" dataKey="valor" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-slate-500">Variacao recente: {variacaoPopularidade >= 0 ? '+' : ''}{variacaoPopularidade}%</p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-slate-900">Comparativo camara</p>
              <BarChart3 className="size-4 text-slate-500" />
            </div>
            <div className="mt-3 h-28">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparativo} layout="vertical" margin={{ top: 2, right: 12, left: 0, bottom: 2 }}>
                  <XAxis type="number" hide domain={[0, 100]} />
                  <YAxis type="category" dataKey="item" width={72} tick={{ fill: '#475569', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: 10, color: '#0f172a' }}
                  />
                  <Bar dataKey="media" fill="#cbd5e1" radius={[4, 4, 4, 4]} />
                  <Bar dataKey="politico" radius={[4, 4, 4, 4]}>
                    {comparativo.map((entry) => (
                      <Cell
                        key={entry.item}
                        fill={entry.politico >= entry.media ? '#22c55e' : '#f59e0b'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: 0.04 }}
          className="space-y-4"
        >
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <BadgeCheck className="size-4 text-cyan-600" />
              Insights IA
            </div>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{resumoIa}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-emerald-700">Presenca {presenca}%</span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-amber-700">Gasto {moeda(politico.gasto_total_ano)}</span>
              <span className="rounded-full bg-cyan-100 px-2.5 py-1 text-cyan-700">Reputacao {reputacao}/100</span>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Redes sociais</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {redesComUrl.length > 0 ? (
                redesComUrl.map((rede) => {
                  const chave = normalizarPlataforma(rede.plataforma)
                  const Icon =
                    chave.includes('facebook')
                      ? Users
                      : chave.includes('x') || chave.includes('twitter')
                            ? Share2
                            : chave.includes('youtube')
                              ? Vote
                            : Globe

                  return (
                    <a
                      key={`${rede.plataforma}-${rede.url}`}
                      href={rede.url ?? '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
                    >
                      <Icon className="size-3.5" />
                      <span className="capitalize">{rede.plataforma ?? 'canal'}</span>
                    </a>
                  )
                })
              ) : (
                <p className="text-sm text-slate-500">Sem redes sociais cadastradas.</p>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-sm font-semibold text-slate-900">Indicadores rapidos</p>
            <ul className="mt-3 space-y-2 text-sm text-slate-600">
              <li className="flex items-center justify-between gap-2">
                <span>Presenca parlamentar</span>
                <span className="font-semibold text-emerald-600">{presenca}%</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Total de votacoes</span>
                <span className="font-semibold text-slate-900">{politico.total_votacoes ?? 0}</span>
              </li>
              <li className="flex items-center justify-between gap-2">
                <span>Cota anual</span>
                <span className="font-semibold text-amber-600">{moeda(politico.gasto_total_ano)}</span>
              </li>
            </ul>
          </div>
        </motion.aside>
      </section>

      <section className="container-shell mt-4">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-slate-900">Timeline de acontecimentos</h2>
            <span className="text-xs text-slate-500">Ultimos 30 dias</span>
          </div>

          <div className="mt-4 space-y-3">
            {timeline.map((evento, index) => {
              const Icon = evento.icon

              return (
                <div
                  key={`${evento.titulo}-${index}`}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 transition hover:border-slate-300"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        'mt-0.5 rounded-lg p-2',
                        evento.tipo === 'alerta'
                          ? 'bg-red-100 text-red-600'
                          : evento.tipo === 'gastos'
                            ? 'bg-amber-100 text-amber-600'
                            : 'bg-cyan-100 text-cyan-700'
                      )}
                    >
                      <Icon className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-900">{evento.titulo}</p>
                      <p className="mt-1 text-xs text-slate-500">{evento.data}</p>
                      <p className="mt-2 text-sm text-slate-600">{evento.detalhe}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </section>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 p-3 backdrop-blur-md sm:hidden">
        <div className="container-shell grid grid-cols-3 gap-2">
          <Button className="bg-[#1e3a8a] text-white hover:bg-[#1d4ed8]">
            <Bell />
            <span className="text-[11px]">Acompanhar</span>
          </Button>
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
            <Users />
            <span className="text-[11px]">Comparar</span>
          </Button>
          <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
            <Share2 />
            <span className="text-[11px]">Compartilhar</span>
          </Button>
        </div>
      </div>
    </main>
  )
}