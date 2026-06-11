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
    <div className="rounded-xl border border-[var(--line)] bg-[rgba(30,41,59,0.45)] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md">
      <p className="text-sm font-semibold text-[var(--ink)]">Presença mensal</p>
      <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-8 md:grid-cols-10">
        {data.map((item) => (
          <div
            key={item.dia}
            className="h-6 rounded"
            title={`${item.dia}: ${item.percentual}%`}
            style={{ backgroundColor: `color-mix(in srgb, var(--brand-2) ${Math.max(20, Math.min(100, item.percentual))}%, var(--panel))` }}
          />
        ))}
      </div>
    </div>
  )
}
