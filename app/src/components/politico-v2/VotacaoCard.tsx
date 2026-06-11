import { Vote } from 'lucide-react'

import { EmptyState } from './EmptyState'

type Votacao = {
  data: string
  descricao_simples: string
  voto: string
  tema: string
}

type VotacaoCardProps = {
  data?: Votacao | null
}

export function VotacaoCard({ data }: VotacaoCardProps) {
  if (!data) {
    return (
      <EmptyState
        icon={Vote}
        title="Votações sendo coletadas"
        subtitle="Em breve as votações nominais aparecerão aqui"
      />
    )
  }

  return (
    <article className="rounded-xl border border-[var(--line)] bg-[rgba(30,41,59,0.45)] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.15)] backdrop-blur-md">
      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--brand-2)]">{data.tema}</p>
      <p className="mt-2 text-sm text-[var(--ink-2)]">{data.descricao_simples}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--ink-3)]">
        <span>{data.data}</span>
        <span className="font-semibold text-[var(--ink-2)]">Voto: {data.voto}</span>
      </div>
    </article>
  )
}
