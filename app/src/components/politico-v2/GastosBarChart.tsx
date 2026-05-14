import { Receipt } from 'lucide-react'

import { EmptyState } from './EmptyState'

type GastoMensal = {
  mes: string
  valor: number
}

type GastosBarChartProps = {
  data?: GastoMensal[] | null
}

export function GastosBarChart({ data }: GastosBarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState icon={Receipt} title="Gastos sendo coletados" />
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Gastos mensais</p>
      <div className="mt-4 space-y-2">
        {data.map((item) => (
          <div key={item.mes} className="grid grid-cols-[64px_1fr_auto] items-center gap-2">
            <span className="text-xs text-slate-500">{item.mes}</span>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-[#2952cc]" style={{ width: `${Math.min(100, item.valor)}%` }} />
            </div>
            <span className="text-xs font-medium text-slate-700">{item.valor}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
