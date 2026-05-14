import { AlertCircle } from 'lucide-react'

type ScoreRowProps = {
  label: string
  value: number | null
  mediaUf: number | null
  unit?: '%' | 'pontos'
}

function colorByDelta(value: number | null, media: number | null) {
  if (value == null || media == null) {
    return {
      text: 'text-slate-500',
      bar: 'bg-slate-300',
      context: 'Não informado',
    }
  }

  const delta = value - media
  if (delta >= 10) {
    return {
      text: 'text-[#16a34a]',
      bar: 'bg-[#16a34a]',
      context: `vs média ${media.toFixed(0)}%: +${delta.toFixed(0)}%`,
    }
  }

  if (delta <= -10) {
    return {
      text: 'text-[#dc2626]',
      bar: 'bg-[#dc2626]',
      context: `vs média ${media.toFixed(0)}%: ${delta.toFixed(0)}%`,
    }
  }

  return {
    text: 'text-[#ca8a04]',
    bar: 'bg-[#ca8a04]',
    context: `vs média ${media.toFixed(0)}%: ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`,
  }
}

export function ScoreRow({ label, value, mediaUf, unit = '%' }: ScoreRowProps) {
  const palette = colorByDelta(value, mediaUf)

  return (
    <div className="space-y-2 rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">{label}</p>
        {value == null ? (
          <span title="Não informado" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-500">
            Não informado
            <AlertCircle className="size-3.5" aria-hidden="true" />
          </span>
        ) : (
          <p className={`text-sm font-semibold ${palette.text}`}>
            {value.toFixed(0)}
            {unit}
          </p>
        )}
      </div>

      {value == null ? (
        <p className="text-xs text-slate-500">Não informado</p>
      ) : (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
          </div>
          <p className="text-xs text-slate-500">{palette.context}</p>
        </div>
      )}
    </div>
  )
}
