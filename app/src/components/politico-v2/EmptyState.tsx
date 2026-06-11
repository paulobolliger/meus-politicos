import type { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  subtitle?: string
}

export function EmptyState({ icon: Icon, title, subtitle }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-[rgba(15,23,42,0.35)] p-6 text-center">
      <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-[var(--line)] bg-[var(--brand-soft)] text-[var(--brand-2)]">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <p className="mt-3 text-sm font-semibold text-[var(--ink)]">{title}</p>
      {subtitle ? <p className="mt-1 text-xs text-[var(--ink-3)]">{subtitle}</p> : null}
    </div>
  )
}
