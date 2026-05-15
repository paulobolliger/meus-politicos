'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from '@/components/app-shell/ThemeProvider'

type NavItem = {
  label: string
  short: string
  href: string
}

type NavSection = {
  title: string
  items: NavItem[]
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'EXPLORACAO',
    items: [
      { label: 'Inicio', short: 'IN', href: '/home' },
      { label: 'Buscar', short: 'BU', href: '/busca' },
      { label: 'Meu estado', short: 'UF', href: '/meu-estado' },
    ],
  },
  {
    title: 'MONITORAMENTO',
    items: [{ label: 'Meus politicos', short: 'MP', href: '/meus-politicos' }],
  },
  {
    title: 'REFERENCIA',
    items: [
      { label: 'Metodologia', short: 'ME', href: '/metodologia' },
      { label: 'Fontes', short: 'FO', href: '/fontes' },
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
                    padding: collapsed ? '0 8px' : '0 10px',
                    border: `1px solid ${active ? 'var(--brand-2)' : 'var(--line)'}`,
                    background: active ? 'var(--brand-soft)' : 'var(--panel)',
                    color: active ? 'var(--brand-2)' : 'var(--ink-3)',
                    textDecoration: 'none',
                    fontSize: 11,
                    letterSpacing: '0.06em',
                    fontWeight: active ? 700 : 500,
                  }}
                  title={item.label}
                >
                  {collapsed ? item.short : item.label}
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
            height={50}
            width={246}
            style={{ height: 50, width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
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
          flexDirection: 'column',
          width: sidebarWidth,
          minWidth: sidebarWidth,
          borderRight: '1px solid var(--line)',
          background: 'var(--panel)',
          padding: collapsed ? '14px 10px' : '16px 14px',
          position: 'sticky',
          top: 32,
          height: 'calc(100vh - 32px)',
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
          <Link href="/home" style={{ display: 'inline-flex', alignItems: 'center', height: '100%' }} title="Inicio">
            {collapsed ? (
              <Image src="/icon.png" alt="Meus Politicos" height={48} width={48} style={{ height: 48, width: 48, filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }} />
            ) : (
              <Image
                src="/logos_meus-politicos_colorido_semfundo.png"
                alt="Meus Politicos"
                height={56}
                width={276}
                style={{ height: 56, width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
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
              background: 'var(--panel)',
            }}
          >
            {collapsed ? 'SITE' : '<- SITE PUBLICO'}
          </a>
          <div style={{ display: 'grid', gap: 6 }}>
            <Link
              href="/login"
              className="mono"
              style={{
                border: '1px solid var(--line-strong)',
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: 'var(--ink-2)',
                fontSize: 10.5,
                letterSpacing: '0.08em',
              }}
            >
              {collapsed ? 'IN' : 'ENTRAR'}
            </Link>
            <Link
              href="/cadastro"
              className="mono"
              style={{
                border: '1px solid var(--brand)',
                background: 'var(--brand)',
                height: 32,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                textDecoration: 'none',
                color: 'white',
                fontSize: 10.5,
                letterSpacing: '0.08em',
              }}
            >
              {collapsed ? 'UP' : 'CRIAR CONTA'}
            </Link>
          </div>
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
              background: 'var(--panel)',
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
                height={52}
                width={256}
                style={{ height: 52, width: 'auto', filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none' }}
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
            <div style={{ display: 'grid', gap: 6 }}>
              <Link
                href="/login"
                onClick={() => setMobileOpen(false)}
                className="mono"
                style={{
                  border: '1px solid var(--line-strong)',
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: 'var(--ink-2)',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                }}
              >
                ENTRAR
              </Link>
              <Link
                href="/cadastro"
                onClick={() => setMobileOpen(false)}
                className="mono"
                style={{
                  border: '1px solid var(--brand)',
                  background: 'var(--brand)',
                  height: 34,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textDecoration: 'none',
                  color: 'white',
                  fontSize: 11,
                  letterSpacing: '0.08em',
                }}
              >
                CRIAR CONTA
              </Link>
            </div>
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
