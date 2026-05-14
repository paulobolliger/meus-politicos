import { CalendarDays } from 'lucide-react'

import { EmptyState } from './EmptyState'

type PresencaPonto = {
  dia: string
  percentual: number
}

type PresencaHeatmapProps = {
  data?: PresencaPonto[] | null
}

export function PresencaHeatmap({ data }: PresencaHeatmapProps) {
  if (!data || data.length === 0) {
    return <EmptyState icon={CalendarDays} title="Dados de presença sendo coletados" />
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-semibold text-slate-900">Presença mensal</p>
      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {data.map((item) => (
          <div
            key={item.dia}
            className="h-6 rounded"
            title={`${item.dia}: ${item.percentual}%`}
            style={{ backgroundColor: `rgba(41,82,204, ${Math.max(0.15, Math.min(1, item.percentual / 100))})` }}
          />
        ))}
      </div>
    </div>
  )
}
