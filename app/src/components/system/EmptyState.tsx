import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateAction = {
  href: string
  label: string
  variant?: "primary" | "secondary"
}

type EmptyStateProps = {
  eyebrow?: string
  title: string
  description: string
  icon: LucideIcon
  action?: EmptyStateAction
  actions?: EmptyStateAction[]
  children?: ReactNode
  className?: string
}

const actionClasses = {
  primary:
    "border-[#2952cc] bg-[#2952cc] text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] hover:bg-[#2349bb]",
  secondary:
    "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950",
}

export function EmptyState({
  eyebrow = "Estado vazio",
  title,
  description,
  icon: Icon,
  action,
  actions,
  children,
  className,
}: EmptyStateProps) {
  const actionList = actions ?? (action ? [action] : [])

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 text-center shadow-sm sm:p-10",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-linear-to-b from-[#eef3ff]/80 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[#2952cc]/6 blur-3xl" />

      <div className="relative">
        <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc] shadow-[0_18px_42px_-34px_rgba(15,23,42,0.42)]">
          <Icon className="size-6" aria-hidden="true" />
        </div>

        <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
          <span className="inline-block size-2 rounded-full bg-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{eyebrow}</span>
        </div>

        <h2 className="mt-5 text-2xl font-bold tracking-tight text-slate-950 sm:text-[1.75rem]">{title}</h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600 sm:text-base">{description}</p>
        {children ? <div className="mt-4 text-sm text-slate-500">{children}</div> : null}
        {actionList.length > 0 ? (
          <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            {actionList.map((item) => (
              <Link
                key={`${item.href}-${item.label}`}
                href={item.href}
                className={cn(
                  "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-all focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none",
                  actionClasses[item.variant ?? "secondary"]
                )}
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}

