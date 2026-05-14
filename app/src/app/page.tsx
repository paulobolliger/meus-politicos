import Link from "next/link"
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Building2,
  Database,
  FileSearch,
  Landmark,
  MapPin,
  ReceiptText,
  ShieldCheck,
  Users,
  Vote,
} from "lucide-react"

import { CepSearch } from "@/components/home/CepSearch"
import { SearchBar } from "@/components/home/SearchBar"

const coverage = [
  {
    title: "Deputados federais",
    count: "513",
    status: "Disponível",
    href: "/busca?cargo=deputado_federal",
    active: true,
  },
  {
    title: "Senadores",
    count: "81",
    status: "Disponível",
    href: "/busca?cargo=senador",
    active: true,
  },
  {
    title: "Governadores",
    count: "27",
    status: "Em preparação",
    href: "",
    active: false,
  },
  {
    title: "Municípios via CEP",
    count: "5.570",
    status: "Consulta ativa",
    href: "/meu-estado",
    active: true,
  },
]

const principles = [
  {
    icon: Landmark,
    title: "Independência institucional",
    description: "A plataforma não representa governos, partidos, candidaturas ou campanhas eleitorais.",
  },
  {
    icon: Database,
    title: "Dados públicos organizados",
    description: "Informações oficiais são estruturadas para consulta clara, rastreável e fácil de acompanhar.",
  },
  {
    icon: ShieldCheck,
    title: "Leitura cívica responsável",
    description: "A experiência prioriza neutralidade, contexto e transparência em vez de opinião política.",
  },
]

const intelligenceAreas = [
  {
    icon: Users,
    title: "Perfis públicos",
    description: "Identificação, cargo, partido, UF e informações institucionais de representantes.",
    status: "Disponível",
  },
  {
    icon: Activity,
    title: "Presença",
    description: "Indicadores para acompanhar participação e atividade parlamentar ao longo do mandato.",
    status: "Em expansão",
  },
  {
    icon: ReceiptText,
    title: "Gastos",
    description: "Organização de despesas públicas para facilitar análise e comparação cívica.",
    status: "Em coleta",
  },
  {
    icon: Vote,
    title: "Votações",
    description: "Registro de decisões relevantes para entender posicionamentos e histórico público.",
    status: "Em breve",
  },
  {
    icon: FileSearch,
    title: "Fontes oficiais",
    description: "Referências institucionais preservadas para fortalecer confiança e auditabilidade.",
    status: "Planejado",
  },
  {
    icon: BadgeCheck,
    title: "Acompanhamento pessoal",
    description: "Conta para seguir políticos e centralizar atualizações relevantes no seu painel.",
    status: "Disponível",
  },
]

export default function Home() {
  return (
    <main className="bg-[#f5f6fa] font-sans">
      <section className="relative overflow-hidden border-b border-slate-200 bg-linear-to-b from-white via-slate-50 to-[#f5f6fa]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute right-[-8rem] top-16 h-80 w-80 rounded-full bg-[#2952cc]/8 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-18 lg:py-22">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-16">
            <div className="max-w-3xl space-y-8">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                  <span className="inline-block size-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Plataforma independente de transparência cívica
                  </span>
                </div>

                <div className="space-y-5">
                  <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    Entenda quem representa você. Acompanhe com dados públicos.
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
                    Organizamos informações oficiais sobre políticos, cargos, presença, gastos e atividade pública em
                    uma experiência simples, neutra e rastreável.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/busca"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2952cc] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] transition hover:bg-[#2349bb]"
                >
                  Explorar políticos
                </Link>
                <Link
                  href="/meu-estado"
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
                >
                  Ver meus representantes
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.42)] sm:p-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Comece pela busca pública</h2>
                <p className="text-sm leading-6 text-slate-600">
                  Pesquise por nome ou descubra representantes vinculados ao seu estado.
                </p>
              </div>

              <div className="mt-5 space-y-5">
                <div className="[&_button]:shrink-0 [&_input]:border-slate-300">
                  <SearchBar />
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <div className="h-px flex-1 bg-slate-200" />
                  <span>ou</span>
                  <div className="h-px flex-1 bg-slate-200" />
                </div>

                <div className="[&_button]:shrink-0 [&_input]:border-slate-300">
                  <CepSearch />
                </div>
              </div>

              <p className="mt-5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-600">
                Seu CEP é usado apenas para identificar localidade e representantes. Ele não é armazenado.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6fa] py-12 sm:py-16">
        <div className="container-shell">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Cobertura atual</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                A plataforma cresce por fases para preservar qualidade dos dados e consistência das fontes.
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {coverage.map((item) => {
              const content = (
                <article className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
                      <Building2 className="size-5" aria-hidden="true" />
                    </div>
                    <span
                      className={
                        item.active
                          ? "rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700"
                          : "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600"
                      }
                    >
                      {item.status}
                    </span>
                  </div>
                  <p className="mt-5 text-sm font-medium text-slate-600">{item.title}</p>
                  <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{item.count}</p>
                </article>
              )

              return item.active && item.href ? (
                <Link key={item.title} href={item.href} aria-label={`Abrir ${item.title}`}>
                  {content}
                </Link>
              ) : (
                <div key={item.title}>{content}</div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white py-12 sm:py-16">
        <div className="container-shell">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div className="max-w-xl">
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Dados públicos, sem opinião.
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600 sm:text-base">
                O Meus Políticos foi desenhado para transformar bases oficiais em uma leitura cívica mais clara, com
                foco em neutralidade, rastreabilidade e responsabilidade institucional.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
              {principles.map((item) => {
                const Icon = item.icon

                return (
                  <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex gap-4">
                      <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
                        <Icon className="size-5" aria-hidden="true" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold tracking-tight text-slate-950">{item.title}</h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600">{item.description}</p>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6fa] py-12 sm:py-16">
        <div className="container-shell">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              O que você poderá acompanhar
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A plataforma organiza diferentes camadas de informação pública para apoiar acompanhamento contínuo.
            </p>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {intelligenceAreas.map((item) => {
              const Icon = item.icon

              return (
                <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex size-11 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
                      <Icon className="size-5" aria-hidden="true" />
                    </div>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                      {item.status}
                    </span>
                  </div>
                  <h3 className="mt-5 text-base font-bold tracking-tight text-slate-950">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </article>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-white py-12 sm:py-16">
        <div className="container-shell">
          <div className="rounded-2xl border border-slate-200 bg-linear-to-br from-slate-950 via-[#11244d] to-slate-900 p-6 text-white shadow-[0_24px_60px_-44px_rgba(15,23,42,0.9)] sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  <MapPin className="size-4 text-[#9fb7ff]" aria-hidden="true" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-white/70">
                    Comece pelo seu contexto
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                  Descubra representantes e acompanhe a vida pública com mais clareza.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/68 sm:text-base">
                  Use a busca pública para consultar perfis ou informe seu CEP para encontrar representantes do seu
                  estado.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row lg:shrink-0">
                <Link
                  href="/busca"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#2952cc] px-5 text-sm font-semibold text-white transition hover:bg-[#3a63de]"
                >
                  Explorar políticos
                </Link>
                <Link
                  href="/cadastro"
                  className="inline-flex h-11 items-center justify-center rounded-lg border border-white/20 bg-white/10 px-5 text-sm font-semibold text-white transition hover:bg-white/15"
                >
                  Criar conta
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

