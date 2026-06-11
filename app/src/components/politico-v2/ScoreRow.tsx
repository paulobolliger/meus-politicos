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
      text: 'text-[var(--ink-3)]',
      bar: 'bg-[var(--mute)]',
      context: 'Não informado',
    }
  }

  const delta = value - media
  if (delta >= 10) {
    return {
      text: 'text-[var(--pos)]',
      bar: 'bg-[var(--pos)]',
      context: `vs média ${media.toFixed(0)}%: +${delta.toFixed(0)}%`,
    }
  }

  if (delta <= -10) {
    return {
      text: 'text-[var(--neg)]',
      bar: 'bg-[var(--neg)]',
      context: `vs média ${media.toFixed(0)}%: ${delta.toFixed(0)}%`,
    }
  }

  return {
    text: 'text-[var(--warn)]',
    bar: 'bg-[var(--warn)]',
    context: `vs média ${media.toFixed(0)}%: ${delta >= 0 ? '+' : ''}${delta.toFixed(0)}%`,
  }
}

export function ScoreRow({ label, value, mediaUf, unit = '%' }: ScoreRowProps) {
  const palette = colorByDelta(value, mediaUf)

  return (
    <div className="space-y-2 rounded-xl border border-[var(--line)] bg-[rgba(15,23,42,0.4)] p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[var(--ink-2)]">{label}</p>
        {value == null ? (
          <span title="Não informado" className="inline-flex items-center gap-1 text-sm font-semibold text-[var(--ink-3)]">
            Não informado
            <AlertCircle className="size-3.5" aria-hidden="true" />
          </span>
        ) : (
          <p className={`text-sm font-semibold ${palette.text}`}>
            {Number(value).toFixed(0)}
            {unit}
          </p>
        )}
      </div>

      {value == null ? (
        <p className="text-xs text-[var(--mute)]">Não informado</p>
      ) : (
        <div className="space-y-1">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--bg-2)] border border-[var(--line)]">
            <div className={`h-full rounded-full ${palette.bar}`} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
          </div>
          <p className="text-xs text-[var(--ink-3)]">{palette.context}</p>
        </div>
      )}
    </div>
  )
}
