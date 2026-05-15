'use client'

import { useEffect, useState } from 'react'
import { StatusDot } from './StatusDot'
import { useTheme } from '@/components/app-shell/ThemeProvider'

export function SystemBar() {
  const [time, setTime] = useState('')
  const { theme, toggle } = useTheme()

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
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          height: 32,
          gap: 24,
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
        <button
          onClick={toggle}
          className="mono"
          style={{
            background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'var(--panel)',
            border: theme === 'dark' ? '1px solid rgba(255,255,255,0.2)' : '1px solid var(--line-strong)',
            color: theme === 'dark' ? 'rgba(255,255,255,0.85)' : 'var(--ink-3)',
            cursor: 'pointer',
            padding: '2px 8px',
            fontSize: 10,
            letterSpacing: '0.08em',
          }}
        >
          {theme === 'dark' ? '☀ LIGHT' : '● DARK'}
        </button>
      </div>
    </div>
  )
}
