import Image from "next/image"
import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

type FooterNavItem = {
  href: string
  label: string
  external?: boolean
}

const footerSections = [
  {
    title: "Plataforma",
    links: [
      { href: "/busca", label: "Busca pública" },
      { href: "/busca?cargo=deputado_federal", label: "Deputados federais" },
      { href: "/busca?cargo=senador", label: "Senadores" },
      { href: "/meu-estado", label: "Meu estado" },
    ],
  },
  {
    title: "Projeto",
    links: [
      { href: "/", label: "Visão geral" },
      { href: "/sobre", label: "Sobre" },
      { href: "/manifesto", label: "Manifesto" },
      { href: "/como-funciona", label: "Como funciona" },
      { href: "/cadastro", label: "Criar conta" },
      { href: "/login", label: "Entrar" },
    ],
  },
  {
    title: "Transparência / Legal",
    links: [
      { href: "/termos", label: "Termos de uso" },
      { href: "/privacidade", label: "Política de privacidade" },
      { href: "http://www.noro.guru", label: "Desenvolvimento parceiro", external: true },
    ],
  },
] satisfies Array<{ title: string; links: FooterNavItem[] }>

function FooterLink({ href, label, external = false }: FooterNavItem) {
  return (
    <Link
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className="group relative inline-flex w-fit text-sm text-white/68 transition-colors hover:text-white focus-visible:text-white"
    >
      <span>{label}</span>
      <span className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-linear-to-r from-[#7ea6ff] via-[#9aa8ff] to-[#c59cff] transition-transform duration-200 group-hover:scale-x-100 group-focus-visible:scale-x-100" />
    </Link>
  )
}

function FooterNavColumn({ title, links }: { title: string; links: FooterNavItem[] }) {
  return (
    <div className="space-y-4">
      <h2 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/48">
        {title}
      </h2>
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <FooterLink key={`${title}-${link.href}`} {...link} />
        ))}
      </div>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-linear-to-b from-slate-950 via-[#11244d] to-slate-900 text-white">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-[#4f6fd6]/80 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#2952cc]/10 blur-3xl" />

      <div className="container-shell py-10 sm:py-12 lg:py-14">
        <div className="grid gap-10 border-b border-white/10 pb-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,0.7fr)_minmax(0,0.7fr)_minmax(0,0.9fr)] lg:gap-8 lg:pb-9">
          <div className="space-y-5 lg:pr-10">
            <Link href="/" aria-label="Ir para a home do Meus Politicos" className="inline-flex w-fit">
              <Image
                src="/logos_meus-politicos_preto_semfundo.png"
                alt="Meus Politicos"
                width={300}
                height={47}
                className="h-11 w-auto brightness-0 invert sm:h-12 lg:h-14"
              />
            </Link>

            <div className="max-w-md space-y-3">
              <p className="text-base font-semibold tracking-tight text-white sm:text-lg">
                Tecnologia para ampliar a transparência pública.
              </p>
              <p className="text-sm leading-6 text-white/68 sm:text-[15px]">
                Organizamos dados oficiais para ajudar cidadãos a acompanhar representantes,
                entender contexto institucional e tomar decisões com mais clareza.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <Link
                href="/busca"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#2952cc] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#3a63de]"
              >
                Explorar plataforma
              </Link>
              <Link
                href="/cadastro"
                className="inline-flex items-center gap-1.5 text-sm font-medium text-white/72 transition-colors hover:text-white"
              >
                Criar conta
                <ArrowUpRight className="size-4" />
              </Link>
            </div>
          </div>

          {footerSections.map((section) => (
            <FooterNavColumn key={section.title} title={section.title} links={section.links} />
          ))}
        </div>

        <div className="flex flex-col gap-4 pt-5 sm:pt-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-2 text-xs leading-5 text-white/56 sm:text-sm">
            <p>
              Base informativa construída com dados públicos de Câmara dos Deputados, Senado
              Federal, TSE e IBGE.
            </p>
            <p>
              Meus Políticos organiza informações oficiais para fortalecer a cidadania e a leitura
              qualificada da vida pública.
            </p>
          </div>

          <div className="space-y-1 text-left text-xs text-white/52 lg:text-right">
            <p>© 2026 Meus Políticos. Plataforma independente de tecnologia cívica.</p>
            <p>
              <span className="text-white/42">Powered by </span>
              <Link
                href="http://www.noro.guru"
                target="_blank"
                rel="noreferrer"
                className="bg-linear-to-r from-[#69a8ff] via-[#8b8dff] to-[#c897ff] bg-clip-text font-medium text-transparent transition-opacity hover:opacity-90"
              >
                Noro Guru
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}
