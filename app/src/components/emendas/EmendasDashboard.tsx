'use client'

import React, { useCallback, useState, useEffect, useTransition } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

type EmendaItem = {
  id: string
  codigo_emenda: string
  ano: number
  valor: number
  valor_pago: number
  municipio_nome: string
  uf_municipio: string
  municipio_destino?: string | null
  uf_destino?: string | null
  funcao: string
  autor_nome: string
  politico_slug: string | null
}

function obterTituloAmigavel(e: {
  funcao?: string | null
  municipio_nome?: string | null
  uf_municipio?: string | null
  municipio_destino?: string | null
  uf_destino?: string | null
}) {
  let areaInfo = e.funcao || 'Repasse de Recursos'
  if (areaInfo.toLowerCase().includes('múltiplo') || areaInfo.toLowerCase().includes('multiplo')) {
    areaInfo = 'Recursos Múltiplos'
  }

  let cidadeInfo = 'Município de Destino'
  
  if (e.municipio_nome && e.uf_municipio) {
    cidadeInfo = `${e.municipio_nome} (${e.uf_municipio})`
  } else if (e.municipio_destino) {
    const destLower = e.municipio_destino.toLowerCase()
    if (destLower.includes('múltiplo') || destLower.includes('multiplo')) {
      cidadeInfo = 'Múltiplos Municípios'
    } else if (destLower.includes('nacional')) {
      cidadeInfo = 'Nacional (Todo o país)'
    } else if (destLower.includes('(uf)') || e.uf_destino === 'UF') {
      const estadoNome = e.municipio_destino.replace(/\(uf\)/i, '').trim()
      cidadeInfo = `Todo o estado (${estadoNome})`
    } else {
      cidadeInfo = e.municipio_destino
    }
  } else if (e.uf_destino && e.uf_destino !== 'UF') {
    cidadeInfo = `Estado (${e.uf_destino})`
  }

  return `${areaInfo} para ${cidadeInfo}`.trim()
}

