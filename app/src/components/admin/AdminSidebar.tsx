'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Zap,
  CheckSquare,
  Users,
  BarChart3,
  Flag,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/admin', icon: <LayoutDashboard size={18} />, exact: true },
  { label: 'ETL Monitor', href: '/admin/etl', icon: <Zap size={18} /> },
  { label: 'Qualidade', href: '/admin/dados', icon: <CheckSquare size={18} /> },
  { label: 'Usuários', href: '/admin/usuarios', icon: <Users size={18} /> },
  { label: 'Analytics', href: '/admin/analytics', icon: <BarChart3 size={18} /> },
  { label: 'Feature flags', href: '/admin/flags', icon: <Flag size={18} /> },
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
        background: 'var(--bg)',
        borderRight: '1px solid var(--line)',
        display: 'flex',
        flexDirection: 'column',
        color: 'var(--ink)',
        fontFamily: 'var(--font-sans)',
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: '20px 16px 16px',
          borderBottom: '1px solid var(--line)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: 'var(--brand)',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: 18,
              color: '#fff',
              flexShrink: 0,
            }}
          >
            M
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, lineHeight: 1.2, color: 'var(--ink)' }}>
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
      <nav style={{ flex: 1, padding: '8px 0', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href, item.exact)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`mono sidebar-item ${active ? 'sidebar-item-active' : ''}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 16px',
                fontSize: 13.5,
                textDecoration: 'none',
                margin: '1px 8px',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 18 }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: '12px 16px',
          borderTop: '1px solid var(--line)',
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
              background: 'var(--line-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              fontWeight: 600,
              flexShrink: 0,
              color: 'var(--ink)',
            }}
          >
            {email.charAt(0).toUpperCase()}
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: 'var(--ink-3)',
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
            color: 'var(--ink-3)',
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
