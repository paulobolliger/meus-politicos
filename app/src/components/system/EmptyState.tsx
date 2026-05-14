import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type EmptyStateAction = {
  href: string
  label: string
}

type EmptyStateProps = {
  title: string
  description: string
  icon: LucideIcon
  action?: EmptyStateAction
  children?: ReactNode
  className?: string
}

export function EmptyState({ title, description, icon: Icon, action, children, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm sm:p-10",
        className
      )}
    >
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      {children ? <div className="mt-4 text-sm text-slate-500">{children}</div> : null}
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg border border-[#dbe4ff] bg-[#eef3ff] px-4 text-sm font-semibold text-[#2952cc] transition hover:bg-[#e3ebff] focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

