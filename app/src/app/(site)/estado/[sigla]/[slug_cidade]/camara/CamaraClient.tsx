'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Vereador = {
  id: string
  slug: string
  nome_eleitoral: string
  foto_url: string | null
  sexo: string | null
  partido: string | null
  mandato_inicio: Date | null
  mandato_fim: Date | null
}

type PartyStat = {
  sigla: string
  qtd: number
  cor: string
}

interface Props {
  vereadores: Vereador[]
  sigla: string
  slugCidade: string
  cor: string
  partidos: PartyStat[]
}

const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#f59e0b', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', PSOL: '#ec4899', REDE: '#10b981',
}

export default function CamaraClient({ vereadores, sigla, slugCidade, cor, partidos }: Props) {
  const [search, setSearch] = useState('')
  const [selectedParty, setSelectedParty] = useState<string | null>(null)

  // Filter logic
  const filteredVereadores = vereadores.filter(v => {
    const matchesSearch = v.nome_eleitoral.toLowerCase().includes(search.toLowerCase()) || 
                          (v.partido && v.partido.toLowerCase().includes(search.toLowerCase()))
    const matchesParty = selectedParty ? v.partido === selectedParty : true
    return matchesSearch && matchesParty
  })

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .search-input {
          background: var(--bg);
          border: 1px solid var(--line);
          color: var(--ink);
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          width: 100%;
          max-width: 380px;
          transition: border-color 0.15s, box-shadow 0.15s;
          outline: none;
        }
        .search-input:focus {
          border-color: ${cor};
          box-shadow: 0 0 0 2px ${cor}22;
        }
        .v-card {
          transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
        }
        .v-card:hover {
          box-shadow: 0 8px 24px rgba(0,0,0,0.20);
          transform: translateY(-2px);
        }
        .filter-btn-client {
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 13px;
          fontWeight: 600;
          cursor: pointer;
          border: 1px solid var(--line);
          background: var(--panel);
          color: var(--ink-2);
          transition: background 0.15s, color 0.15s, border-color 0.15s;
        }
        .filter-btn-client:hover {
          background: var(--line);
          color: var(--ink);
        }
      ` }} />

      {/* Controls: Search + Party chips */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        gap: 16, marginBottom: 28, flexWrap: 'wrap'
      }}>
        {/* Search input */}
        <input
          type="text"
          placeholder="🔍 Buscar vereador por nome ou partido..."
          className="search-input"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Party Filter Chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedParty(null)}
            className="filter-btn-client"
            style={{
              borderColor: selectedParty === null ? cor : 'var(--line)',
              background: selectedParty === null ? `${cor}18` : 'var(--panel)',
              color: selectedParty === null ? cor : 'var(--ink-2)',
              fontWeight: selectedParty === null ? 700 : 500,
            }}
          >
            Todos
          </button>
          {partidos.slice(0, 10).map((p) => (
            <button
              key={p.sigla}
              onClick={() => setSelectedParty(selectedParty === p.sigla ? null : p.sigla)}
              className="filter-btn-client"
              style={{
                borderColor: selectedParty === p.sigla ? p.cor : 'var(--line)',
                background: selectedParty === p.sigla ? `${p.cor}18` : 'var(--panel)',
                color: selectedParty === p.sigla ? p.cor : 'var(--ink-2)',
                fontWeight: selectedParty === p.sigla ? 700 : 500,
              }}
            >
              {p.sigla}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Vereadores */}
      {filteredVereadores.length > 0 ? (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: 20
        }}>
          {filteredVereadores.map((v) => {
            const vCor = v.partido ? (PARTIDO_COR[v.partido] ?? '#64748b') : '#64748b'
            const initChar = v.nome_eleitoral.charAt(0)

            return (
              <Link
                key={v.id}
                href={`/estado/${sigla}/${slugCidade}/camara/vereador/${v.slug}`}
                style={{ textDecoration: 'none' }}
              >
                <div
                  className="v-card"
                  style={{
                    background: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: 12,
                    padding: '20px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    cursor: 'pointer',
                    height: '100%',
                    justifyContent: 'center',
                    position: 'relative'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = vCor
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = 'var(--line)'
                  }}
                >
                  {/* Photo / Avatar */}
                  <div style={{
                    width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
                    background: `linear-gradient(135deg, ${vCor} 0%, ${vCor}99 100%)`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 28, fontWeight: 900, color: 'white', marginBottom: 12,
                    boxShadow: `0 4px 12px ${vCor}22`, position: 'relative',
                  }}>
                    {v.foto_url ? (
                      <Image src={v.foto_url} alt={v.nome_eleitoral} fill sizes="72px" unoptimized style={{ objectFit: 'cover' }} />
                    ) : initChar}
                  </div>

                  {/* Name and Party */}
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>
                    {v.nome_eleitoral}
                  </h4>
                  {v.partido && (
                    <span style={{
                      fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                      background: `${vCor}15`, color: vCor, border: `1px solid ${vCor}33`
                    }}>
                      {v.partido}
                    </span>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      ) : (
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12,
          padding: '48px 0', textAlign: 'center', color: 'var(--ink-3)'
        }}>
          🔍 Nenhum vereador encontrado correspondente aos filtros.
        </div>
      )}
    </div>
  )
}
