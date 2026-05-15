import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowUpRight,
  BadgeCheck,
  Database,
  FileSearch,
  Globe2,
  MapPin,
  RefreshCw,
  ShieldCheck,
} from "lucide-react"

export const metadata: Metadata = {
  title: "Como funciona",
  description:
    "Entenda como o Meus Politicos coleta, organiza e apresenta dados publicos de fontes oficiais.",
}

const fontes = [
  "Câmara dos Deputados: votações, gastos de gabinete, presenças e projetos de lei",
  "Senado Federal: votações, discursos e comissões",
  "TSE: histórico de candidaturas, bens declarados e financiamento de campanha",
  "Portal da Transparência: emendas parlamentares, viagens e contratos",
  "IBGE: dados geográficos para cruzar representantes com municípios",
  "Diário Oficial da União: nomeações, decretos e atos oficiais",
]

const apresentacao = [
  {
    icon: FileSearch,
    title: "Linguagem simples",
    description:
      "Ementas técnicas e registros complexos são apresentados em português acessível. A versão original permanece disponível para verificação.",
  },
  {
    icon: ShieldCheck,
    title: "Sem opinião",
    description:
      "Não dizemos se uma votação foi boa ou ruim. Mostramos como o político votou e deixamos você concluir.",
  },
  {
    icon: BadgeCheck,
    title: "Contexto",
    description:
      "Cada número deve vir acompanhado de comparação relevante: média do partido, média do estado ou média nacional.",
  },
  {
    icon: RefreshCw,
    title: "Atualização contínua",
    description:
      "Os dados são coletados regularmente para que novas votações, gastos e atos oficiais apareçam com agilidade.",
  },
]

export default function ComoFuncionaPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-[var(--bg)] to-[var(--panel)]">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-[color:var(--brand-2)]/8 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-20">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-emerald-400" />
              <span className="mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">
                Metodologia da plataforma
              </span>
            </div>

            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Como funciona
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--ink-3)] sm:text-lg">
                Coletamos dados diretamente das fontes oficiais do governo brasileiro e os apresentamos de forma
                simples, organizada e neutra, sem filtro editorial e sem agenda política.
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Se você quer a visão filosófica e o posicionamento público do projeto, leia o{' '}
                <Link href="/manifesto" className="font-semibold text-[var(--brand-2)] hover:underline">
                  manifesto
                </Link>
                . Se quer entender a proposta institucional em linguagem mais curta, veja{' '}
                <Link href="/sobre" className="font-semibold text-[var(--brand-2)] hover:underline">
                  sobre
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-12 sm:py-16">
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="mono text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-2)]">Base filosófica</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                A metodologia existe para sustentar um posicionamento maior.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-3)] sm:text-base">
                O manifesto define por que existimos, o que defendemos e o que não somos. Esta página mostra como isso
                se traduz em coleta, curadoria e apresentação de dados.
              </p>
            </div>

            <Link
              href="/manifesto"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-2)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              Ler manifesto
              <ArrowUpRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      <section className="container-shell py-12 sm:py-16">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] text-[var(--brand-2)]">
              <Database className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Fontes oficiais</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">
              As informações existem, mas estão espalhadas em sistemas diferentes e formatos técnicos. O Meus
              Políticos organiza essas bases para tornar a consulta mais acessível ao cidadão.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
            <ul className="grid gap-3">
              {fontes.map((fonte) => (
                <li key={fonte} className="flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3">
                  <Globe2 className="mt-0.5 size-4 shrink-0 text-[var(--brand-2)]" aria-hidden="true" />
                  <span className="text-sm leading-6 text-slate-700">{fonte}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4">
              <Link href="/fontes" className="font-semibold text-[var(--brand-2)] hover:underline">Ver todas as fontes com links oficiais →</Link>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)] py-12 sm:py-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Como apresentamos os dados
            </h2>
            <p className="mt-2 text-sm leading-6 text-[var(--ink-3)]">
              O objetivo é reduzir ruído, preservar verificabilidade e dar contexto para que cada pessoa forme sua
              própria interpretação.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {apresentacao.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
                  <div className="flex gap-4">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] text-[var(--brand-2)]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold tracking-tight text-slate-950">{item.title}</h3>
                      <p className="mt-1 text-sm leading-6 text-[var(--ink-3)]">{item.description}</p>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="container-shell py-12 sm:py-16">
        <div className="rounded-2xl border border-[var(--line)] bg-linear-to-br from-slate-950 via-[#11244d] to-slate-900 p-6 text-white shadow-[0_24px_60px_-44px_rgba(15,23,42,0.9)] sm:p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
                <MapPin className="size-4 text-[#9fb7ff]" aria-hidden="true" />
                  <span className="mono text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                  Quem me representa?
                </span>
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Digite seu CEP e descubra seus representantes políticos.
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/68 sm:text-base">
                A plataforma cruza dados geográficos e cargos públicos para ajudar você a identificar representantes e
                consultar o histórico de cada um.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Link
                href="/manifesto"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Ler manifesto
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="https://app.meuspoliticos.com.br"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-2)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Ver meus representantes
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

