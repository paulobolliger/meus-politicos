'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'

type PoliticoResult = {
  id: string
  nome_civil: string | null
  nome_eleitoral: string | null
  foto_url: string | null
  codigo_siafi: string | null
  email: string | null
}

interface PoliticoEditorSectionProps {
  busca: string
  results: PoliticoResult[]
}

export function PoliticoEditorSection({ busca, results }: PoliticoEditorSectionProps) {
  const router = useRouter()
  const [query, setQuery] = useState(busca)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveMsg, setSaveMsg] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    startTransition(() => {
      router.push(`/admin/dados?busca=${encodeURIComponent(query)}`)
    })
  }

  async function handleSave(politico: PoliticoResult, formData: FormData) {
    setSaving(true)
    setSaveMsg(null)
    const payload = {
      foto_url: formData.get('foto_url') as string,
      nome_eleitoral: formData.get('nome_eleitoral') as string,
      codigo_siafi: formData.get('codigo_siafi') as string,
      email: formData.get('email') as string,
    }
    try {
      const res = await fetch(`/api/admin/politicos/${politico.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSaveMsg('Salvo com sucesso!')
        setEditingId(null)
        startTransition(() => router.refresh())
      } else {
        const j = await res.json() as { error?: string }
        setSaveMsg(`Erro: ${j.error ?? 'desconhecido'}`)
      }
    } catch {
      setSaveMsg('Erro de rede.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      {/* Search form */}
      <form
        onSubmit={handleSearch}
        style={{ display: 'flex', gap: 8, marginBottom: 20, maxWidth: 480 }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por nome..."
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--line)',
            borderRadius: 6,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            background: 'var(--panel)',
            color: 'var(--ink)',
          }}
        />
        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '8px 18px',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
            opacity: isPending ? 0.7 : 1,
          }}
        >
          Buscar
        </button>
      </form>

      {saveMsg && (
        <div
          style={{
            marginBottom: 12,
            fontSize: 13,
            color: saveMsg.startsWith('Erro') ? 'var(--neg)' : 'var(--pos)',
            fontStyle: 'italic',
          }}
        >
          {saveMsg}
        </div>
      )}

      {busca.length >= 2 && results.length === 0 && (
        <div style={{ color: 'var(--ink-3)', fontSize: 14 }}>
          Nenhum resultado para &ldquo;{busca}&rdquo;.
        </div>
      )}

      {results.length > 0 && (
        <div
          style={{
            background: 'var(--panel)',
            borderRadius: 10,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          {results.map((pol, idx) => (
            <div
              key={pol.id}
              style={{
                borderTop: idx > 0 ? '1px solid var(--line)' : 'none',
                padding: '14px 18px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--ink)' }}>
                    {pol.nome_eleitoral ?? pol.nome_civil}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>
                    {pol.nome_civil}
                  </div>
                </div>
                <button
                  onClick={() => setEditingId(editingId === pol.id ? null : pol.id)}
                  style={{
                    fontSize: 12,
                    color: 'var(--brand)',
                    background: 'transparent',
                    border: '1px solid var(--line)',
                    borderRadius: 5,
                    padding: '4px 12px',
                    cursor: 'pointer',
                    fontWeight: 500,
                  }}
                >
                  {editingId === pol.id ? 'Cancelar' : 'Editar'}
                </button>
              </div>

              {editingId === pol.id && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    void handleSave(pol, new FormData(e.currentTarget))
                  }}
                  style={{
                    marginTop: 12,
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: 10,
                  }}
                >
                  {[
                    { name: 'foto_url', label: 'URL da foto', defaultValue: pol.foto_url ?? '' },
                    { name: 'nome_eleitoral', label: 'Nome eleitoral', defaultValue: pol.nome_eleitoral ?? '' },
                    { name: 'codigo_siafi', label: 'Código SIAFI', defaultValue: pol.codigo_siafi ?? '' },
                    { name: 'email', label: 'E-mail', defaultValue: pol.email ?? '' },
                  ].map((field) => (
                    <label key={field.name} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                        {field.label}
                      </span>
                      <input
                        name={field.name}
                        defaultValue={field.defaultValue}
                        style={{
                          padding: '6px 10px',
                          fontSize: 13,
                          border: '1px solid var(--line)',
                          borderRadius: 5,
                          outline: 'none',
                          fontFamily: 'var(--font-sans)',
                          background: 'var(--bg)',
                          color: 'var(--ink)',
                        }}
                      />
                    </label>
                  ))}
                  <div
                    style={{
                      gridColumn: '1 / -1',
                      display: 'flex',
                      gap: 8,
                      marginTop: 4,
                    }}
                  >
                    <button
                      type="submit"
                      disabled={saving}
                      style={{
                        padding: '7px 18px',
                        background: 'var(--brand)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: 6,
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: 'pointer',
                        opacity: saving ? 0.7 : 1,
                      }}
                    >
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
