'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  BookOpen,
  Home,
  MapPin,
  Scale,
  ScrollText,
  Search,
  Users,
  Vote,
  Heart,
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ReactNode
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'PAINEL CIDADÃO',
    items: [
      { label: 'Início', href: '/painel', icon: <Home size={18} /> },
      { label: 'Meus políticos', href: '/painel/meus-politicos', icon: <Users size={18} /> },
      { label: 'Comparar', href: '/painel/comparar', icon: <Scale size={18} /> },
    ],
  },
  {
    title: 'EXPLORAÇÃO',
    items: [
      { label: 'Buscar políticos', href: '/busca', icon: <Search size={18} /> },
      { label: 'Câmara Federal', href: '/camara', icon: <ScrollText size={18} /> },
      { label: 'Senado Federal', href: '/senado', icon: <Vote size={18} /> },
      { label: 'Estados & Cidades', href: '/estado', icon: <MapPin size={18} /> },
      { label: 'Partidos', href: '/partidos', icon: <Activity size={18} /> },
      { label: 'Projetos de Lei', href: '/projetos', icon: <BookOpen size={18} /> },
      { label: 'Eleições', href: '/eleicao', icon: <Vote size={18} /> },
    ],
  },
  {
    title: 'APOIO',
    items: [
      { label: 'Apoiar projeto', href: '/apoio', icon: <Heart size={18} /> },
    ],
  },
]

