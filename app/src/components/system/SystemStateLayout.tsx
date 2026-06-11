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
    "border-[var(--brand)] bg-[var(--brand)] text-white shadow-[0_16px_32px_-22px_rgba(139,92,246,0.4)] hover:brightness-110",
  secondary:
    "border-[var(--line)] bg-[var(--panel)] text-[var(--ink-2)] hover:border-[var(--line-strong)] hover:text-[var(--ink)]",
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
    <main className={cn("min-h-screen bg-linear-to-b from-[var(--bg)] to-[var(--panel)] text-[var(--ink)]", className)}>
      <section className="relative overflow-hidden border-b border-[var(--line)]">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[var(--brand-soft)]/10 to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[var(--brand)]/5 blur-3xl" />
        <div className="pointer-events-none absolute right-0 top-24 h-48 w-48 rounded-full bg-slate-900/10 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-18 lg:py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-[var(--line)] bg-[var(--panel)] text-[var(--brand)] shadow-[0_18px_42px_-32px_rgba(0,0,0,0.5)] sm:size-18">
              <Icon className="size-7 sm:size-8" aria-hidden="true" />
            </div>

            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-[var(--line)] bg-[var(--panel)] px-3 py-1 shadow-sm">
              <span className="inline-block size-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold uppercase tracking-widest text-[var(--ink-3)]">{eyebrow}</span>
            </div>

            {statusCode ? (
              <p className="mt-5 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--brand)]">
                {statusCode}
              </p>
            ) : null}

            <h1 className="mt-4 text-4xl font-bold tracking-tight text-[var(--ink)] sm:text-5xl lg:text-6xl">
              {title}
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[var(--ink-3)] sm:text-lg">
              {description}
            </p>

            {actions.length > 0 ? (
              <div className="mt-8 flex w-full max-w-2xl flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center sm:justify-center">
                {actions.map((action) => (
                  <Link
                     key={`${action.href}-${action.label}`}
                    href={action.href}
                    className={cn(
                      "inline-flex h-11 items-center justify-center rounded-xl border px-5 text-sm font-semibold transition-all focus-visible:ring-3 focus-visible:ring-[var(--brand)]/20 focus-visible:outline-none",
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
          <div className="mx-auto max-w-4xl rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-6 shadow-sm sm:p-8">
            {children}
          </div>
        </section>
      ) : null}

      {footer ? (
        <section className="border-t border-[var(--line)] bg-[var(--bg)]/50">
          <div className="container-shell py-8 sm:py-10">{footer}</div>
        </section>
      ) : null}
    </main>
  )
}


