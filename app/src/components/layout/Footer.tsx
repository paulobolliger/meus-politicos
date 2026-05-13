import Image from "next/image"
import Link from "next/link"

const platformLinks = [
  { href: "/buscar", label: "Buscar políticos" },
  { href: "/quem-me-representa", label: "Quem me representa" },
  { href: "/meus-politicos", label: "Meus políticos" },
  { href: "/candidatos-2026", label: "Candidatos 2026" },
]

const projectLinks = [
  { href: "/sobre", label: "Sobre" },
  { href: "/fontes", label: "Fontes" },
  { href: "/metodologia", label: "Metodologia" },
  { href: "/correcao-de-dados", label: "Correção de dados" },
  { href: "/termos", label: "Termos" },
  { href: "/privacidade", label: "Privacidade" },
]

function FooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="text-sm text-white/70 transition-colors hover:text-white"
    >
      {label}
    </Link>
  )
}

export function Footer() {
  return (
    <footer className="bg-[#1a2b5e] text-white">
      <div className="container-shell py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-4">
            <Image
              src="/logos_meus-politicos_preto_semfundo.png"
              alt="Meus Politicos"
              width={177}
              height={28}
              className="h-7 w-auto brightness-0 invert"
            />
            <p className="text-sm font-semibold text-white">
              Transparência para decidir melhor.
            </p>
            <p className="max-w-sm text-sm leading-6 text-white/70">
              Dados públicos. Fontes oficiais. Sem opinião.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
              Plataforma
            </h2>
            <div className="flex flex-col gap-3">
              {platformLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-white">
              Projeto
            </h2>
            <div className="flex flex-col gap-3">
              {projectLinks.map((link) => (
                <FooterLink key={link.href} href={link.href} label={link.label} />
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2 text-sm text-white/70">
            <p>© 2026 Meus Políticos — NORO GURU · CNPJ 63.429.497/0001-88</p>
            <p>Dados coletados de fontes oficiais: Câmara, Senado, TSE, IBGE</p>
          </div>

          <Link
            href="/apoie"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/30 px-4 text-sm font-medium text-white transition-colors hover:border-white hover:bg-white/10"
          >
            Apoie o projeto
          </Link>
        </div>
      </div>
    </footer>
  )
}