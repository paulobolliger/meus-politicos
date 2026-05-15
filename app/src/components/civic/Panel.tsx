import type { HTMLAttributes, ReactNode } from 'react'
import { SourceCite } from './SourceCite'

export function Panel({ children, className, style }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 0,
        ...style,
      }}
      className={className}
    >
      {children}
    </div>
  )
}

export function PanelHeader({
  title,
  sub,
  action,
  source,
}: {
  title: string
  sub?: string
  action?: ReactNode
  source?: string
}) {
  return (
    <div
      style={{
        padding: '14px 20px',
        borderBottom: '1px solid var(--line)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div className="label">{title}</div>
        {sub && <div style={{ fontSize: 11, color: 'var(--mute)', marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {source && <SourceCite source={source} />}
        {action}
      </div>
    </div>
  )
}
