import React from 'react'

interface AdminCardProps {
  children: React.ReactNode
  style?: React.CSSProperties
}

export function AdminCard({ children, style }: AdminCardProps) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: '20px 24px',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

interface AdminPageHeaderProps {
  title: string
  subtitle?: string
}

export function AdminPageHeader({ title, subtitle }: AdminPageHeaderProps) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--ink)', margin: 0 }}>{title}</h1>
      {subtitle && (
        <p style={{ fontSize: 14, color: 'var(--ink-3)', margin: '4px 0 0' }}>{subtitle}</p>
      )}
    </div>
  )
}

type BadgeVariant = 'ok' | 'warn' | 'err' | 'never' | 'info'

const BADGE_STYLES: Record<BadgeVariant, React.CSSProperties> = {
  ok: { background: 'var(--pos-soft)', color: 'var(--pos)' },
  warn: { background: 'var(--warn-soft)', color: 'var(--warn)' },
  err: { background: 'var(--neg-soft)', color: 'var(--neg)' },
  never: { background: 'var(--bg-2)', color: 'var(--ink-3)' },
  info: { background: 'var(--brand-soft)', color: 'var(--brand)' },
}

interface StatusBadgeProps {
  variant: BadgeVariant
  label: string
}

export function StatusBadge({ variant, label }: StatusBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-block',
        borderRadius: 999,
        padding: '2px 10px',
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: '0.02em',
        ...BADGE_STYLES[variant],
      }}
    >
      {label}
    </span>
  )
}

interface KpiCardProps {
  label: string
  value: string | number
  sub?: string
}

export function KpiCard({ label, value, sub }: KpiCardProps) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: '16px 20px',
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 12, color: 'var(--ink-3)', fontWeight: 500, marginBottom: 6 }}>
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 700,
          fontFamily: 'var(--font-mono)',
          fontVariantNumeric: 'tabular-nums',
          color: 'var(--ink)',
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{sub}</div>
      )}
    </div>
  )
}
