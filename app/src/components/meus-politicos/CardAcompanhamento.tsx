import Image from 'next/image'
import Link from 'next/link'

type Partido = {
  sigla: string | null
} | null

export type PoliticoAcompanhado = {
  id: string
  slug: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partidos: Partido
}

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  vice_presidente: 'Vice-presidente',
  governador: 'Governador',
  vice_governador: 'Vice-governador',
  senador: 'Senador',
  deputado_federal: 'Deputado Federal',
  deputado_estadual: 'Deputado Estadual',
  prefeito: 'Prefeito',
  vice_prefeito: 'Vice-prefeito',
  vereador: 'Vereador',
}

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function cargoLabel(cargo: string | null) {
  if (!cargo) return 'Cargo nao informado'
  return CARGO_LABEL[cargo] ?? cargo.replace(/_/g, ' ')
}

export function CardAcompanhamento({ politico }: { politico: PoliticoAcompanhado }) {
  const nome = politico.nome_eleitoral ?? 'Politico acompanhado'

  return (
    <Link
      href={`/politico/${politico.slug}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none"
    >
      <div className="flex items-center gap-3">
        <div className="relative size-14 shrink-0 overflow-hidden rounded-2xl bg-[#2952cc] text-white">
          {politico.foto_url ? (
            <Image
              src={politico.foto_url}
              alt={`Foto de ${nome}`}
              fill
              className="object-cover"
              sizes="56px"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-bold">
              {iniciais(nome)}
            </div>
          )}
        </div>

        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-slate-950">{nome}</h3>
          <p className="mt-1 truncate text-xs text-slate-500">{cargoLabel(politico.cargo)}</p>
          <p className="mt-2 text-xs font-medium text-slate-700">
            {politico.partidos?.sigla ?? 'Sem partido'} · {politico.uf ?? 'UF nao informada'}
          </p>
        </div>
      </div>
    </Link>
  )
}

