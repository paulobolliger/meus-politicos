import { Badge } from '@/components/ui/badge'

type SecaoRepresentantesProps = {
  titulo: string
  badge: string
  badgeClassName: string
  children: React.ReactNode
}

export function SecaoRepresentantes({ titulo, badge, badgeClassName, children }: SecaoRepresentantesProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="mb-4 flex items-center gap-2">
        <Badge className={badgeClassName}>{badge}</Badge>
        <h2 className="text-lg font-semibold text-slate-900">{titulo}</h2>
      </div>
      {children}
    </section>
  )
}
