import type { ReactNode } from 'react'
import { BadgeCheck, Database, Landmark } from 'lucide-react'

type AuthShellProps = {
  title: string
  description: string
  children: ReactNode
}

const trustItems = [
  {
    icon: Landmark,
    title: 'Plataforma independente',
    description: 'Leitura cívica sem vínculo partidário ou institucional governamental.',
  },
  {
    icon: Database,
    title: 'Dados públicos organizados',
    description: 'Informações oficiais estruturadas para consulta clara e rastreável.',
  },
  {
    icon: BadgeCheck,
    title: 'Conta protegida',
    description: 'Autenticação segura para acompanhar representantes e salvar preferências.',
  },
]

export function AuthShell({ title, description, children }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-hidden bg-linear-to-b from-slate-50 to-white">
      <section className="relative border-b border-slate-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute right-[-10%] top-10 h-72 w-72 rounded-full bg-[#2952cc]/8 blur-3xl" />

        <div className="container-shell relative py-10 sm:py-14 lg:py-18">
          <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_520px] lg:gap-16">
            <div className="max-w-2xl space-y-8">
              <div className="space-y-5">
                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                  <span className="inline-block size-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                    Conta Meus Politicos
                  </span>
                </div>

                <div className="space-y-4">
                  <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
                    {title}
                  </h1>
                  <p className="max-w-xl text-base leading-7 text-slate-600 sm:text-lg">{description}</p>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
                {trustItems.map((item) => {
                  const Icon = item.icon

                  return (
                    <article
                      key={item.title}
                      className="rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm"
                    >
                      <div className="flex gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
                          <Icon className="size-5" aria-hidden="true" />
                        </div>
                        <div>
                          <h2 className="text-sm font-semibold text-slate-900">{item.title}</h2>
                          <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
            </div>

            <div className="mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-44px_rgba(15,23,42,0.42)] sm:p-8">
                {children}
              </div>
              <p className="mt-4 text-center text-xs leading-5 text-slate-500">
                O acesso usa infraestrutura segura de autenticação e respeita a Política de Privacidade.
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}

