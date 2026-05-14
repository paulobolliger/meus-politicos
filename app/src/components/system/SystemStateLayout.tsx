import type { LucideIcon } from "lucide-react"
import Link from "next/link"
import type { ReactNode } from "react"

import { cn } from "@/lib/utils"

type SystemStateAction = {
  href: string
  label: string
  variant?: "primary" | "secondary"
}

type SystemStateLayoutProps = {
  eyebrow: string
  title: string
  description: string
  icon: LucideIcon
  statusCode?: string
  actions?: SystemStateAction[]
  children?: ReactNode
  footer?: ReactNode
  className?: string
}

const actionClasses = {
  primary:
    "border-[#2952cc] bg-[#2952cc] text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] hover:bg-[#2349bb] hover:shadow-[0_18px_34px_-20px_rgba(41,82,204,0.9)]",
  secondary:
    "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950",
}

export function SystemStateLayout({
  eyebrow,
  title,
  description,
  icon: Icon,
  statusCode,
  actions = [],
  children,
  footer,
  className,
}: SystemStateLayoutProps) {
  return (
    <main className={cn("min-h-screen bg-linear-to-b from-slate-50 to-white", className)}>
      <section className="relative overflow-hidden border-b border-slate-200">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-linear-to-b from-[#eef3ff] to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-[#2952cc]/8 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-white text-[#2952cc] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)] sm:size-16">
              <Icon className="size-7 sm:size-8" aria-hidden="true" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">{eyebrow}</span>
            </div>

            {statusCode ? (
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-[#2952cc]">
                {statusCode}
              </p>
            ) : null}

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {description}
            </p>

            {actions.length > 0 ? (
              <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
                {actions.map((action) => (
                  <Link
                    key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center rounded-lg border px-5 text-sm font-semibold transition-all focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none",
                      actionClasses[action.variant ?? "secondary"]
                    )}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {children ? (
        <section className="container-shell py-10 sm:py-14">
          <div className="mx-auto max-w-4xl">{children}</div>
        </section>
      ) : null}

      {footer ? (
        <section className="border-t border-slate-200 bg-slate-50">
          <div className="container-shell py-8 sm:py-10">{footer}</div>
        </section>
      ) : null}
    </main>
  )
}

