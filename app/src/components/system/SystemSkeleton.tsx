function SkeletonLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200/80 ${className}`} />
}

function SkeletonCard() {
  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="size-12 animate-pulse rounded-2xl bg-[#eef3ff]" />
        <div className="min-w-0 flex-1 space-y-3">
          <SkeletonLine className="h-4 w-2/3" />
          <SkeletonLine className="h-3 w-full" />
          <SkeletonLine className="h-3 w-5/6" />
        </div>
      </div>
      <div className="mt-5 grid grid-cols-3 gap-3">
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
        <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
      </div>
    </article>
  )
}

export function SystemSkeleton() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <section className="relative overflow-hidden border-b border-slate-200/80">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-linear-to-b from-[var(--brand-soft)] via-transparent to-transparent" />
        <div className="pointer-events-none absolute left-1/2 top-0 h-80 w-80 -translate-x-1/2 rounded-full bg-[#2952cc]/8 blur-3xl" />

        <div className="container-shell relative py-14 sm:py-18 lg:py-24">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="size-16 animate-pulse rounded-2xl bg-[#eef3ff] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.45)] sm:size-18" />
            <SkeletonLine className="mt-6 h-3 w-36" />
            <SkeletonLine className="mt-5 h-11 w-full max-w-2xl" />
            <SkeletonLine className="mt-4 h-4 w-full max-w-xl" />
            <SkeletonLine className="mt-3 h-4 w-4/5 max-w-lg" />

            <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 sm:flex-row sm:justify-center">
              <div className="h-11 w-full animate-pulse rounded-xl bg-[#2952cc]/12 sm:w-44" />
              <div className="h-11 w-full animate-pulse rounded-xl bg-slate-200 sm:w-44" />
            </div>
          </div>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="space-y-4">
            <SkeletonCard />
            <SkeletonCard />
          </div>

          <div className="space-y-4">
            <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
              <SkeletonLine className="h-3 w-32" />
              <div className="mt-4 space-y-3">
                <SkeletonLine className="h-4 w-5/6" />
                <SkeletonLine className="h-4 w-full" />
                <SkeletonLine className="h-4 w-4/5" />
              </div>
            </article>

            <article className="rounded-2xl border border-[var(--line)] bg-[var(--panel)] p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
                <div className="h-20 animate-pulse rounded-xl bg-slate-100" />
              </div>
            </article>
          </div>
        </div>
      </section>
    </main>
  )
}
