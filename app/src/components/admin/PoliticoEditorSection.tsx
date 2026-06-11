'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'

type PoliticoResult = {
  id: string
  nome_civil: string | null
  nome_eleitoral: string | null
  foto_url: string | null
  codigo_siafi: string | null
  email: string | null
  partido_id: string | null
  situacao: string | null
  gabinete_nome: string | null
  gabinete_telefone: string | null
  gabinete_email: string | null
  uf: string
  cargo: string
}

interface PoliticoEditorSectionProps {
  busca: string
  results: PoliticoResult[]
  partidos: { id: string; sigla: string; nome: string }[]
}

const inputStyle = {
  padding: '6px 10px',
  fontSize: 13,
  border: '1px solid var(--line)',
  borderRadius: 5,
  outline: 'none',
  fontFamily: 'var(--font-sans)',
  background: 'var(--bg)',
  color: 'var(--ink)',
  width: '100%',
}

export function PoliticoEditorSection({ busca, results, partidos }: PoliticoEditorSectionProps) {
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
      foto_url: formData.get('foto_url') as string || null,
      nome_eleitoral: formData.get('nome_eleitoral') as string || null,
      codigo_siafi: formData.get('codigo_siafi') as string || null,
      email: formData.get('email') as string || null,
      partido_id: formData.get('partido_id') as string || null,
      situacao: formData.get('situacao') as string || null,
      gabinete_nome: formData.get('gabinete_nome') as string || null,
      gabinete_telefone: formData.get('gabinete_telefone') as string || null,
      gabinete_email: formData.get('gabinete_email') as string || null,
      uf: formData.get('uf') as string,
      cargo: formData.get('cargo') as string,
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
                    {pol.nome_civil} · {pol.cargo.replace('_', ' ').toUpperCase()} ({pol.uf})
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSaveMsg(null)
                    setEditingId(editingId === pol.id ? null : pol.id)
                  }}
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
                    gap: 12,
                  }}
                >
                  {/* Nome Eleitoral */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Nome Eleitoral
                    </span>
                    <input
                      name="nome_eleitoral"
                      defaultValue={pol.nome_eleitoral ?? ''}
                      required
                      style={inputStyle}
                    />
                  </label>

                  {/* Foto URL */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      URL da foto
                    </span>
                    <input
                      name="foto_url"
                      defaultValue={pol.foto_url ?? ''}
                      style={inputStyle}
                    />
                  </label>

                  {/* E-mail do Político */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      E-mail do Político
                    </span>
                    <input
                      name="email"
                      type="email"
                      defaultValue={pol.email ?? ''}
                      style={inputStyle}
                    />
                  </label>

                  {/* Código SIAFI */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Código SIAFI
                    </span>
                    <input
                      name="codigo_siafi"
                      defaultValue={pol.codigo_siafi ?? ''}
                      style={inputStyle}
                    />
                  </label>

                  {/* Partido Dropdown */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Partido Político
                    </span>
                    <select
                      name="partido_id"
                      defaultValue={pol.partido_id ?? ''}
                      style={inputStyle}
                    >
                      <option value="">Sem Partido / Nenhum</option>
                      {partidos.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sigla} — {p.nome}
                        </option>
                      ))}
                    </select>
                  </label>

                  {/* Situação Dropdown */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Situação
                    </span>
                    <select
                      name="situacao"
                      defaultValue={pol.situacao ?? ''}
                      style={inputStyle}
                    >
                      <option value="">Nenhuma</option>
                      <option value="ativo">Ativo</option>
                      <option value="licenciado">Licenciado</option>
                      <option value="suplente">Suplente</option>
                      <option value="afastado">Afastado</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </label>

                  {/* Cargo Dropdown */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Cargo
                    </span>
                    <select
                      name="cargo"
                      defaultValue={pol.cargo}
                      required
                      style={inputStyle}
                    >
                      <option value="presidente">Presidente</option>
                      <option value="vice_presidente">Vice Presidente</option>
                      <option value="governador">Governador</option>
                      <option value="vice_governador">Vice Governador</option>
                      <option value="senador">Senador</option>
                      <option value="deputado_federal">Deputado Federal</option>
                      <option value="deputado_estadual">Deputado Estadual</option>
                      <option value="prefeito">Prefeito</option>
                      <option value="vice_prefeito">Vice Prefeito</option>
                      <option value="vereador">Vereador</option>
                    </select>
                  </label>

                  {/* UF */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      UF
                    </span>
                    <input
                      name="uf"
                      defaultValue={pol.uf}
                      required
                      maxLength={2}
                      style={inputStyle}
                    />
                  </label>

                  {/* Gabinete Nome */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Nome do Gabinete
                    </span>
                    <input
                      name="gabinete_nome"
                      defaultValue={pol.gabinete_nome ?? ''}
                      style={inputStyle}
                    />
                  </label>

                  {/* Gabinete Telefone */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      Telefone do Gabinete
                    </span>
                    <input
                      name="gabinete_telefone"
                      defaultValue={pol.gabinete_telefone ?? ''}
                      style={inputStyle}
                    />
                  </label>

                  {/* Gabinete E-mail */}
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 3, gridColumn: '1 / -1' }}>
                    <span style={{ fontSize: 11.5, fontWeight: 500, color: 'var(--ink-3)' }}>
                      E-mail do Gabinete
                    </span>
                    <input
                      name="gabinete_email"
                      type="email"
                      defaultValue={pol.gabinete_email ?? ''}
                      style={inputStyle}
                    />
                  </label>

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
