'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useTheme } from '@/components/app-shell/ThemeProvider'

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, toggle } = useTheme()
  return (
    <button
      type="button"
      onClick={toggle}
      className="mono"
      title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
      style={{
        width: '100%',
        height: 32,
        border: '1px solid var(--line)',
        background: 'var(--panel-2)',
        color: 'var(--ink-3)',
        fontSize: 10.5,
        letterSpacing: '0.08em',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
      }}
    >
      {theme === 'dark' ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
          {!collapsed && 'CLARO'}
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
          {!collapsed && 'ESCURO'}
        </>
      )}
    </button>
  )
}

type NavItem = {
  label: string
  href: string
  icon: ReactNode
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'EXPLORACAO',
    items: [
      {
        label: 'Inicio',
        href: '/home',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        ),
      },
      {
        label: 'Buscar',
        href: '/busca',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        ),
      },
      {
        label: 'Meu estado',
        href: '/meu-estado',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'MONITORAMENTO',
    items: [
      {
        label: 'Meus politicos',
        href: '/meus-politicos',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        ),
      },
    ],
  },
  {
    title: 'REFERENCIA',
    items: [
      {
        label: 'Metodologia',
        href: '/metodologia',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        ),
      },
      {
        label: 'Fontes',
        href: '/fontes',
        icon: (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
          </svg>
        ),
      },
    ],
  },
]

function isItemActive(pathname: string, href: string) {
  if (href === '/home') return pathname === '/home' || pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function SidebarBlock({
  collapsed,
  pathname,
  onNavigate,
}: {
  collapsed: boolean
  pathname: string
  onNavigate?: () => void
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {NAV_SECTIONS.map((section) => (
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
                  className="mono"
                  style={{
                    height: 34,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: collapsed ? 0 : 8,
                    padding: collapsed ? '0 8px' : '0 10px',
                    border: `1px solid ${active ? 'var(--brand-2)' : 'var(--line)'}`,
                    background: active ? 'var(--brand-soft)' : 'transparent',
                    color: active ? 'var(--brand-2)' : 'var(--ink-3)',
                    textDecoration: 'none',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    fontWeight: active ? 700 : 500,
                  }}
                  title={item.label}
                >
                  {item.icon}
                  {!collapsed && item.label}
                </Link>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

export function AppSidebar() {
  const pathname = usePathname()
  const { theme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('mp-sidebar-collapsed')
    if (saved === '1') setCollapsed(true)
  }, [])

  useEffect(() => {
    localStorage.setItem('mp-sidebar-collapsed', collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const sidebarWidth = useMemo(() => (collapsed ? 74 : 224), [collapsed])

  return (
    <>
      <div
        className="app-mobile-topbar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: 56,
          padding: '0 14px',
          borderBottom: '1px solid var(--line)',
          background: 'var(--panel)',
          position: 'sticky',
          top: 0,
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
          }}
        >
          MENU
        </button>
        <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', height: '98%' }}>
          <Image
                src="/logos_meus-politicos_colorido_semfundo.png"
                alt="Meus Politicos"
                height={247}
                width={1009}
                style={{ height: '100%', width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
              />
        </Link>
        <a
          href="https://meuspoliticos.com.br"
          className="mono"
          style={{ fontSize: 10.5, color: 'var(--ink-3)', textDecoration: 'none', letterSpacing: '0.06em' }}
        >
          site publico
        </a>
      </div>

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
          overflow: 'hidden',
          transition: 'width 0.18s ease, min-width 0.18s ease, padding 0.18s ease',
        }}
        className="app-sidebar-desktop"
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
          <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center' }} title="Inicio">
            {collapsed ? (
              <Image
                src="/icon.png"
                alt="Meus Politicos"
                height={32}
                width={32}
                style={{ height: 32, width: 32, objectFit: 'contain', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
              />
            ) : (
              <Image
                src="/logos_meus-politicos_colorido_semfundo.png"
                alt="Meus Politicos"
                height={32}
                width={130}
                style={{ height: 32, width: 'auto', objectFit: 'contain', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
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
            }}
            title={collapsed ? 'Expandir' : 'Recolher'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <SidebarBlock collapsed={collapsed} pathname={pathname} />

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {!collapsed && (
            <span className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
              513 deputados monitorados
            </span>
          )}
          <ThemeToggle collapsed={collapsed} />
          <a
            href="https://meuspoliticos.com.br"
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
            }}
          >
            {collapsed ? 'SITE' : '<- SITE PUBLICO'}
          </a>
          {collapsed ? (
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
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              ENTRAR →
            </Link>
          )}
        </div>
      </div>

      {mobileOpen && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10,14,26,0.48)',
              zIndex: 40,
            }}
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
                style={{ height: 30, width: 'auto', objectFit: 'contain', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
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
                }}
              >
                X
              </button>
            </div>

            <SidebarBlock collapsed={false} pathname={pathname} onNavigate={() => setMobileOpen(false)} />

            <div style={{ flex: 1 }} />

            <ThemeToggle collapsed={false} />
            <a
              href="https://meuspoliticos.com.br"
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
              }}
            >
              {'<- SITE PUBLICO'}
            </a>
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
                fontFamily: 'IBM Plex Mono, monospace',
                letterSpacing: '0.06em',
              }}
            >
              ENTRAR →
            </Link>
          </aside>
        </>
      )}

      <style>{`
        .app-sidebar-desktop {
          display: none;
        }
        @media (min-width: 1024px) {
          .app-sidebar-desktop {
            display: flex;
          }
        }
        @media (min-width: 1024px) {
          .app-mobile-topbar {
            display: none !important;
          }
        }
      `}</style>
    </>
  )
}




