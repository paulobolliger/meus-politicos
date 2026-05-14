"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ArrowUpRight, MenuIcon } from "lucide-react"

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"

const navLinks = [
  { href: "/busca", label: "Busca pública" },
  { href: "/meu-estado", label: "Meu estado" },
  { href: "/termos", label: "Transparência" },
]

const authLinks = [
  {
    href: "/login",
    label: "Entrar",
    className:
      "inline-flex h-10 items-center justify-center rounded-lg border border-slate-200/90 px-4 text-sm font-semibold text-slate-700 transition-all hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
  },
  {
    href: "/cadastrar",
    label: "Cadastrar",
    className:
      "inline-flex h-10 items-center justify-center rounded-lg bg-[#2952cc] px-4 text-sm font-semibold text-white shadow-[0_10px_24px_-16px_rgba(41,82,204,0.95)] transition-all hover:bg-[#2349bb] hover:shadow-[0_14px_28px_-16px_rgba(41,82,204,0.95)]",
  },
]

function isLinkActive(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/"
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

function DesktopNavLink({
  href,
  label,
  pathname,
}: {
  href: string
  label: string
  pathname: string
}) {
  const active = isLinkActive(pathname, href)

  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`group relative inline-flex items-center py-2 text-[13px] font-medium tracking-[0.01em] transition-colors ${
        active ? "text-slate-950" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <span>{label}</span>
      <span
        className={`absolute inset-x-0 -bottom-3.5 h-px origin-center bg-linear-to-r from-[#7ca0ff] via-[#2952cc] to-[#99a8ff] transition-transform duration-200 ${
          active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100"
        }`}
      />
    </Link>
  )
}

function MobileNavLink({
  href,
  label,
  pathname,
}: {
  href: string
  label: string
  pathname: string
}) {
  const active = isLinkActive(pathname, href)

  return (
    <SheetClose
      render={
        <Link
          href={href}
          aria-current={active ? "page" : undefined}
          className={`rounded-xl border px-4 py-3.5 text-sm font-medium transition-colors ${
            active
              ? "border-[#d9e3ff] bg-[#f4f7ff] text-[#18326f]"
              : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
          }`}
        />
      }
    >
      {label}
    </SheetClose>
  )
}

export function Header() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12)
    }

    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })

    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-300 ${
        scrolled
          ? "border-b border-slate-200/70 bg-white/85 shadow-[0_10px_30px_-24px_rgba(15,23,42,0.32)] backdrop-blur-md"
          : "border-b border-slate-200/45 bg-white/96 shadow-[0_8px_24px_-28px_rgba(15,23,42,0.18)]"
      }`}
    >
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-slate-300/70 to-transparent" />
      <div className="container-shell flex h-16 items-center justify-between lg:h-20">
        <Link href="/" aria-label="Ir para a home do Meus Politicos" className="inline-flex shrink-0">
          <Image
            src="/logos_meus-politicos_colorido_semfundo.png"
            alt="Meus Politicos"
            width={227}
            height={36}
            priority
            className="h-10 w-auto sm:h-11 lg:h-12"
          />
        </Link>

        <div className="hidden items-center gap-8 xl:gap-10 lg:flex">
          <nav className="flex items-center gap-7 xl:gap-8" aria-label="Navegação principal">
            {navLinks.map((link) => (
              <DesktopNavLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            {authLinks.map((link) => (
              <Link key={link.href} href={link.href} className={link.className}>
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <Sheet>
          <SheetTrigger
            aria-label="Abrir menu"
            className="inline-flex size-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 lg:hidden"
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[88vw] max-w-sm border-l border-slate-200 bg-white p-0">
            <SheetHeader className="border-b border-slate-200/80 px-5 py-5 text-left">
              <SheetTitle className="text-slate-900">Navegação</SheetTitle>
              <SheetDescription>
                Acesse as áreas centrais da plataforma com leitura clara e objetiva.
              </SheetDescription>
            </SheetHeader>

            <div className="flex h-full flex-col px-5 py-6">
              <div className="border-b border-slate-200/70 pb-5">
                <Image
                  src="/logos_meus-politicos_colorido_semfundo.png"
                  alt="Meus Politicos"
                  width={227}
                  height={36}
                  className="h-10 w-auto"
                />
                <p className="mt-3 max-w-xs text-sm leading-6 text-slate-500">
                  Infraestrutura cívica para organizar dados públicos com clareza institucional.
                </p>
              </div>

              <nav className="mt-6 flex flex-col gap-2" aria-label="Navegação mobile">
                {navLinks.map((link) => (
                  <MobileNavLink key={link.href} href={link.href} label={link.label} pathname={pathname} />
                ))}
              </nav>

              <div className="mt-8 flex flex-col gap-3">
                {authLinks.map((link) => (
                  <SheetClose key={link.href} render={<Link href={link.href} className={link.className} />}>
                    {link.label}
                  </SheetClose>
                ))}
              </div>

              <div className="mt-auto border-t border-slate-200/80 pt-5 text-xs leading-5 text-slate-500">
                <p>Dados oficiais organizados com foco em transparência pública e leitura cívica.</p>
                <Link
                  href="/privacidade"
                  className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#2952cc] transition-colors hover:text-[#18326f]"
                >
                  Política de privacidade
                  <ArrowUpRight className="size-4" />
                </Link>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}