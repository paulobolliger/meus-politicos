import Link from "next/link"
import {
  Building,
  Crown,
  MapPin,
  Star,
  TrendingUp,
  Users,
  Vote,
} from "lucide-react"

import { CepSearch } from "@/components/home/CepSearch"
import { SearchBar } from "@/components/home/SearchBar"

const officePills = [
  "Presidente",
  "Governador",
  "Senador",
  "Dep. Federal",
  "Dep. Estadual",
  "Prefeito",
  "Vereador",
]

const officeCards = [
  {
    title: "Dep. Federal",
    icon: Users,
    count: "513",
    status: "Ativo",
    href: "/busca?cargo=deputado_federal",
    isAvailable: true,
  },
  {
    title: "Senador",
    icon: Star,
    count: "81",
    status: "Ativo",
    href: "/busca?cargo=senador",
    isAvailable: true,
  },
  {
    title: "Governador",
    icon: Building,
    count: "227",
    status: "Em breve",
    href: "",
    isAvailable: false,
  },
  {
    title: "Presidente",
    icon: Crown,
    count: "1",
    status: "Em breve",
    href: "",
    isAvailable: false,
  },
  {
    title: "Dep. Estadual",
    icon: Users,
    count: "~1.000",
    status: "Em breve",
    href: "",
    isAvailable: false,
  },
  {
    title: "Prefeito",
    icon: MapPin,
    count: "5.570",
    status: "Em breve",
    href: "",
    isAvailable: false,
  },
  {
    title: "Vereador",
    icon: Users,
    count: "~57.000",
    status: "Em breve",
    href: "",
    isAvailable: false,
  },
]

const stats = [
  { value: "513", label: "Deputados mapeados" },
  { value: "0", label: "Votações registradas" },
  { value: "0", label: "Gastos analisados" },
  { value: "5.570", label: "Municípios cobertos" },
]

export default function Home() {
  return (
    <main className="font-sans">
      <section className="bg-[#1a2b5e] py-16 text-white sm:py-20">
        <div className="container-shell">
          <div className="mx-auto max-w-4xl space-y-8">
            <div className="space-y-4 text-center sm:text-left">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Do presidente ao vereador
              </h1>
              <p className="max-w-2xl text-base text-white/80 sm:text-lg">
                Transparência para decidir melhor. Sem opinião. Só dados.
              </p>
            </div>

            <div className="flex flex-wrap gap-2.5">
              {officePills.map((office) => (
                <span
                  key={office}
                  className="rounded-full border border-white/30 bg-white/15 px-3 py-1.5 text-sm font-medium"
                >
                  {office}
                </span>
              ))}
            </div>

            <div className="space-y-6 rounded-2xl border border-white/15 bg-white/8 p-4 backdrop-blur-sm sm:p-6">
              <SearchBar />

              <div className="flex items-center gap-4 text-sm text-white/70">
                <div className="h-px flex-1 bg-white/20" />
                <span>ou</span>
                <div className="h-px flex-1 bg-white/20" />
              </div>

              <CepSearch />

              <p className="text-center text-sm text-white/60 sm:text-left">
                🔒 Seu CEP não é armazenado
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="container-shell">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Explorar por cargo
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {officeCards.map((card) => {
              const Icon = card.icon
              const cardContent = (
                <article
                  className={`rounded-xl border border-slate-200 p-4 transition ${
                    card.isAvailable
                      ? "bg-white hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
                      : "bg-slate-50 opacity-70"
                  }`}
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Icon className="text-[#1a2b5e]" size={20} />
                    {card.isAvailable ? (
                      <span className="text-xs font-semibold text-emerald-700">
                        {card.status}
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {card.status}
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-slate-700">{card.title}</p>
                  <p className="mt-1 text-2xl font-bold text-slate-900">{card.count}</p>
                </article>
              )

              return card.isAvailable ? (
                <Link key={card.title} href={card.href} aria-label={`Abrir ${card.title}`}>
                  {cardContent}
                </Link>
              ) : (
                <div key={card.title}>{cardContent}</div>
              )
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6fa] py-14 sm:py-16">
        <div className="container-shell">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Números da plataforma
          </h2>

          <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {stats.map((stat) => (
              <article key={stat.label} className="rounded-xl bg-white p-5 text-center">
                <p className="text-3xl font-bold text-[#2952cc] sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-slate-600">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-14 sm:py-16">
        <div className="container-shell">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Últimas votações
          </h2>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-12">
            <Vote className="mx-auto text-[#2952cc]" size={36} />
            <p className="mt-4 text-xl font-semibold text-slate-900">Dados sendo coletados</p>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Em breve as votações mais recentes aparecerão aqui
            </p>
          </div>
        </div>
      </section>

      <section className="bg-[#f5f6fa] py-14 sm:py-16">
        <div className="container-shell">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            Destaque da semana
          </h2>

          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center sm:p-12">
            <TrendingUp className="mx-auto text-[#2952cc]" size={36} />
            <p className="mt-4 text-xl font-semibold text-slate-900">Rankings em breve</p>
          </div>
        </div>
      </section>
    </main>
  )
}
