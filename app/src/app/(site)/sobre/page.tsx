import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, Building2, Mail, Scale, Search, ShieldCheck, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Sobre",
  description:
    "Conheca o Meus Politicos, portal independente de transparencia politica para o cidadao brasileiro.",
}

const blocos = [
  {
    icon: Search,
    title: "Por que isso existe",
    description:
      "A política brasileira afeta a vida todos os dias, mas acompanhar o que cada representante faz ainda é difícil, fragmentado e pouco acessível.",
  },
  {
    icon: Building2,
    title: "O que fazemos",
    description:
      "Reunimos dados oficiais, organizamos a informação e apresentamos tudo de forma simples para que qualquer cidadão consiga pesquisar e acompanhar representantes.",
  },
  {
    icon: Scale,
    title: "Neutralidade como princípio",
    description:
      "Não editorializamos, não militamos e não opinamos sobre candidatos, partidos ou ideologias. Mostramos dados verificáveis e deixamos a conclusão com o cidadão.",
  },
]

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-[var(--bg)] to-[var(--panel)]">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-[color:var(--brand-2)]/8 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-emerald-400" />
              <span className="mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">
                Sobre o Meus Políticos
              </span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                Transparência política para qualquer cidadão.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-[var(--ink-3)] sm:text-lg">
                Sem narrativa. Sem opinião. Só dados verificáveis, de fontes oficiais, apresentados de forma simples.
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Veja todas as fontes em <Link href="/fontes" className="font-semibold text-[var(--brand-2)] hover:underline">/fontes</Link> e a metodologia dos scores em <Link href="/metodologia" className="font-semibold text-[var(--brand-2)] hover:underline">/metodologia</Link>.
              </p>
              <p className="max-w-2xl text-sm leading-6 text-slate-500">
                Esta página resume a visão do projeto. Para a versão completa da tese pública, veja o{' '}
                <Link href="/manifesto" className="font-semibold text-[var(--brand-2)] hover:underline">
                  manifesto
                </Link>
                . Para a camada operacional, veja{' '}
                <Link href="/como-funciona" className="font-semibold text-[var(--brand-2)] hover:underline">
                  como funciona
                </Link>
                .
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
                <p className="mono text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-2)]">Posicionamento</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  O sistema operacional da cidadania.
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">
                  Neutralidade não é fraqueza. É o produto. O Meus Políticos mostra dados e deixa a conclusão para o
                  cidadão.
                </p>
              </div>

              <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm sm:p-6">
                <p className="mono text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-2)]">Manifesto público</p>
                <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Somos infraestrutura.
                </p>
                <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">
                  Essa é a frase de posicionamento que guia imprensa, pitches e apresentações institucionais.
                </p>
                <Link href="/manifesto" className="mt-4 inline-flex text-sm font-semibold text-[var(--brand-2)] hover:underline">
                  Ler o manifesto completo
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-12 sm:py-16">
        <div className="grid gap-4 md:grid-cols-3">
          {blocos.map((item) => {
            const Icon = item.icon

            return (
              <article key={item.title} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
                <div className="flex size-11 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] text-[var(--brand-2)]">
                  <Icon className="size-5" aria-hidden="true" />
                </div>
                <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-950">{item.title}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--ink-3)]">{item.description}</p>
              </article>
            )
          })}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)] py-12 sm:py-16">
        <div className="container-shell">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                O cidadão pesquisa qualquer político e vê, em segundos.
              </h2>
              <p className="mt-3 text-sm leading-6 text-[var(--ink-3)] sm:text-base">
                As informações existem nos portais oficiais. Nosso trabalho é reduzir a fricção entre dado público e
                compreensão cidadã.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {["O que votou", "Como gastou dinheiro público", "Com que frequência compareceu", "Quem financia sua campanha"].map(
                (item) => (
                  <div key={item} className="rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
                    <Users className="size-5 text-[var(--brand-2)]" aria-hidden="true" />
                    <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{item}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-12 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
          <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] text-[var(--brand-2)]">
              <ShieldCheck className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Neutralidade editorial</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-3)] sm:text-base">
              O Meus Políticos não tem filiação partidária, não recebe financiamento de partidos ou grupos políticos e
              não emite opinião sobre candidatos, partidos ou ideologias. Acreditamos que cidadãos bem informados tomam
              melhores decisões. Nosso papel é dar informação. O resto é com você.
            </p>
          </article>

          <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-8">
            <div className="flex size-12 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--bg)] text-[var(--brand-2)]">
              <Mail className="size-6" aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950">Quem somos</h2>
            <p className="mt-3 text-sm leading-6 text-[var(--ink-3)]">
              O Meus Políticos é desenvolvido e operado pela NORO GURU, NORO Tecnologia e Turismo Ltda, CNPJ
              63.429.497/0001-88, empresa brasileira com sede em Campinas/SP.
            </p>
            <a
              href="mailto:contato@meuspoliticos.com.br"
              className="mt-5 inline-flex text-sm font-semibold text-[var(--brand-2)] hover:underline"
            >
              contato@meuspoliticos.com.br
            </a>
          </article>
        </div>
      </section>

      <section className="bg-[var(--panel)] py-12 sm:py-16">
        <div className="container-shell">
          <div className="rounded-2xl border border-[var(--line)] bg-linear-to-br from-slate-950 via-[#11244d] to-slate-900 p-6 text-white shadow-[0_24px_60px_-44px_rgba(15,23,42,0.9)] sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="max-w-2xl">
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Explore dados públicos com clareza.
                </h2>
                <p className="mt-3 text-sm leading-6 text-white/68 sm:text-base">
                  Pesquise políticos, entenda contexto institucional e acompanhe representantes em uma plataforma
                  neutra. Se quiser a tese pública do projeto, leia também o manifesto.
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
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
                  Entender como funciona
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
