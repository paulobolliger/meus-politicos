'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SIDEBAR_BG = '#0f1f4d'
const SIDEBAR_HOVER = 'rgba(255,255,255,0.06)'
const SIDEBAR_ACTIVE = 'rgba(255,255,255,0.10)'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: '◉', exact: true },
  { label: 'ETL Monitor', href: '/admin/etl', icon: '⚡' },
  { label: 'Qualidade', href: '/admin/dados', icon: '✦' },
  { label: 'Usuários', href: '/admin/usuarios', icon: '👤' },
  { label: 'Analytics', href: '/admin/analytics', icon: '📊' },
  { label: 'Feature flags', href: '/admin/flags', icon: '⚑' },
]

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href
  return pathname === href || pathname.startsWith(`${href}/`)
}

interface AdminSidebarProps {
  email: string
}

export function AdminSidebar({ email }: AdminSidebarProps) {
  const pathname = usePathname()

  return (
    <aside
      style={{
        width: 220,
        minWidth: 220,
        background: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        color: '#fff',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: '#fff',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              color: SIDEBAR_BG,
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, color: '#fff' }}>
              Meus Políticos
            </div>
            <span
              style={{
                display: 'inline-block',
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.08em',
                background: '#f97316',
                color: '#fff',
                borderRadius: 3,
                padding: '1px 5px',
                marginTop: 2,
              }}
            >
              ADMIN
            </span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '8px 0' }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                color: active ? '#fff' : 'rgba(255,255,255,0.72)',
                background: active ? SIDEBAR_ACTIVE : 'transparent',
                textDecoration: 'none',
                borderRadius: 6,
                margin: '1px 8px',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!active)
                  e.currentTarget.style.background = SIDEBAR_HOVER
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                if (!active)
                  e.currentTarget.style.background = 'transparent'
              }}
            >
              <span style={{ width: 18, textAlign: 'center', fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: 12,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            {email.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'rgba(255,255,255,0.65)',
              fontSize: 11.5,
            }}
          >
            {email}
          </div>
        </div>
        <Link
          href="/"
          style={{
            display: 'block',
            color: 'rgba(255,255,255,0.50)',
            textDecoration: 'none',
            fontSize: 12,
            padding: '5px 0',
          }}
        >
          ← Voltar ao site
        </Link>
      </div>
    </aside>
  )
}