function isItemActive(pathname: string, href: string) {
  if (href === '/painel') return pathname === '/painel'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarBlock({
  collapsed,
  pathname,
  onNavigate,
  sections = NAV_SECTIONS,
}: {
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
  sections?: NavSection[]
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {sections.map((section) => (
        <div key={section.title}>
          {!collapsed && (
            <div className="mono" style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--mute)', marginBottom: 8 }}>
              {section.title}
            </div>
          )}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {section.items.map((item) => {
              const active = isItemActive(pathname, item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onNavigate}
                  className={`mono sidebar-item ${active ? 'sidebar-item-active' : ''}`}
                  style={{
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 8,
                    padding: collapsed ? '0 8px' : '0 10px',
                    textDecoration: 'none',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                  }}
                  title={item.label}
                >
                  {item.icon}
                  {!collapsed && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {item.label}
                      {section.title === 'EXPLORAÇÃO' && (
                        <span style={{ opacity: 0.65, fontSize: 9 }} aria-hidden="true">↗</span>
                      )}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// Topbar mobile — deve ser renderizado FORA do flex row horizontal do layout
export function AppMobileTopbar() {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState<{ name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const closeDrawer = window.setTimeout(() => setMobileOpen(false), 0)
    return () => window.clearTimeout(closeDrawer)
  }, [pathname])

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

  const activeSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => {
      if (section.title === 'PAINEL CIDADÃO') {
        return {
          ...section,
          items: section.items.filter(
            (item) => item.href !== '/painel/comparar' || flags['comparativo_parlamentares']
          ),
        }
      }
      return section
    })
  }, [flags])

  return (
    <>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          padding: '0 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
          position: 'sticky',
          top: 32,
          zIndex: 30,
        }}
      >
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="mono"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 30,
            border: '1px solid var(--line-strong)',
            background: 'var(--panel)',
            color: 'var(--ink-2)',
            fontSize: 12,
            letterSpacing: '0.08em',
            cursor: 'pointer',
            borderRadius: 8,
          }}
        >
          MENU
        </button>
        <Link href="/painel" style={{ display: 'inline-flex', alignItems: 'center', height: '98%' }}>
          <Image
            src="/logos_meus-politicos_colorido_semfundo.png"
            alt="Meus Politicos"
            height={30}
            width={126}
            style={{ width: 'auto', height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
          />
        </Link>
        <Link
          href="/"
          className="mono"
          style={{ fontSize: 10.5, color: 'var(--ink-3)', textDecoration: 'none', letterSpacing: '0.06em' }}
        >
          voltar ao site
        </Link>
      </div>

      {mobileOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(10,14,26,0.48)', zIndex: 40 }}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            style={{
              position: 'fixed',
              left: 0,
              top: 0,
              bottom: 0,
              width: 238,
              maxWidth: '86vw',
              background: 'var(--bg)',
              borderRight: '1px solid var(--line)',
              zIndex: 50,
              padding: 14,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Image
                src="/logos_meus-politicos_colorido_semfundo.png"
                alt="Meus Politicos"
                height={30}
                width={120}
                style={{ width: 'auto', height: 30, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
              />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="mono"
                style={{
                  width: 28,
                  height: 28,
                  border: '1px solid var(--line)',
                  background: 'var(--panel)',
                  color: 'var(--ink-3)',
                  cursor: 'pointer',
                  borderRadius: 8,
                }}
              >
                X
              </button>
            </div>

            <SidebarBlock collapsed={false} pathname={pathname} onNavigate={() => setMobileOpen(false)} sections={activeSections} />

            <div style={{ flex: 1 }} />

            <Link
              href="/"
              className="mono"
              style={{
                border: '1px solid var(--line)',
                height: 34,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: 'var(--ink-3)',
                fontSize: 11,
                letterSpacing: '0.08em',
                background: 'var(--panel)',
                borderRadius: 8,
              }}
            >
              {'<- VOLTAR AO SITE'}
            </Link>
            {loading ? (
              <div style={{ height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>...</span>
              </div>
            ) : user ? (
              <a
                href="/api/auth/logto/sign-out"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  textAlign: 'center',
                  background: 'var(--line-strong)',
                  color: 'var(--ink-2)',
                  border: '1px solid var(--line-strong)',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  borderRadius: 8,
                }}
              >
                SAIR
              </a>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'block',
                  padding: '10px 16px',
                  textAlign: 'center',
                  background: 'var(--brand-2)',
                  color: 'white',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em',
                  borderRadius: 8,
                }}
              >
                ENTRAR →
              </Link>
            )}
          </aside>
        </>
      )}
    </>
  )
}

// Sidebar desktop — visível apenas em telas >= 1024px
export function AppSidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(
    () => typeof window !== 'undefined' && localStorage.getItem('mp-sidebar-collapsed') === '1'
  )
  const [user, setUser] = useState<{ name: string | null } | null>(null)
  const [loading, setLoading] = useState(true)
  const [flags, setFlags] = useState<Record<string, boolean>>({})

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

  useEffect(() => {
    localStorage.setItem('mp-sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  const activeSections = useMemo(() => {
    return NAV_SECTIONS.map((section) => {
      if (section.title === 'PAINEL CIDADÃO') {
        return {
          ...section,
          items: section.items.filter(
            (item) => item.href !== '/painel/comparar' || flags['comparativo_parlamentares']
          ),
        }
      }
      return section
    })
  }, [flags])

  const sidebarWidth = useMemo(() => (collapsed ? 74 : 224), [collapsed])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: sidebarWidth,
        minWidth: sidebarWidth,
        borderRight: '1px solid var(--line)',
        background: 'var(--bg)',
        padding: collapsed ? '14px 10px' : '16px 14px',
        position: 'sticky',
        top: 32,
        height: 'calc(100vh - 32px)',
        overflowY: 'auto',
        transition: 'width 0.18s ease, min-width 0.18s ease, padding 0.18s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: collapsed ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 14,
          gap: collapsed ? 10 : 8,
        }}
      >
        <Link href="/painel" style={{ display: 'inline-flex', alignItems: 'center' }} title="Inicio">
          {collapsed ? (
            <Image
              src="/icon.png"
              alt="Meus Politicos"
              height={32}
              width={32}
              style={{ height: 32, width: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          ) : (
            <Image
              src="/logos_meus-politicos_colorido_semfundo.png"
              alt="Meus Politicos"
              height={32}
              width={130}
              style={{ width: 'auto', height: 32, objectFit: 'contain', filter: 'brightness(0) invert(1)' }}
            />
          )}
        </Link>
        <button
          type="button"
          onClick={() => setCollapsed((v) => !v)}
          className="mono"
          style={{
            width: 28,
            height: 28,
            border: '1px solid var(--line)',
            background: 'var(--panel)',
            color: 'var(--ink-3)',
            fontSize: 10,
            cursor: 'pointer',
            borderRadius: 8,
          }}
          title={collapsed ? 'Expandir' : 'Recolher'}
        >
          {collapsed ? '→' : '←'}
        </button>
      </div>

      <SidebarBlock collapsed={collapsed} pathname={pathname} sections={activeSections} />

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {!collapsed && (
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
            1.680 parlamentares
          </span>
        )}
        <Link
          href="/"
          className="mono"
          style={{
            border: '1px solid var(--line)',
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            textDecoration: 'none',
            color: 'var(--ink-3)',
            fontSize: 10.5,
            letterSpacing: '0.08em',
            background: 'transparent',
            borderRadius: 8,
          }}
        >
          {collapsed ? 'HOME' : '<- VOLTAR AO SITE'}
        </Link>
        {loading ? (
          <div style={{ height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)' }}>...</span>
          </div>
        ) : user ? (
          collapsed ? (
            <a
              href="/api/auth/logto/sign-out"
              title="Sair da conta"
              style={{ display: 'flex', justifyContent: 'center', padding: 12, color: 'var(--brand-2)', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: 'rotate(180deg)' }}>
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
            </a>
          ) : (
            <a
              href="/api/auth/logto/sign-out"
              style={{
                display: 'block',
                padding: '10px 16px',
                textAlign: 'center',
                background: 'var(--line-strong)',
                color: 'var(--ink-2)',
                border: '1px solid var(--line-strong)',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                borderRadius: 8,
              }}
            >
              SAIR
            </a>
          )
        ) : (
          collapsed ? (
            <Link
              href="/login"
              title="Entrar / Criar conta"
              style={{ display: 'flex', justifyContent: 'center', padding: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </Link>
          ) : (
            <Link
              href="/login"
              style={{
                display: 'block',
                padding: '10px 16px',
                textAlign: 'center',
                background: 'var(--brand-2)',
                color: 'white',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
                borderRadius: 8,
              }}
            >
              ENTRAR →
            </Link>
          )
        )}
      </div>
    </div>
  )
}
