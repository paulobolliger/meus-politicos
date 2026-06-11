'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type FeatureFlag = {
  id: string
  slug: string
  descricao: string | null
  ativo: boolean
  rollout_pct: number
  atualizado_em: string
}

interface FeatureFlagListProps {
  flags: FeatureFlag[]
}

const inputStyle = {
  padding: '8px 12px',
  fontSize: 13,
  border: '1px solid var(--line)',
  borderRadius: 5,
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  width: '100%',
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

export function FeatureFlagList({ flags }: FeatureFlagListProps) {
  const router = useRouter()
  const [slug, setSlug] = useState('')
  const [descricao, setDescricao] = useState('')
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!slug.trim()) return
    setCreating(true)
    setMsg(null)

    try {
      const res = await fetch('/api/admin/flags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, descricao }),
      })
      if (res.ok) {
        setSlug('')
        setDescricao('')
        setMsg('Feature flag criada!')
        startTransition(() => router.refresh())
      } else {
        const j = await res.json() as { error?: string }
        setMsg(`Erro: ${j.error ?? 'desconhecido'}`)
      }
    } catch {
      setMsg('Erro de rede.')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Creation Form */}
      <div
        style={{
          background: 'var(--panel)',
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          padding: '16px 20px',
        }}
      >
        <h3 style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--ink)', marginBottom: 12 }}>
          Nova Feature Flag
        </h3>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 12 }}>
            <input
              type="text"
              placeholder="Slug da flag (ex: nova-busca)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="Descrição (ex: Ativa novo algoritmo de busca)"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
            <button
              type="submit"
              disabled={creating || isPending}
              style={{
                padding: '7px 16px',
                background: 'var(--brand)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                fontSize: 12.5,
                fontWeight: 500,
                cursor: 'pointer',
                opacity: (creating || isPending) ? 0.7 : 1,
              }}
            >
              {creating ? 'Criando...' : 'Adicionar Flag'}
            </button>
            {msg && (
              <span
                style={{
                  fontSize: 12.5,
                  color: msg.startsWith('Erro') ? 'var(--neg)' : 'var(--pos)',
                  fontStyle: 'italic',
                }}
              >
                {msg}
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Flag List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {flags.map((flag) => (
          <FlagCard key={flag.id} flag={flag} />
        ))}
        {flags.length === 0 && (
          <div
            style={{
              background: 'var(--panel)',
              borderRadius: 10,
              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
              padding: '24px',
              textAlign: 'center',
              color: 'var(--ink-3)',
              fontSize: 14,
            }}
          >
            Nenhuma feature flag cadastrada.
          </div>
        )}
      </div>
    </div>
  )
}

function FlagCard({ flag }: { flag: FeatureFlag }) {
  const router = useRouter()
  const [ativo, setAtivo] = useState(flag.ativo)
  const [rollout, setRollout] = useState(flag.rollout_pct)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function handleToggle() {
    const newAtivo = !ativo
    setAtivo(newAtivo)
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id, ativo: newAtivo }),
      })
      if (res.ok) {
        setMsg('Salvo!')
        startTransition(() => router.refresh())
      } else {
        const j = await res.json() as { error?: string }
        setMsg(`Erro: ${j.error}`)
        setAtivo(!newAtivo) // revert
      }
    } catch {
      setMsg('Erro de rede')
      setAtivo(!newAtivo)
    } finally {
      setSaving(false)
    }
  }

  async function handleRolloutSave() {
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id, rollout_pct: rollout }),
      })
      if (res.ok) {
        setMsg('Salvo!')
        startTransition(() => router.refresh())
      } else {
        const j = await res.json() as { error?: string }
        setMsg(`Erro: ${j.error}`)
      }
    } catch {
      setMsg('Erro de rede')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm(`Tem certeza de que deseja excluir permanentemente a feature flag "${flag.slug}"?`)) {
      return
    }
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/flags', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: flag.id }),
      })
      if (res.ok) {
        startTransition(() => router.refresh())
      } else {
        const j = await res.json() as { error?: string }
        setMsg(`Erro ao excluir: ${j.error}`)
        setSaving(false)
      }
    } catch {
      setMsg('Erro de rede ao excluir.')
      setSaving(false)
    }
  }

  return (
    <div
      style={{
        background: 'var(--panel)',
        borderRadius: 10,
        boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--ink)',
              }}
            >
              {flag.slug}
            </span>
            <span
              style={{
                display: 'inline-block',
                borderRadius: 999,
                padding: '1px 9px',
                fontSize: 11,
                fontWeight: 600,
                background: ativo ? 'var(--pos-soft)' : 'var(--bg-2)',
                color: ativo ? 'var(--pos)' : 'var(--ink-3)',
              }}
            >
              {ativo ? 'ON' : 'OFF'}
            </span>
          </div>
          {flag.descricao && (
            <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: '4px 0 0' }}>
              {flag.descricao}
            </p>
          )}
          <p style={{ fontSize: 11.5, color: 'var(--ink-3)', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
            Atualizado em {fmtDate(flag.atualizado_em)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          {/* Toggle */}
          <button
            onClick={handleToggle}
            disabled={saving}
            title={ativo ? 'Desativar' : 'Ativar'}
            style={{
              width: 46,
              height: 26,
              borderRadius: 13,
              background: ativo ? 'var(--pos)' : 'var(--line-strong)',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
              opacity: saving ? 0.6 : 1,
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: ativo ? 23 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                transition: 'left 0.2s',
              }}
            />
          </button>

          {/* Delete Button */}
          <button
            onClick={handleDelete}
            disabled={saving}
            title="Excluir flag"
            style={{
              background: 'transparent',
              border: '1px solid var(--line)',
              color: 'var(--neg)',
              borderRadius: 5,
              padding: '4px 12px',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'background 0.1s, border-color 0.1s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--neg-soft)'
              e.currentTarget.style.borderColor = 'var(--neg)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.borderColor = 'var(--line)'
            }}
          >
            Excluir
          </button>
        </div>
      </div>

      {/* Rollout slider */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
        <label
          style={{
            fontSize: 12,
            color: 'var(--ink-3)',
            fontWeight: 500,
            whiteSpace: 'nowrap',
          }}
        >
          Rollout:
        </label>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={rollout}
          onChange={(e) => setRollout(Number(e.target.value))}
          style={{ flex: 1, accentColor: 'var(--brand)' }}
        />
        <span
          style={{
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            color: 'var(--ink-2)',
            minWidth: 36,
            textAlign: 'right',
          }}
        >
          {rollout}%
        </span>
        {rollout !== flag.rollout_pct && (
          <button
            onClick={handleRolloutSave}
            disabled={saving}
            style={{
              padding: '4px 12px',
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 5,
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              opacity: saving ? 0.7 : 1,
              flexShrink: 0,
            }}
          >
            Salvar
          </button>
        )}
      </div>

      {msg && (
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: msg.startsWith('Erro') ? 'var(--neg)' : 'var(--pos)',
            fontStyle: 'italic',
          }}
        >
          {msg}
        </div>
      )}
    </div>
  )
}
