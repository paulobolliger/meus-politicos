'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'

export type VotoIndividual = {
  politico_id: string
  nome_eleitoral: string
  partido: string | null
  uf: string | null
  foto_url: string | null
  voto: string
  slug: string
}

type TabelaVotosIndividuaisProps = {
  votos: VotoIndividual[]
}

type FiltroVoto = 'todos' | 'sim' | 'nao' | 'abstencao'

export function TabelaVotosIndividuais({ votos }: TabelaVotosIndividuaisProps) {
  const [busca, setBusca] = useState('')
  const [filtroVoto, setFiltroVoto] = useState<FiltroVoto>('todos')

  const votosFiltrados = votos.filter((v) => {
    const nomeMatch = v.nome_eleitoral.toLowerCase().includes(busca.toLowerCase())
    const partidoMatch = v.partido?.toLowerCase().includes(busca.toLowerCase()) ?? false
    const ufMatch = v.uf?.toLowerCase().includes(busca.toLowerCase()) ?? false
    
    const textMatch = nomeMatch || partidoMatch || ufMatch
    const votoMatch = filtroVoto === 'todos' || v.voto.toLowerCase() === filtroVoto

    return textMatch && votoMatch
  })

  return (
    <section className="bg-[#1E293B] border border-[#334155] rounded-xl overflow-hidden shadow-md flex flex-col font-sans">
      {/* Header */}
      <div className="bg-[#1E293B] border-b border-[#334155] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-white font-bold text-base flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8B5CF6]">how_to_vote</span>
            Votos Individuais dos Parlamentares
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            Veja abaixo a orientação nominal de voto de cada parlamentar nesta matéria.
          </p>
        </div>

        {/* Filtros de Voto */}
        <div className="flex flex-wrap gap-1.5">
          {([
            { id: 'todos', label: 'Todos' },
            { id: 'sim', label: 'Sim', count: votos.filter((v) => v.voto.toLowerCase() === 'sim').length, color: 'hover:bg-[#10B981]/15 text-[#34D399]' },
            { id: 'nao', label: 'Não', count: votos.filter((v) => v.voto.toLowerCase() === 'nao').length, color: 'hover:bg-[#F43F5E]/15 text-[#F43F5E]' },
            { id: 'abstencao', label: 'Abs', count: votos.filter((v) => v.voto.toLowerCase() === 'abstencao').length, color: 'hover:bg-[#F59E0B]/15 text-[#FBBF24]' },
          ] satisfies Array<{ id: FiltroVoto; label: string; count?: number; color?: string }>).map((btn) => {
            const isActive = filtroVoto === btn.id
            return (
              <button
                key={btn.id}
                type="button"
                onClick={() => setFiltroVoto(btn.id)}
                className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all ${
                  isActive
                    ? 'bg-[#8B5CF6] text-white border-[#8B5CF6]'
                    : `bg-[#0F172A] border-[#334155] text-[#94A3B8] ${btn.color ?? ''}`
                }`}
              >
                {btn.label} {btn.count !== undefined && `(${btn.count})`}
              </button>
            )
          })}
        </div>
      </div>

      {/* Input de Busca */}
      <div className="p-4 bg-[#0F172A]/30 border-b border-[#334155]/60">
        <div className="relative">
          <span className="material-symbols-outlined text-[#64748B] absolute left-3 top-1/2 -translate-y-1/2 text-[18px]">
            search
          </span>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquise por nome, partido ou UF..."
            className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#8B5CF6] focus:ring-1 focus:ring-[#8B5CF6]/30 rounded-lg pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#64748B] outline-none transition-all"
          />
        </div>
      </div>

      {/* Tabela de Parlamentares */}
      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
        {votosFiltrados.length === 0 ? (
          <div className="p-12 text-center text-xs text-[#64748B] space-y-1.5">
            <span className="material-symbols-outlined text-[32px] text-slate-700">search_off</span>
            <p>Nenhum parlamentar encontrado para os filtros ativos.</p>
          </div>
        ) : (
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#0F172A]/50 text-[#94A3B8] font-mono uppercase tracking-wider text-[10px] border-b border-[#334155]/60 sticky top-0">
                <th className="py-2.5 px-4">Parlamentar</th>
                <th className="py-2.5 px-4">Partido / UF</th>
                <th className="py-2.5 px-4 text-center">Voto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#334155]/40">
              {votosFiltrados.map((v) => {
                const votoLower = v.voto.toLowerCase()
                const badgeStyle =
                  votoLower === 'sim'
                    ? 'bg-[#064E3B] text-[#34D399] border-[#047857]'
                    : votoLower === 'nao'
                    ? 'bg-[#4C0519] text-[#FDA4AF] border-[#9F1239]'
                    : 'bg-[#451A03] text-[#FCD34D] border-[#78350F]'

                return (
                  <tr key={v.politico_id} className="hover:bg-[#1E293B]/60 transition-colors">
                    <td className="py-3 px-4 font-medium text-white">
                      <Link href={`/politicos/${v.slug}`} className="flex items-center gap-3 group">
                        {v.foto_url ? (
                          <div className="w-9 h-9 rounded-full overflow-hidden border border-[#334155] flex-shrink-0">
                            <Image
                              src={v.foto_url}
                              alt={v.nome_eleitoral}
                              width={36}
                              height={36}
                              className="object-cover w-full h-full"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-[#334155] text-white flex items-center justify-center font-bold text-[13px] flex-shrink-0">
                            {v.nome_eleitoral.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="group-hover:text-[#8B5CF6] transition-colors">{v.nome_eleitoral}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 text-[#CBD5E1] font-medium font-sans">
                      {v.partido} · {v.uf}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase border ${badgeStyle}`}>
                        {v.voto}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      <div className="bg-[#0F172A]/20 border-t border-[#334155] p-3 text-[10px] font-mono text-[#64748B] flex justify-between items-center px-4">
        <span>Exibindo {votosFiltrados.length} de {votos.length} parlamentares</span>
        <span>Fonte: Dados Abertos API</span>
      </div>
    </section>
  )
}
