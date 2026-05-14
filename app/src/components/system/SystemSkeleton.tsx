function SkeletonLine({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-full bg-slate-200/80 ${className}`} />
}

function SkeletonCard() {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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
      <section className="border-b border-slate-200 bg-white">
        <div className="container-shell py-10 sm:py-14">
          <div className="mx-auto max-w-3xl space-y-5 text-center">
            <div className="mx-auto size-14 animate-pulse rounded-2xl bg-[#eef3ff]" />
            <SkeletonLine className="mx-auto h-3 w-40" />
            <SkeletonLine className="mx-auto h-10 w-full max-w-xl" />
            <SkeletonLine className="mx-auto h-4 w-full max-w-2xl" />
            <SkeletonLine className="mx-auto h-4 w-4/5 max-w-xl" />
          </div>
        </div>
      </section>

      <section className="container-shell py-10 sm:py-14">
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </section>
    </main>
  )
}

