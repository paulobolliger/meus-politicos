'use client'

import { useState } from 'react'
import { StatusBadge } from './AdminCard'

type EtlRow = {
  id: string
  fonte: string
  tipo: string | null
  status: string
  criado_em: string
  duracao_ms: number | null
  registros: number | null
  mensagem: string | null
}

type EtlSource = {
  fonte: string
  latest: EtlRow
  history: EtlRow[]
}

interface EtlSourceCardProps {
  source: EtlSource
  defaultOpen: boolean
  badgeVariant: 'ok' | 'warn' | 'err' | 'never'
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function fmtDuration(ms: number | null): string {
  if (!ms) return '—'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(1)}s`
}

function fmtNum(n: number | null): string {
  if (n === null || n === undefined) return '—'
  return n.toLocaleString('pt-BR')
}

export function EtlSourceCard({ source, defaultOpen, badgeVariant }: EtlSourceCardProps) {
  const [open, setOpen] = useState(defaultOpen)
  const [logging, setLogging] = useState(false)
  const [logMsg, setLogMsg] = useState<string | null>(null)

  async function handleRodar() {
    setLogging(true)
    setLogMsg(null)
    try {
      const res = await fetch('/api/admin/etl/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fonte: source.fonte }),
      })
      const json = await res.json() as { message?: string; error?: string }
      setLogMsg(json.message ?? json.error ?? 'Registrado.')
    } catch (e) {
      setLogMsg('Erro ao chamar API.')
    } finally {
      setLogging(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '14px 20px',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: 1, minWidth: 0 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {source.fonte}
          </span>
          <StatusBadge variant={badgeVariant} label={source.latest.status} />
          <span
            style={{
              fontSize: 12,
              color: 'var(--ink-3)',
              fontFamily: 'var(--font-mono)',
            }}
          >
            {fmtDate(source.latest.criado_em)}
          </span>
        </div>
        <span style={{ color: 'var(--ink-3)', fontSize: 16, flexShrink: 0 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Expanded content */}
      {open && (
        <div style={{ borderTop: '1px solid var(--line)', padding: '16px 20px' }}>
          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <button
              onClick={handleRodar}
              disabled={logging}
              style={{
                background: badgeVariant === 'err' ? 'var(--brand)' : 'transparent',
                color: badgeVariant === 'err' ? '#fff' : 'var(--ink-2)',
                border: badgeVariant === 'err' ? 'none' : '1px solid var(--line)',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: logging ? 0.6 : 1,
              }}
            >
              {logging ? 'Solicitando...' : 'Solicitar execução'}
            </button>
            {logMsg && (
              <span style={{ fontSize: 13, color: 'var(--pos)', fontStyle: 'italic' }}>
                {logMsg}
              </span>
            )}
          </div>

          {/* History table */}
          <div style={{ overflowX: 'auto', marginBottom: 16 }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: 12.5,
                fontFamily: 'var(--font-mono)',
              }}
            >
              <thead>
                <tr style={{ background: 'var(--bg-2)' }}>
                  {['Data', 'Status', 'Duração', 'Registros', 'Mensagem'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '7px 10px',
                        textAlign: 'left',
                        fontWeight: 600,
                        color: 'var(--ink-3)',
                        fontSize: 11,
                        letterSpacing: '0.04em',
                        fontFamily: 'var(--font-sans)',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {source.history.map((row) => (
                  <tr key={row.id} style={{ borderTop: '1px solid var(--line)' }}>
                    <td style={{ padding: '6px 10px', color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {fmtDate(row.criado_em)}
                    </td>
                    <td style={{ padding: '6px 10px' }}>
                      <span
                        style={{
                          color:
                            row.status === 'ok' || row.status === 'sucesso'
                              ? 'var(--pos)'
                              : row.status === 'erro' || row.status === 'falha'
                              ? 'var(--neg)'
                              : 'var(--warn)',
                          fontWeight: 600,
                        }}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--ink-3)' }}>
                      {fmtDuration(row.duracao_ms)}
                    </td>
                    <td style={{ padding: '6px 10px', color: 'var(--ink-2)' }}>
                      {fmtNum(row.registros)}
                    </td>
                    <td
                      style={{
                        padding: '6px 10px',
                        color: 'var(--ink-3)',
                        maxWidth: 300,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {row.mensagem ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Terminal log viewer */}
          {source.latest.mensagem && (
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'var(--ink-3)',
                  letterSpacing: '0.06em',
                  marginBottom: 6,
                  fontFamily: 'var(--font-sans)',
                }}
              >
                LOG — ÚLTIMA EXECUÇÃO
              </div>
              <div
                style={{
                  background: '#0f1117',
                  borderRadius: 7,
                  padding: '14px 16px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 12,
                  color: '#b0e0a0',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                  overflowX: 'auto',
                  maxHeight: 200,
                  overflowY: 'auto',
                }}
              >
                {source.latest.mensagem}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