type Props = {
  anosDisponiveis: number[]
  tiposDisponiveis: string[]
  funcoesDisponiveis: string[]
  ufsDisponiveis: string[]
  dadosSetoriais: { name: string; value: number }[]
  dadosAnuais: { ano: number; empenhado: number; pago: number }[]
  emendasList: EmendaItem[]
  totalItems: number
  currentPage: number
  filters: { q: string; ano: string; tipo: string; uf: string; funcao: string }
  kpis: {
    totalEmpenhado: number
    totalPago: number
    taxaExecucao: number
    topFuncaoNome: string
    topFuncaoValor: number
  }
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#84CC16', '#64748B']

export function EmendasDashboard({
  anosDisponiveis,
  tiposDisponiveis,
  funcoesDisponiveis,
  ufsDisponiveis,
  dadosSetoriais,
  dadosAnuais,
  emendasList,
  totalItems,
  currentPage,
  filters,
  kpis,
}: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  // Estados locais para busca com debounce
  const [q, setQ] = useState(filters.q)
  const [mounted, setMounted] = useState(false)

  // Estados locais para comparação de anos nos gráficos
  const [compararAnoA, setCompararAnoA] = useState<number>(anosDisponiveis[0] || 2024)
  const [compararAnoB, setCompararAnoB] = useState<number>(anosDisponiveis[1] || 2023)

  // Evitar hydration mismatch com recharts
  useEffect(() => {
    const markMounted = window.setTimeout(() => setMounted(true), 0)
    return () => window.clearTimeout(markMounted)
  }, [])

  useEffect(() => {
    const syncQuery = window.setTimeout(() => setQ(filters.q), 0)
    return () => window.clearTimeout(syncQuery)
  }, [filters.q])

  // Navegar alterando search params
  const atualizarFiltros = useCallback((novosFiltros: Partial<typeof filters>) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('pagina') // Resetar para página 1 ao filtrar

    Object.entries({ ...filters, ...novosFiltros }).forEach(([key, val]) => {
      if (val) {
        params.set(key, val)
      } else {
        params.delete(key)
      }
    })

    const qs = params.toString()
    startTransition(() => {
      router.push(qs ? `${pathname}?${qs}` : pathname)
    })
  }, [filters, pathname, router, searchParams])

  // Debounce para o input de texto
  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== filters.q) {
        atualizarFiltros({ q })
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [atualizarFiltros, filters.q, q])

  const formatCurrency = (num: number) => {
    if (num >= 1e9) return `R$ ${(num / 1e9).toFixed(2)} Bi`
    if (num >= 1e6) return `R$ ${(num / 1e6).toFixed(2)} Mi`
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  }

  const formatCurrencyDetailed = (num: number) => {
    return num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  }

  const formatChartCurrency = (value: number | string | readonly (number | string)[] | undefined) => {
    if (value === undefined) return formatCurrencyDetailed(0)
    const rawValue = Array.isArray(value) ? value[0] : value
    const numericValue = typeof rawValue === 'number' ? rawValue : Number(rawValue)
    return formatCurrencyDetailed(Number.isFinite(numericValue) ? numericValue : 0)
  }

  // Montar dados comparativos para o gráfico de barras
  const obterDadosComparacao = () => {
    const anoA = dadosAnuais.find(d => d.ano === compararAnoA) || { ano: compararAnoA, empenhado: 0, pago: 0 }
    const anoB = dadosAnuais.find(d => d.ano === compararAnoB) || { ano: compararAnoB, empenhado: 0, pago: 0 }
    return [
      {
        name: `Ano ${anoB.ano}`,
        'Reservado (Empenhado)': anoB.empenhado,
        'Entregue (Pago)': anoB.pago,
      },
      {
        name: `Ano ${anoA.ano} (Corrente)`,
        'Reservado (Empenhado)': anoA.empenhado,
        'Entregue (Pago)': anoA.pago,
      }
    ]
  }

  const chartData = obterDadosComparacao()

  // Paginação
  const itemsPerPage = 10
  const totalPages = Math.ceil(totalItems / itemsPerPage)

  const irParaPagina = (p: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (p > 1) {
      params.set('pagina', p.toString())
    } else {
      params.delete('pagina')
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  const limparFiltros = () => {
    setQ('')
    startTransition(() => {
      router.push(pathname)
    })
  }

  return (
    <div className="space-y-10">
      <style dangerouslySetInnerHTML={{ __html: `
        .dashboard-kpi-card {
          background: rgba(30, 41, 59, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 16px;
          padding: 20px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.2);
          backdrop-filter: blur(8px);
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .dashboard-kpi-card:hover {
          border-color: rgba(139, 92, 246, 0.25);
          box-shadow: 0 0 15px rgba(139, 92, 246, 0.1);
        }
        .custom-select {
          background: #1E293B;
          border: 1px solid #334155;
          color: #E2E8F0;
          font-size: 13px;
          border-radius: 8px;
          padding: 8px 12px;
          outline: none;
          cursor: pointer;
          transition: border-color 0.15s;
        }
        .custom-select:focus {
          border-color: #8B5CF6;
        }
      ` }} />

      {/* 🚀 1. KPIs Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="dashboard-kpi-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <span className="material-symbols-outlined text-[60px]">payments</span>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#94A3B8] block mb-1">TOTAL EMPENHADO (RESERVADO)</span>
            <span className="text-2xl font-extrabold text-white font-mono block">
              {formatCurrency(kpis.totalEmpenhado)}
            </span>
          </div>
          <span className="text-[11px] text-[#64748B] mt-4 block">Recurso reservado no Orçamento Federal</span>
        </div>

        <div className="dashboard-kpi-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <span className="material-symbols-outlined text-[60px]">price_check</span>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#34D399] block mb-1">TOTAL PAGO (EFETIVADO)</span>
            <span className="text-2xl font-extrabold text-[#34D399] font-mono block">
              {formatCurrency(kpis.totalPago)}
            </span>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <span className="text-[11px] text-[#94A3B8]">Taxa de Execução:</span>
            <span className="bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 font-mono font-bold px-2 py-0.5 rounded text-xs">
              {kpis.taxaExecucao}%
            </span>
          </div>
        </div>

        <div className="dashboard-kpi-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <span className="material-symbols-outlined text-[60px]">local_hospital</span>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#A78BFA] block mb-1">FUNÇÃO DESTINO LÍDER</span>
            <span className="text-2xl font-extrabold text-white truncate block" title={kpis.topFuncaoNome}>
              {kpis.topFuncaoNome}
            </span>
          </div>
          <span className="text-[11px] text-[#A78BFA] font-mono mt-4 block font-semibold">
            {formatCurrency(kpis.topFuncaoValor)} repassados
          </span>
        </div>

        <div className="dashboard-kpi-card flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-[#1E293B] to-[#2D1B69]">
          <div className="absolute top-0 right-0 p-4 opacity-10 text-white">
            <span className="material-symbols-outlined text-[60px]">info</span>
          </div>
          <div>
            <span className="text-[10px] font-mono font-bold tracking-wider text-[#C7D2FE] block mb-1">AUDITORIA CÍVICA</span>
            <span className="text-base font-extrabold text-white block leading-snug">
              Investigue as Contas
            </span>
            <p className="text-[11px] text-[#94A3B8] leading-normal mt-1.5">
              Utilize o campo de buscas abaixo para filtrar as emendas destinadas para a sua cidade ou enviadas por seus deputados e senadores.
            </p>
          </div>
        </div>
      </div>

      {/* 📊 2. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Comparativo Ano X vs Corrente (Col span 7) */}
        <div className="lg:col-span-7 bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-md flex flex-col">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-[#334155] pb-3 mb-5">
            <div>
              <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
                <span className="material-symbols-outlined text-[#3B82F6] text-[18px]">bar_chart</span>
                Evolução Temporal e Comparativa
              </h3>
              <p className="text-[11px] text-[#94A3B8]">Compare o orçamento de um ano histórico contra o ano corrente</p>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
              <select
                value={compararAnoB}
                onChange={(e) => setCompararAnoB(parseInt(e.target.value))}
                className="custom-select py-1 px-2 text-xs"
              >
                {anosDisponiveis.map(a => (
                  <option key={a} value={a}>Ano {a}</option>
                ))}
              </select>
              <span className="text-xs text-[#64748B]">vs</span>
              <select
                value={compararAnoA}
                onChange={(e) => setCompararAnoA(parseInt(e.target.value))}
                className="custom-select py-1 px-2 text-xs"
              >
                {anosDisponiveis.map(a => (
                  <option key={a} value={a}>Ano {a} (Corrente)</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-[250px] min-w-0 w-full">
            {mounted ? (
              <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={250}
                initialDimension={{ width: 640, height: 250 }}
              >
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `R$ ${(v / 1e9).toFixed(0)}B`}
                  />
                  <Tooltip 
                    contentStyle={{ background: '#1E293B', borderColor: '#475569', borderRadius: 8 }}
                    labelStyle={{ color: 'white', fontWeight: 'bold', fontSize: 11 }}
                    itemStyle={{ fontSize: 12 }}
                    formatter={(value) => [formatChartCurrency(value), '']}
                  />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Reservado (Empenhado)" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Entregue (Pago)" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-[#64748B]">Carregando gráfico...</div>
            )}
          </div>
        </div>

        {/* Setorial Donut Chart (Col span 5) */}
        <div className="lg:col-span-5 bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-md flex flex-col">
          <h3 className="text-white font-bold text-sm tracking-wide border-b border-[#334155] pb-3 mb-5 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#A78BFA] text-[18px]">pie_chart</span>
            Destinação por Área (Saúde Lidera)
          </h3>
          <div className="flex-1 flex flex-col md:flex-row lg:flex-col items-center justify-center gap-4 min-h-[250px]">
            <div className="w-[180px] h-[180px] min-w-0 relative flex-shrink-0">
              {mounted ? (
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                  minWidth={180}
                  minHeight={180}
                  initialDimension={{ width: 180, height: 180 }}
                >
                  <PieChart>
                    <Pie
                      data={dadosSetoriais}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {dadosSetoriais.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ background: '#1E293B', borderColor: '#475569', borderRadius: 8, fontSize: 11 }}
                      formatter={(value) => [formatChartCurrency(value), 'Total Pago']}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-[#64748B]">Carregando gráfico...</div>
              )}
              {/* Centro do Donut */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[9px] text-[#64748B] uppercase tracking-wider font-mono">Saúde Lidera</span>
                <span className="text-[#10B981] font-extrabold text-sm font-mono">53.4%</span>
              </div>
            </div>

            {/* Legenda Dinâmica */}
            <div className="flex-1 w-full space-y-2 text-xs">
              {dadosSetoriais.slice(0, 5).map((item, idx) => (
                <div key={item.name} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="text-[#CBD5E1] truncate font-medium" title={item.name}>{item.name}</span>
                  </div>
                  <span className="font-mono text-[11px] text-[#94A3B8] font-bold flex-shrink-0">
                    {formatCurrency(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 🔍 3. Search & Filters Container */}
      <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-5 shadow-md space-y-4">
        <div className="flex justify-between items-center border-b border-[#334155]/60 pb-3 mb-2">
          <h3 className="text-white font-bold text-sm tracking-wide flex items-center gap-2">
            <span className="material-symbols-outlined text-[#10B981] text-[18px]">search</span>
            Filtrar Recursos
          </h3>
          {(filters.q || filters.ano || filters.tipo || filters.uf || filters.funcao) && (
            <button
              onClick={limparFiltros}
              className="text-[#8B5CF6] hover:text-[#A78BFA] transition-colors text-xs font-mono font-bold uppercase cursor-pointer"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Busca Textual */}
          <div className="md:col-span-4 flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Município, Autor ou Código</label>
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ex: Campinas, Nikolas, 0010..."
              className="w-full bg-[#0F172A] border border-[#334155] focus:border-[#8B5CF6] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#475569] outline-none transition-all"
            />
          </div>

          {/* Filtro Ano */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Ano</label>
            <select
              value={filters.ano}
              onChange={(e) => atualizarFiltros({ ano: e.target.value })}
              className="custom-select w-full"
            >
              <option value="">Todos os anos</option>
              {anosDisponiveis.map(a => (
                <option key={a} value={a.toString()}>{a}</option>
              ))}
            </select>
          </div>

          {/* Filtro UF */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Estado (UF)</label>
            <select
              value={filters.uf}
              onChange={(e) => atualizarFiltros({ uf: e.target.value })}
              className="custom-select w-full"
            >
              <option value="">Todas as UFs</option>
              {ufsDisponiveis.map(u => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>

          {/* Filtro Tipo */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Tipo</label>
            <select
              value={filters.tipo}
              onChange={(e) => atualizarFiltros({ tipo: e.target.value })}
              className="custom-select w-full"
            >
              <option value="">Todos os tipos</option>
              {tiposDisponiveis.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Filtro Função */}
          <div className="md:col-span-2 flex flex-col gap-1.5">
            <label className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-wider">Área/Função</label>
            <select
              value={filters.funcao}
              onChange={(e) => atualizarFiltros({ funcao: e.target.value })}
              className="custom-select w-full"
            >
              <option value="">Todas as áreas</option>
              {funcoesDisponiveis.map(f => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 📃 4. List of Emendas */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <span className="text-xs font-mono text-[#64748B]">
            {totalItems} emendas encontradas
          </span>
        </div>

        {emendasList.length === 0 ? (
          <div className="bg-[#1E293B] border border-[#334155] rounded-xl p-12 text-center flex flex-col items-center justify-center gap-3">
            <span className="material-symbols-outlined text-[32px] text-[#64748B]">search_off</span>
            <p className="text-sm font-bold text-white">Nenhum repasse encontrado</p>
            <p className="text-xs text-[#64748B] max-w-sm leading-normal">
              Tente redefinir seus filtros de busca ou digitar outro termo de pesquisa.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {emendasList.map((e) => {
              const executado = e.valor > 0 ? Math.round((e.valor_pago / e.valor) * 100) : 0

              // Resolver município destino amigável
              let destinoNome = e.municipio_nome
              let ufDestino = e.uf_municipio
              
              if (!destinoNome && e.municipio_destino) {
                const destLower = e.municipio_destino.toLowerCase()
                if (destLower.includes('múltiplo') || destLower.includes('multiplo')) {
                  destinoNome = 'Múltiplos municípios'
                  ufDestino = ''
                } else if (destLower.includes('nacional')) {
                  destinoNome = 'Nacional (Todo o país)'
                  ufDestino = ''
                } else if (destLower.includes('(uf)') || e.uf_destino === 'UF') {
                  const estadoNome = e.municipio_destino.replace(/\(uf\)/i, '').trim()
                  destinoNome = `Todo o estado (${estadoNome})`
                  ufDestino = ''
                } else {
                  const parts = e.municipio_destino.split(' - ')
                  if (parts.length === 2) {
                    destinoNome = parts[0].trim()
                    ufDestino = parts[1].trim()
                  } else {
                    destinoNome = e.municipio_destino
                  }
                }
              }

              const friendlyTitle = obterTituloAmigavel({
                funcao: e.funcao,
                municipio_nome: destinoNome,
                uf_municipio: ufDestino,
                municipio_destino: e.municipio_destino,
                uf_destino: e.uf_destino
              })

              return (
                <Link
                  key={e.id}
                  href={`/emendas/${e.id}`}
                  className="bg-[#1E293B] border border-[#334155] hover:border-[#8B5CF6]/40 p-4 rounded-xl flex flex-col justify-between shadow-sm transition-all hover:translate-y-[-2px] group"
                >
                  <div className="space-y-3">
                    {/* Header: Friendly Title & Value */}
                    <div className="flex justify-between items-start gap-4">
                      <h4 className="text-sm font-extrabold text-white group-hover:text-[#8B5CF6] transition-colors leading-snug line-clamp-2">
                        {friendlyTitle}
                      </h4>
                      <span className="font-mono text-xs text-[#34D399] font-bold flex-shrink-0 mt-0.5">
                        {formatCurrency(e.valor_pago)}
                      </span>
                    </div>

                    {/* Metadata: Author & Technical Details */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-[#94A3B8] font-medium">
                      <span className="text-white font-bold">{e.autor_nome || 'Bancada / Coletivo'}</span>
                      <span className="text-[#475569]">•</span>
                      <span className="bg-[#0F172A] border border-[#334155] text-[9px] font-mono font-bold px-1.5 py-0.2 rounded text-[#94A3B8] inline-block">
                        Emenda {e.codigo_emenda}
                      </span>
                      <span className="text-[#475569]">•</span>
                      <span className="text-[#A78BFA] font-mono bg-[#4C1D95]/15 border border-[#4C1D95]/30 px-1 py-0.2 rounded">
                        {e.ano}
                      </span>
                    </div>
                  </div>

                  {/* Barra de Progresso Interna */}
                  <div className="border-t border-[#334155]/60 pt-3 mt-4 flex items-center justify-between text-[10px] text-[#64748B]">
                    <div className="flex-1 max-w-[120px] bg-[#0F172A] rounded-full h-1.5 overflow-hidden mr-3">
                      <div className="bg-[#10B981] h-full" style={{ width: `${executado}%` }} />
                    </div>
                    <span>Execução: {executado}%</span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {/* 🗺 Paginação */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <button
              onClick={() => irParaPagina(currentPage - 1)}
              disabled={currentPage <= 1}
              className="bg-[#1E293B] border border-[#334155] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Anterior
            </button>
            <span className="text-xs text-[#64748B] font-mono px-2">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => irParaPagina(currentPage + 1)}
              disabled={currentPage >= totalPages}
              className="bg-[#1E293B] border border-[#334155] disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-800 text-xs px-3 py-1.5 rounded-lg cursor-pointer"
            >
              Próxima
            </button>
          </div>
        )}
      </div>

      {/* 🏛 5. State Assemblies Educational Card */}
      <section className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#161D3A] border border-[#334155] rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
          <span className="material-symbols-outlined text-[100px]">account_balance</span>
        </div>
        <div className="max-w-2xl space-y-3 relative z-10">
          <span className="bg-[#8B5CF6]/15 text-[#A78BFA] border border-[#8B5CF6]/30 text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded">
            Esfera Legislativa Estadual
          </span>
          <h4 className="text-white font-extrabold text-base tracking-tight">
            E as Emendas de Deputados Estaduais? (Assembleias Legislativas)
          </h4>
          <p className="text-xs text-[#94A3B8] leading-relaxed">
            As Assembleias Legislativas de cada estado (ALMG, ALESP, ALEP, etc.) também repassam milhões de reais em emendas estaduais enviadas por deputados estaduais. No entanto, por não serem centralizadas em um portal único federal, a coleta desses dados exige scrapers locais customizados.
          </p>
          <p className="text-xs text-[#CBD5E1] font-semibold leading-relaxed">
            💡 Nossa equipe está trabalhando no mapeamento das Assembleias Legislativas de São Paulo, Minas Gerais e Paraná para integrar o rastreamento estadual em breve!
          </p>
        </div>
      </section>
    </div>
  )
}
