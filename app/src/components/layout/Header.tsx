"use client"

import Image from "next/image"
import Link from "next/link"
import { MenuIcon } from "lucide-react"

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
  { href: "/sobre", label: "Sobre" },
  { href: "/fontes", label: "Fontes" },
  { href: "/metodologia", label: "Metodologia" },
]

const authLinks = [
  {
    href: "/entrar",
    label: "Entrar",
    className:
      "inline-flex h-10 items-center justify-center rounded-lg border border-[#1a2b5e] px-4 text-sm font-semibold text-[#1a2b5e] transition-colors hover:bg-[#1a2b5e] hover:text-white",
  },
  {
    href: "/cadastrar",
    label: "Cadastrar",
    className:
      "inline-flex h-10 items-center justify-center rounded-lg bg-[#2952cc] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#1f43af]",
  },
]

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-[#e2e5ef] bg-white/95 backdrop-blur">
      <div className="container-shell flex h-16 items-center justify-between lg:h-20">
        <Link href="/" aria-label="Ir para a home do Meus Politicos">
          <Image
            src="/logos_meus-politicos_colorido_semfundo.png"
            alt="Meus Politicos"
            width={227}
            height={36}
            priority
            className="h-8 w-auto lg:h-9"
          />
        </Link>

        <div className="hidden items-center gap-8 lg:flex">
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-[#6b7280] transition-colors hover:text-[#1a2b5e]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
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
            className="inline-flex size-10 items-center justify-center rounded-lg border border-[#e2e5ef] text-[#1a2b5e] transition-colors hover:bg-[#f5f6fa] lg:hidden"
          >
            <MenuIcon className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-[86vw] max-w-sm border-l border-[#e2e5ef] bg-white p-0">
            <SheetHeader className="border-b border-[#e2e5ef] px-5 py-4 text-left">
              <SheetTitle className="text-[#1a2b5e]">Menu</SheetTitle>
              <SheetDescription>
                Navegue pelas seções principais da plataforma.
              </SheetDescription>
            </SheetHeader>

            <div className="flex h-full flex-col px-5 py-6">
              <nav className="flex flex-col gap-1">
                {navLinks.map((link) => (
                  <SheetClose
                    key={link.href}
                    render={
                      <Link
                        href={link.href}
                        className="rounded-lg px-3 py-3 text-base font-medium text-[#6b7280] transition-colors hover:bg-[#f5f6fa] hover:text-[#1a2b5e]"
                      />
                    }
                  >
                    {link.label}
                  </SheetClose>
                ))}
              </nav>

              <div className="mt-8 flex flex-col gap-3">
                {authLinks.map((link) => (
                  <SheetClose key={link.href} render={<Link href={link.href} className={link.className} />}>
                    {link.label}
                  </SheetClose>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}