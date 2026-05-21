'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

interface MatchEmendaButtonProps {
  nomeParlamentar: string
}

export function MatchEmendaButton({ nomeParlamentar }: MatchEmendaButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<{ id: string; nome_eleitoral: string | null; uf: string | null; cargo: string }[]>([])
  const [buscando, setBuscando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [, startTransition] = useTransition()

  async function handleBuscar() {
    if (busca.length < 2) return
    setBuscando(true)
    setResultados([])
    try {
      const res = await fetch(`/api/busca?q=${encodeURIComponent(busca)}&porPagina=10`)
      const json = await res.json() as { items?: { id: string; nome_eleitoral: string | null; uf: string | null; cargo: string }[] }
      setResultados(json.items ?? [])
    } catch {
      setMsg('Erro ao buscar políticos')
    } finally {
      setBuscando(false)
    }
  }

  async function handleMatch(politicoId: string) {
    setSalvando(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/emendas/match', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nome_parlamentar: nomeParlamentar, politico_id: politicoId }),
      })
      const json = await res.json() as { ok?: boolean; emendas_atualizadas?: number; error?: string }
      if (json.ok) {
        setMsg(`✓ ${json.emendas_atualizadas} emenda(s) vinculada(s)`)
        setOpen(false)
        startTransition(() => router.refresh())
      } else {
        setMsg(`Erro: ${json.error}`)
      }
    } catch {
      setMsg('Erro de rede')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setMsg(null) }}
        style={{
          fontSize: 12,
          color: 'var(--brand)',
          background: 'transparent',
          border: '1px solid var(--line)',
          borderRadius: 5,
          padding: '3px 10px',
          cursor: 'pointer',
          fontWeight: 500,
        }}
      >
        Match manual
      </button>

      {msg && !open && (
        <span style={{ fontSize: 12, color: 'var(--pos)', marginLeft: 8 }}>{msg}</span>
      )}

      {open && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: 12,
              padding: '24px 28px',
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>Match manual</div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                  Vinculando emendas de: <strong>{nomeParlamentar}</strong>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--ink-3)', padding: '0 0 0 8px' }}
              >
                ×
              </button>
            </div>

            {/* Busca de político */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                placeholder="Nome do político..."
                autoFocus
                style={{
                  flex: 1,
                  padding: '8px 12px',
                  fontSize: 13,
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  outline: 'none',
                  background: 'var(--bg)',
                  color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                }}
              />
              <button
                onClick={handleBuscar}
                disabled={buscando || busca.length < 2}
                style={{
                  padding: '8px 16px',
                  background: 'var(--brand)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  cursor: 'pointer',
                  opacity: buscando ? 0.7 : 1,
                }}
              >
                {buscando ? '...' : 'Buscar'}
              </button>
            </div>

            {/* Resultados */}
            {resultados.length > 0 && (
              <div
                style={{
                  border: '1px solid var(--line)',
                  borderRadius: 8,
                  overflow: 'hidden',
                  maxHeight: 240,
                  overflowY: 'auto',
                }}
              >
                {resultados.map((pol, idx) => (
                  <div
                    key={pol.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '9px 12px',
                      borderTop: idx > 0 ? '1px solid var(--line)' : 'none',
                      background: 'var(--bg)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                        {pol.nome_eleitoral}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                        {pol.cargo} · {pol.uf}
                      </div>
                    </div>
                    <button
                      onClick={() => handleMatch(pol.id)}
                      disabled={salvando}
                      style={{
                        padding: '4px 12px',
                        background: 'var(--brand)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 5,
                        fontSize: 12,
                        cursor: 'pointer',
                        fontWeight: 500,
                        opacity: salvando ? 0.7 : 1,
                        flexShrink: 0,
                      }}
                    >
                      Vincular
                    </button>
                  </div>
                ))}
              </div>
            )}

            {resultados.length === 0 && busca.length >= 2 && !buscando && (
              <div style={{ fontSize: 13, color: 'var(--ink-3)', textAlign: 'center', padding: '12px 0' }}>
                Nenhum resultado.
              </div>
            )}

            {msg && (
              <div style={{ marginTop: 12, fontSize: 13, color: msg.startsWith('Erro') ? 'var(--neg)' : 'var(--pos)' }}>
                {msg}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
