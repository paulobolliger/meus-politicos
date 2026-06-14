import type { Metadata } from "next"
import Link from "next/link"
import { ArrowUpRight, CheckCircle2, FileText, ShieldCheck, Sparkles, Users } from "lucide-react"

export const metadata: Metadata = {
  title: "Manifesto",
  description:
    "Manifesto público do Meus Politicos: por que existe, o que faz, no que acredita e o que não é.",
}

const blocos = [
  {
    eyebrow: "1. Por que isso existe",
    title: "O problema é a distância.",
    description:
      "O Brasil tem 594 parlamentares federais, 27 governadores, mais de 5.500 prefeitos e 57 mil vereadores. Cada decisão afeta a vida cotidiana, mas a maioria das pessoas não consegue acompanhar quem a representa.",
  },
  {
    eyebrow: "2. O diagnóstico real",
    title: "As fontes existem. O acesso não.",
    description:
      "A Câmara publica votações, o Senado registra discursos, o TSE expõe financiamento e o Portal da Transparência detalha gastos. O problema é reunir tudo em formatos compreensíveis e úteis para qualquer cidadão.",
  },
  {
    eyebrow: "3. O que fazemos",
    title: "Coletamos. Organizamos. Traduzimos.",
    description:
      "Transformamos juridiquês em português claro e exibimos tudo em segundos, no celular, do presidente ao vereador, sem filtro editorial e sem patrocínio político.",
  },
  {
    eyebrow: "4. Neutralidade não é omissão",
    title: "Respeito é não escolher o lado.",
    description:
      "Não ranqueamos por ideologia nem julgamos propostas. A transparência só funciona quando o acesso é igualmente aberto para todos os lados.",
  },
  {
    eyebrow: "5. O que acreditamos",
    title: "Quatro crenças orientam o projeto.",
    bullets: [
      "Cidadãos bem informados tomam melhores decisões.",
      "Informação pública precisa ser compreensível para qualquer pessoa.",
      "Tecnologia pode servir à democracia.",
      "Conhecer o representante torna o país mais difícil de enganar.",
    ],
  },
  {
    eyebrow: "6. O que não somos",
    title: "Não somos jornalismo, militância nem governo.",
    bullets: [
      "Não temos pauta editorial e não investigamos como redação.",
      "Não defendemos causa nem fazemos campanha.",
      "Não somos financiados por partido e não respondemos a esfera pública.",
    ],
    closing:
      "Somos infraestrutura. O sistema operacional da cidadania política brasileira.",
  },
  {
    eyebrow: "7. Uma promessa simples",
    title: "Se errarmos, o cidadão corrige.",
    description:
      "Qualquer erro pode ser reportado. A fonte oficial sempre prevalece. Quando usamos inteligência artificial para resumir ou traduzir um texto, isso fica explícito.",
  },
]

export default function ManifestoPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-[var(--bg)] to-[var(--panel)]">
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[var(--brand-soft)] to-transparent" />
        <div className="pointer-events-none absolute right-[-8rem] top-12 h-72 w-72 rounded-full bg-[color:var(--brand-2)]/8 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-20">
          <div className="max-w-4xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-emerald-400" />
              <span className="mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mute)]">Manifesto público</span>
            </div>

            <div className="space-y-5">
              <h1 className="text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl">
                Somos infraestrutura. O sistema operacional da cidadania política brasileira.
              </h1>
              <p className="max-w-3xl text-base leading-7 text-[var(--ink-3)] sm:text-lg">
                Este é o texto público que resume a tese do projeto para imprensa, investidores, entrevistas e
                apresentações. O objetivo é simples: transformar dados públicos em clareza cidadã.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/sobre"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[var(--brand-2)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Ver sobre
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/como-funciona"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--panel)] px-5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--bg)]"
              >
                Entender a operação
                <ArrowUpRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-12 sm:py-16">
        <div className="grid gap-4 lg:grid-cols-2">
          {blocos.map((bloco) => (
            <article key={bloco.eyebrow} className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-7">
              <p className="mono text-xs font-semibold uppercase tracking-[0.12em] text-[var(--brand-2)]">{bloco.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--ink)]">{bloco.title}</h2>


              {bloco.description ? (
                <>
                  <p className="mt-3 text-sm leading-6 text-[var(--ink-3)] sm:text-base">{bloco.description}</p>
                  {bloco.eyebrow === "7. Uma promessa simples" && (
                    <div className="mt-2">
                      <Link href="/metodologia" className="font-semibold text-[var(--brand-2)] hover:underline">Ver metodologia completa →</Link>
                    </div>
                  )}
                </>
              ) : null}

              {bloco.bullets ? (
                <ul className="mt-4 grid gap-3">
                  {bloco.bullets.map((item) => (
                    <li key={item} className="flex gap-3 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-[var(--brand-2)]" aria-hidden="true" />
                      <span className="text-sm leading-6 text-[var(--ink-2)]">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {bloco.closing ? (
                <div className="mt-4 rounded-2xl border border-[var(--line)] bg-[var(--bg)] p-4">
                  <p className="mono text-sm font-semibold uppercase tracking-[0.12em] text-[var(--brand-2)]">Posicionamento final</p>
                  <p className="mt-2 text-lg font-bold tracking-tight text-[var(--ink)]">{bloco.closing}</p>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-[var(--line)] bg-[var(--panel)] py-12 sm:py-16">
        <div className="container-shell">
          <div className="rounded-2xl border border-[var(--line)] bg-linear-to-br from-slate-950 via-[#11244d] to-slate-900 p-6 text-white shadow-[0_24px_60px_-44px_rgba(15,23,42,0.9)] sm:p-8 lg:p-10">
            <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
                  <Sparkles className="size-4 text-[#9fb7ff]" aria-hidden="true" />
                  <span className="mono text-xs font-semibold uppercase tracking-[0.12em] text-white/70">
                    Promessa operacional
                  </span>
                </div>
                <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Transparência para decidir melhor.</h2>
                <p className="mt-3 text-sm leading-6 text-white/68 sm:text-base">
                  A fonte oficial sempre prevalece. Erros podem ser reportados. Quando houver resumo ou tradução feita
                  com IA, isso será sinalizado com clareza. O compromisso é com a verificação, não com a narrativa.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <ShieldCheck className="size-5 text-[#9fb7ff]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white">Fonte oficial acima do resumo</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <Users className="size-5 text-[#9fb7ff]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white">Correção pública quando necessário</p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4 sm:col-span-2 lg:col-span-1">
                  <FileText className="size-5 text-[#9fb7ff]" aria-hidden="true" />
                  <p className="mt-3 text-sm font-semibold text-white">Tese pública disponível para imprensa e pitch</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
