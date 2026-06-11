'use client'

import React from 'react'

type EmendaExecutionTrackerProps = {
  valorEmpenhado: number
  valorLiquidado: number
  valorPago: number
  municipioNome: string
  ufMunicipio: string
  totalMunicipioEmendas: number
}

export function EmendaExecutionTracker({
  valorEmpenhado,
  valorLiquidado,
  valorPago,
  municipioNome,
  ufMunicipio,
  totalMunicipioEmendas,
}: EmendaExecutionTrackerProps) {
  const formatCurrency = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  // Cálculos de Percentuais
  const pctLiquidado = valorEmpenhado > 0 ? Math.round((valorLiquidado / valorEmpenhado) * 100) : 0
  const pctPago = valorEmpenhado > 0 ? Math.round((valorPago / valorEmpenhado) * 100) : 0
  
  // Proporção de participação no município
  const proporcaoMunicipio = totalMunicipioEmendas > 0 
    ? ((valorPago / totalMunicipioEmendas) * 100).toFixed(1)
    : '0.0'

  // Determinar status dos steps
  const isEmpenhadoDone = valorEmpenhado > 0
  const isLiquidadoDone = valorLiquidado > 0 && pctLiquidado >= 90
  const isLiquidadoActive = valorLiquidado > 0 && pctLiquidado < 90
  const isPagoDone = valorPago > 0 && pctPago >= 90
  const isPagoActive = valorPago > 0 && pctPago < 90

  return (
    <div className="space-y-6">
      {/* Rastreamento de Execução */}
      <section className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-md">
        <h3 className="text-white font-bold text-sm tracking-wide border-b border-[#334155] pb-3 mb-5 flex items-center gap-2">
          <span className="material-symbols-outlined text-[#8B5CF6] text-[18px]">account_tree</span>
          Fluxo de Execução Financeira
        </h3>

        {/* Linha de Progresso Visual */}
        <div className="relative my-14 px-0">
          {/* Linha Cinza de Fundo */}
          <div className="absolute top-4 left-12 sm:left-16 right-12 sm:right-16 h-1 bg-[#334155] -translate-y-1/2 z-0" />
          
          {/* Linha de Progresso Pago */}
          <div 
            className="absolute top-4 left-12 sm:left-16 right-12 sm:right-16 h-1 -translate-y-1/2 z-0"
          >
            <div 
              className="h-full bg-[#10B981] transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, pctPago))}%` }}
            />
          </div>

          <div className="flex justify-between items-start relative z-10">
            {/* Step 1: Empenhado */}
            <div className="flex flex-col items-center w-24 sm:w-32 flex-shrink-0 text-center">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono text-xs font-bold transition-all duration-300 ${
                isEmpenhadoDone 
                  ? 'bg-[#1E293B] border-[#10B981] text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : 'bg-[#0F172A] border-[#334155] text-[#64748B]'
              }`}>
                {isEmpenhadoDone ? '✓' : '1'}
              </div>
              <span className="text-[10px] font-bold text-white mt-2 block">Empenhado</span>
              <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5 block">{formatCurrency(valorEmpenhado)}</span>
            </div>

            {/* Step 2: Liquidado */}
            <div className="flex flex-col items-center w-24 sm:w-32 flex-shrink-0 text-center">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono text-xs font-bold transition-all duration-300 ${
                isLiquidadoDone 
                  ? 'bg-[#1E293B] border-[#10B981] text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : isLiquidadoActive
                  ? 'bg-[#1D1C3D] border-[#8B5CF6] text-[#A78BFA] animate-pulse'
                  : 'bg-[#0F172A] border-[#334155] text-[#64748B]'
              }`}>
                {isLiquidadoDone ? '✓' : '2'}
              </div>
              <span className="text-[10px] font-bold text-white mt-2 block">Liquidado</span>
              <span className="text-[9px] text-[#94A3B8] font-mono mt-0.5 block" title="Serviço prestado e verificado">
                {formatCurrency(valorLiquidado)} ({pctLiquidado}%)
              </span>
            </div>

            {/* Step 3: Pago */}
            <div className="flex flex-col items-center w-24 sm:w-32 flex-shrink-0 text-center">
              <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center border-2 font-mono text-xs font-bold transition-all duration-300 ${
                isPagoDone 
                  ? 'bg-[#1E293B] border-[#10B981] text-[#10B981] shadow-[0_0_8px_rgba(16,185,129,0.3)]' 
                  : isPagoActive
                  ? 'bg-[#122A26] border-[#34D399] text-[#34D399] animate-pulse'
                  : 'bg-[#0F172A] border-[#334155] text-[#64748B]'
              }`}>
                {isPagoDone ? '✓' : '3'}
              </div>
              <span className="text-[10px] font-bold text-white mt-2 block">Pago (Entregue)</span>
              <span className="text-[9px] text-[#10B981] font-mono font-bold mt-0.5 block">
                {formatCurrency(valorPago)} ({pctPago}%)
              </span>
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-[#0F172A]/40 border border-[#334155]/60 rounded-lg p-3.5 text-xs text-[#CBD5E1] leading-relaxed flex items-start gap-2.5">
          <span className="material-symbols-outlined text-[#A78BFA] text-[18px] mt-0.5">info</span>
          <div>
            A **Liquidação** atesta que o município comprovou o recebimento do serviço ou obra. O **Pagamento** é a efetiva transferência eletrônica dos recursos para a conta bancária da prefeitura. Se houver diferença entre o liquidado e o pago, os repasses estão em andamento.
          </div>
        </div>
      </section>

      {/* Participação e Contexto Local */}
      {parseFloat(proporcaoMunicipio) > 0 && (
        <section className="bg-gradient-to-r from-[#1E293B] to-[#161D3A] border border-[#334155] rounded-xl p-5 shadow-md">
          <div className="flex items-center gap-2 mb-3">
            <span className="material-symbols-outlined text-[#38BDF8] text-[18px]">location_on</span>
            <h3 className="text-white font-bold text-sm tracking-wide">Contexto no Município</h3>
          </div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                Esta emenda representa <strong className="text-[#38BDF8] font-bold">{proporcaoMunicipio}%</strong> do total de <strong className="text-white font-bold">{formatCurrency(totalMunicipioEmendas)}</strong> em emendas federais pagas recebidas pela prefeitura de <strong className="text-white font-bold">{municipioNome} - {ufMunicipio}</strong>.
              </p>
            </div>
            <div className="bg-[#0F172A]/70 border border-[#334155] px-4 py-2 rounded-lg text-center flex-shrink-0 w-full sm:w-auto">
              <span className="text-[9px] text-[#94A3B8] block uppercase tracking-wider font-mono">Total Pago na Cidade</span>
              <span className="text-white font-extrabold text-sm font-mono">{formatCurrency(totalMunicipioEmendas)}</span>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
