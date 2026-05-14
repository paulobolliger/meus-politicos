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
    <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-[#2952cc]">{data.tema}</p>
      <p className="mt-2 text-sm text-slate-800">{data.descricao_simples}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{data.data}</span>
        <span className="font-semibold text-slate-700">Voto: {data.voto}</span>
      </div>
    </article>
  )
}
