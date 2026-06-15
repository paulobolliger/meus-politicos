'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { BrandLogo } from '@/components/brand/BrandLogo'

const PUBLIC_LINKS = [
  { label: 'Buscar', href: '/busca' },
  { label: 'Câmara', href: '/camara' },
  { label: 'Senado', href: '/senado' },
  { label: 'Estados & Cidades', href: '/estado' },
  { label: 'Projetos', href: '/projetos' },
  { label: 'Eleições', href: '/eleicao' },
]

const PRIVATE_LINKS = [
  { label: 'Início', href: '/painel' },
  { label: 'Meus políticos', href: '/painel/meus-politicos' },
  { label: 'Comparar', href: '/painel/comparar' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<{ name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  const isDashboard = pathname.startsWith('/painel')
  const activePrivate = PRIVATE_LINKS.filter(
    (link) => link.href !== '/painel/comparar' || flags['comparativo_parlamentares']
  )
  const activePublic = [
    ...PUBLIC_LINKS,
    ...(flags['insights_rankings'] ? [{ label: 'Rankings', href: '/insights' }] : [])
  ]
  const links = isDashboard ? [...activePrivate, ...activePublic] : activePublic

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        setUser(data.user)
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })

    fetch('/api/flags')
      .then((res) => res.json())
      .then((data) => {
        setFlags(data)
      })
      .catch(() => {})
  }, [])

  return (
    <header
      className={`fixed top-0 w-full z-50 border-b transition-all duration-300 ${
        scrolled
          ? 'bg-[#1E293B]/95 backdrop-blur-sm border-[#334155] shadow-md'
          : 'bg-[#1E293B]/90 backdrop-blur-sm border-[#334155]/60 shadow-sm'
      }`}
    >
      {!loading && user && !isDashboard && (
        <div className="bg-[#6366F1] text-white text-[11px] font-bold py-1.5 px-4 flex justify-between items-center transition-all z-50">
          <span className="flex items-center gap-2">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
            </span>
            Você está visualizando a área pública do portal.
          </span>
          <Link href="/painel" className="underline hover:text-slate-200">
            Voltar ao Painel Cidadão →
          </Link>
        </div>
      )}
      <div className="max-w-7xl mx-auto h-16 px-4 md:px-8 flex justify-between items-center">
        <Link href="/" className="group transition-opacity hover:opacity-95">
          <BrandLogo
            height={36}
            priority
            className="transition-transform duration-300 group-hover:scale-[1.02]"
          />
        </Link>

        {/* Navigation Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-1.5">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-sans text-[13px] px-3.5 py-2 rounded-lg font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20'
                    : 'text-[#94A3B8] hover:text-white hover:bg-[#0F172A]'
                }`}
              >
                {link.label}
              </Link>
            )
          })}
        </nav>

        {/* Trailing Actions */}
        <div className="hidden md:flex items-center gap-3">
          {/* Apoiar Button - Gradiente âmbar/ouro */}
          <Link
            href="/apoio"
            className="bg-gradient-to-br from-[#FFB020] to-[#FF8A00] hover:from-[#FFBA3B] hover:to-[#FF981A] active:scale-95 transition-all duration-200 text-[#1E1E1E] font-bold text-xs tracking-wider uppercase px-4 py-2 rounded-lg shadow-sm flex items-center gap-1.5 font-sans"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-3.5 h-3.5 flex-shrink-0"
              style={{ display: 'inline-block' }}
            >
              <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
            </svg>
            Apoiar
          </Link>

          {/* Auth State Links */}
          {loading ? (
            <div className="w-16 h-8 bg-slate-800 rounded-lg animate-pulse" />
          ) : user ? (
            <div className="flex items-center gap-2">
              <Link
                href="/painel"
                className="bg-[#334155] hover:bg-[#475569] text-white font-medium text-xs px-3.5 py-2 rounded-lg border border-[#475569]/60 transition-colors"
              >
                Painel
              </Link>
              <a
                href="/api/auth/logto/sign-out"
                className="text-[#94A3B8] hover:text-white text-xs font-semibold px-2 py-2 transition-colors"
              >
                Sair
              </a>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-[#8B5CF6] hover:bg-[#7C3AED] active:scale-95 transition-all text-white font-bold text-xs px-4 py-2 rounded-lg"
              style={{
                backgroundColor: '#8B5CF6',
                color: '#ffffff',
              }}
            >
              Entrar
            </Link>
          )}
        </div>

        {/* Mobile Actions and Toggle */}
        <div className="flex items-center gap-2 md:hidden">
          {!loading && user && (
            <Link
              href="/painel"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] tracking-wide px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all shadow-sm"
            >
              PAINEL
            </Link>
          )}

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Menu de Navegação"
            className="p-2 text-[#94A3B8] hover:text-white focus:outline-none"
          >
            {mobileMenuOpen ? (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#1E293B] border-t border-[#334155] px-4 py-4 space-y-3 animate-fade-in">
          <nav className="flex flex-col gap-1.5">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`font-sans text-sm px-3.5 py-2.5 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'text-[#8B5CF6] bg-[#8B5CF6]/10 border border-[#8B5CF6]/20'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#0F172A]'
                  }`}
                >
                  {link.label}
                </Link>
              )
            })}
          </nav>
          <div className="border-t border-[#334155] pt-3 flex flex-col gap-2.5">
            <Link
              href="/apoio"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full bg-gradient-to-br from-[#FFB020] to-[#FF8A00] text-[#1E1E1E] font-bold text-xs tracking-wider uppercase py-2.5 rounded-lg shadow-sm flex items-center justify-center gap-1.5 font-sans"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-3.5 h-3.5 flex-shrink-0"
                style={{ display: 'inline-block' }}
              >
                <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
              </svg>
              Apoiar
            </Link>

            {loading ? (
              <div className="w-full h-10 bg-slate-800 rounded-lg animate-pulse" />
            ) : user ? (
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/painel"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full bg-[#334155] hover:bg-[#475569] text-white font-medium text-xs text-center py-2.5 rounded-lg border border-[#475569]/60 transition-colors"
                >
                  Painel
                </Link>
                <a
                  href="/api/auth/logto/sign-out"
                  className="w-full bg-slate-800 hover:bg-slate-700 text-[#94A3B8] hover:text-white text-xs font-semibold text-center py-2.5 rounded-lg transition-colors"
                >
                  Sair
                </a>
              </div>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-xs py-2.5 rounded-lg transition-colors"
                style={{
                  backgroundColor: '#8B5CF6',
                  color: '#ffffff',
                }}
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
