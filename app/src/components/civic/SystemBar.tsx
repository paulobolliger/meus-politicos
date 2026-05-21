'use client'

import { useEffect, useState } from 'react'
import { StatusDot } from './StatusDot'

export function SystemBar() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const fmt = () => {
      const d = new Date()
      setTime(
        `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(
          d.getSeconds()
        ).padStart(2, '0')}`
      )
    }
    fmt()
    const id = setInterval(fmt, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div
      className="mono"
      style={{
        background: 'var(--bg-2)',
        borderBottom: '1px solid var(--line)',
        fontSize: 10.5,
        color: 'var(--ink-3)',
        letterSpacing: '0.04em',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          minHeight: 32,
          gap: 16,
          overflowX: 'auto',
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <StatusDot tone="live" /> SISTEMA ONLINE
        </span>
        <span style={{ color: 'var(--mute)' }}>·</span>
        <span>
          API CÂMARA <span style={{ color: 'var(--pos)' }}>200 OK</span>
        </span>
        <span style={{ color: 'var(--mute)' }}>·</span>
        <span>
          API SENADO <span style={{ color: 'var(--pos)' }}>200 OK</span>
        </span>
        <span style={{ color: 'var(--mute)' }}>·</span>
        <span>
          TSE <span style={{ color: 'var(--warn)' }}>EM COLETA</span>
        </span>
        <div style={{ flex: 1 }} />
        <span>BSB / UTC-3 · {time}</span>
      </div>
    </div>
  )
}
