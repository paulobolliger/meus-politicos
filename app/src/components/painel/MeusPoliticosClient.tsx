'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Bell, Download, Scale, Search, Star, Trash2, User } from 'lucide-react'

import { Panel } from '@/components/civic'

export type SeguidoPolitico = {
  id: string
  slug: string
  nome: string
  nomeEleitoral: string
  partido: string
  uf: string
  cargo: string
  fotoUrl: string | null
  presencaPctAtual: number | null
  tipo: 'voto' | 'seguir'
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Deputado Federal',
  senador: 'Senador',
  governador: 'Governador',
  prefeito: 'Prefeito',
  deputado_estadual: 'Dep. Estadual',
  vereador: 'Vereador',
}

const CARGO_COLORS: Record<string, string> = {
  deputado_federal: 'var(--brand-2)',
  senador: 'var(--pos)',
  governador: 'var(--accent)',
  prefeito: '#7c3aed',
  deputado_estadual: 'var(--warn)',
  vereador: '#ec4899',
}

function initials(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

export function MeusPoliticosClient({ initialSeguindo, isPremium = false }: { initialSeguindo: SeguidoPolitico[]; isPremium?: boolean }) {
  const [list, setList] = useState<SeguidoPolitico[]>(initialSeguindo)
  const [filterType, setFilterType] = useState<'all' | 'voto' | 'seguir'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const handleExportCSV = () => {
    if (!isPremium) {
      setModalOpen(true)
      return
    }

    const headers = ['ID', 'Nome Eleitoral', 'Nome Civil', 'Cargo', 'Partido', 'UF', 'Presenca Atual (%)', 'Tipo']
    const rows = list.map((p) => [
      p.id,
      p.nomeEleitoral,
      p.nome,
      p.cargo,
      p.partido,
      p.uf,
      p.presencaPctAtual ?? '',
      p.tipo,
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((e) => e.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `meus-politicos-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleUnfollow = async (id: string) => {
    setRemovingId(id)
    try {
      const res = await fetch(`/api/acompanhamentos/${id}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        setList((prev) => prev.filter((p) => p.id !== id))
      }
    } catch (err) {
      console.error('Failed to unfollow:', err)
    } finally {
      setRemovingId(null)
    }
  }

  const filteredList = list.filter((p) => {
    const matchesType = filterType === 'all' || p.tipo === filterType
    const matchesSearch =
      p.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nomeEleitoral.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.partido.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.uf.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesType && matchesSearch
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Barra de Filtros e Busca */}
      <div style={{
        display: 'flex',
        gap: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        padding: '16px 20px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
      }}>
        {/* Filtros de Tipo */}
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'voto', 'seguir'] as const).map((type) => {
            const active = filterType === type
            const label = type === 'all' ? 'Todos' : type === 'voto' ? 'Meu Voto' : 'Seguindo'
            const icon = type === 'voto' ? '⭐️ ' : type === 'seguir' ? '🔔 ' : ''
            return (
              <button
                key={type}
                type="button"
                onClick={() => setFilterType(type)}
                className="mono"
                style={{
                  height: 32,
                  padding: '0 14px',
                  borderRadius: 8,
                  border: `1px solid ${active ? 'var(--brand-2)' : 'var(--line)'}`,
                  background: active ? 'var(--brand-soft)' : 'transparent',
                  color: active ? 'var(--brand-2)' : 'var(--ink-3)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                {icon}{label}
              </button>
            )
          })}
        </div>

        {/* Ações e Campo de Busca */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportCSV}
            type="button"
            className="mono"
            style={{
              height: 36,
              padding: '0 14px',
              borderRadius: 8,
              border: '1px solid var(--line)',
              background: 'var(--bg)',
              color: 'var(--ink-2)',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Download size={14} /> Exportar CSV
          </button>

          <div style={{ position: 'relative', width: '100%', minWidth: 240, maxWidth: 300 }}>
            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--mute)' }} />
            <input
              type="text"
              placeholder="Buscar por nome, partido ou UF..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mono"
              style={{
                width: '100%',
                height: 36,
                borderRadius: 8,
                border: '1px solid var(--line)',
                background: 'var(--bg)',
                color: 'var(--ink)',
                padding: '0 12px 0 36px',
                fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        </div>
      </div>

      {/* Grid de Políticos */}
      {filteredList.length === 0 ? (
        <Panel>
          <div style={{ padding: '60px 24px', textAlign: 'center', color: 'var(--ink-3)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 8px' }}>Nenhum político encontrado</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13 }}>Você não acompanha nenhum político que corresponda a estes filtros.</p>
            <Link href="/busca" style={{
              display: 'inline-flex',
              alignItems: 'center',
              height: 38,
              padding: '0 16px',
              borderRadius: 8,
              background: 'var(--brand-2)',
              color: 'white',
              fontSize: 13,
              fontWeight: 600,
              textDecoration: 'none',
            }}>
              Adicionar mais políticos
            </Link>
          </div>
        </Panel>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20,
        }}>
          {filteredList.map((p) => {
            const isVoto = p.tipo === 'voto'
            const cargoLabel = CARGO_LABEL[p.cargo] ?? p.cargo
            const borderCol = CARGO_COLORS[p.cargo] ?? 'var(--line)'
            return (
              <div
                key={p.id}
                style={{
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 16,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  position: 'relative',
                }}
              >
                {/* Indicador de Tipo (Canto Superior Direito) */}
                <div style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  zIndex: 5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: isVoto ? 'rgba(245, 158, 11, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                  color: isVoto ? '#F59E0B' : '#6366F1',
                  border: `1px solid ${isVoto ? '#F59E0B' : '#6366F1'}33`,
                }} title={isVoto ? 'Meu Voto' : 'Seguindo'}>
                  {isVoto ? <Star size={16} fill="currentColor" /> : <Bell size={16} />}
                </div>

                {/* Bloco de Informações */}
                <div style={{ padding: '24px 20px 16px', display: 'flex', gap: 16, alignItems: 'flex-start', borderBottom: '1px solid var(--line)' }}>
                  {/* Foto/Avatar */}
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    background: 'var(--bg)',
                    border: `2px solid ${borderCol}`,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {p.fotoUrl ? (
                      <img src={p.fotoUrl} alt={p.nomeEleitoral} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: 20, fontWeight: 700, color: borderCol }}>
                        {initials(p.nomeEleitoral)}
                      </span>
                    )}
                  </div>

                  {/* Nome e Cargo */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{
                      margin: '0 0 4px',
                      fontSize: 16,
                      fontWeight: 700,
                      color: 'var(--ink)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.nomeEleitoral}
                    </h3>
                    <div style={{ fontSize: 11, fontWeight: 700, color: borderCol, textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
                      {cargoLabel}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                      <span style={{ fontWeight: 650, color: 'var(--ink-2)' }}>{p.partido}</span> · {p.uf}
                    </div>
                  </div>
                </div>

                {/* Métricas rápidas */}
                <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(30, 41, 59, 0.2)', borderBottom: '1px solid var(--line)' }}>
                  <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>PRESENÇA NAS SESSÕES</span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: p.presencaPctAtual == null ? 'var(--ink-3)' : p.presencaPctAtual >= 80 ? 'var(--pos)' : p.presencaPctAtual >= 60 ? 'var(--warn)' : 'var(--neg)',
                  }}>
                    {p.presencaPctAtual == null ? '–' : `${Math.round(p.presencaPctAtual)}%`}
                  </span>
                </div>

                {/* Botões de Ação */}
                <div style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center', marginTop: 'auto' }}>
                  <Link href={`/painel/politicos/${p.slug}`} style={{
                    flex: 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-2)',
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                  }}>
                    <User size={14} style={{ marginRight: 6 }} /> Perfil
                  </Link>

                  <Link href={`/painel/comparar?slugs=${p.slug}`} style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                    color: 'var(--ink-3)',
                    textDecoration: 'none',
                  }} title="Comparar">
                    <Scale size={14} />
                  </Link>

                  <button
                    onClick={() => handleUnfollow(p.id)}
                    disabled={removingId === p.id}
                    type="button"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      background: 'rgba(244, 63, 94, 0.08)',
                      border: '1px solid rgba(244, 63, 94, 0.3)',
                      color: 'var(--neg)',
                      cursor: 'pointer',
                    }}
                    title="Remover do painel"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {modalOpen && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(9, 13, 22, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: 24,
        }}>
          <div style={{
            background: 'var(--panel)',
            border: '1px solid var(--line-strong)',
            borderRadius: 16,
            maxWidth: 480,
            width: '100%',
            padding: 32,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}>
            <button
              onClick={() => setModalOpen(false)}
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                background: 'transparent',
                border: 'none',
                color: 'var(--mute)',
                cursor: 'pointer',
                fontSize: 16,
              }}
            >
              ✕
            </button>

            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: 40,
                marginBottom: 12,
                display: 'inline-block',
              }}>
                ✨
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white', margin: '0 0 6px' }}>Exportação de Dados</h3>
              <p style={{ fontSize: 13, color: 'var(--brand-2)', margin: 0, fontWeight: 600 }}>
                Disponível para Apoiadores Premium
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', borderBottom: '1px solid var(--line)', padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--brand-2)', fontWeight: 'bold' }}>✓</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Exportação completa de despesas e assiduidade em formato CSV/Excel.</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--brand-2)', fontWeight: 'bold' }}>✓</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Acesso exclusivo a relatórios consolidados em PDF e gráficos avançados.</span>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--brand-2)', fontWeight: 'bold' }}>✓</span>
                <span style={{ fontSize: 12.5, color: 'var(--ink-2)' }}>Ajude a manter a fiscalização pública independente no Brasil.</span>
              </div>
            </div>

            <p style={{ fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5, textAlign: 'center', margin: 0 }}>
              O Meus Políticos é mantido com recursos próprios e doações dos usuários. Seu apoio é essencial para pagarmos os servidores e processamento de dados diários.
            </p>

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                onClick={() => setModalOpen(false)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 8,
                  border: '1px solid var(--line)',
                  background: 'transparent',
                  color: 'var(--ink-2)',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Voltar
              </button>
              <Link
                href="/apoio"
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 8,
                  background: 'var(--brand-2)',
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)',
                }}
              >
                Apoiar o Projeto
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
