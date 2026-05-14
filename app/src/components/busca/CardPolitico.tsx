import Link from 'next/link'
import Image from 'next/image'

import { Badge } from '@/components/ui/badge'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'
import { cn } from '@/lib/utils'

export type PoliticoCard = {
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  mandato_inicio: string | null
  partidos: { sigla: string | null } | null
}

const CARGO_BADGE: Record<string, string> = {
  deputado_federal: 'bg-[#e8eefb] text-[#1a2b5e] border-[#d7e2fa]',
  senador: 'bg-[#e8f5ee] text-[#085041] border-[#cce9da]',
  governador: 'bg-[#fff0e8] text-[#7a3000] border-[#ffd9c7]',
  prefeito: 'bg-[#f0e8ff] text-[#3c1489] border-[#dfd0ff]',
  deputado_estadual: 'bg-[#fef9e8] text-[#7a6000] border-[#f8eab4]',
  vereador: 'bg-[#fce8f0] text-[#7a0040] border-[#f4c7db]',
}

const CARGO_AVATAR: Record<string, string> = {
  deputado_federal: 'bg-[#2952cc]',
  senador: 'bg-[#0a7d58]',
  governador: 'bg-[#cc6a29]',
  prefeito: 'bg-[#673ab7]',
  deputado_estadual: 'bg-[#a8860f]',
  vereador: 'bg-[#b01264]',
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Deputado Federal',
  senador: 'Senador',
  governador: 'Governador',
  prefeito: 'Prefeito',
  deputado_estadual: 'Dep. Estadual',
  vereador: 'Vereador',
}

const FASE_2 = new Set(['governador', 'prefeito', 'deputado_estadual', 'vereador'])

function iniciais(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function corPresenca(valor: number | null) {
  if (valor == null) return 'text-slate-500'
  if (valor >= 80) return 'text-emerald-700'
  if (valor >= 60) return 'text-amber-700'
  return 'text-red-700'
}

function moeda(valor: number | null) {
  if (valor == null) return '–'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(valor)
}

function formatarMandato(data: string | null) {
  if (!data) return '–'
  return data.slice(0, 4)
}

export function CardPolitico({ politico }: { politico: PoliticoCard }) {
  const nomeExibicao = politico.nome_eleitoral || politico.nome
  const cargoLabel = CARGO_LABEL[politico.cargo] ?? politico.cargo.replace(/_/g, ' ')
  const badgeClass = CARGO_BADGE[politico.cargo] ?? 'bg-slate-100 text-slate-700 border-slate-300'
  const avatarClass = CARGO_AVATAR[politico.cargo] ?? 'bg-slate-600'

  return (
    <Link
      href={`/politico/${politico.slug}`}
      className="group block rounded-xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        <div className={cn('relative h-12 w-12 shrink-0 overflow-hidden rounded-full text-white', avatarClass)}>
          {politico.foto_url ? (
            <Image
              src={politico.foto_url}
              alt={`Foto de ${nomeExibicao}`}
              fill
              className={`object-cover ${classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })}`}
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-sm font-semibold">
              {iniciais(nomeExibicao)}
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-slate-900">{nomeExibicao}</p>
          <p className="truncate text-xs text-slate-500">{politico.nome}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Badge className={badgeClass}>{cargoLabel}</Badge>
        {FASE_2.has(politico.cargo) ? (
          <Badge className="border border-slate-300 bg-slate-100 text-slate-600">Fase 2 — em breve</Badge>
        ) : null}
      </div>

      <p className="mt-3 text-xs text-slate-600">
        {politico.uf ?? 'UF –'} · {politico.partidos?.sigla ?? 'Sem partido'} · mandato {formatarMandato(politico.mandato_inicio)}
      </p>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs">
        <p className={cn('font-semibold', corPresenca(politico.presenca_pct_atual))}>
          Presença: {politico.presenca_pct_atual == null ? '–' : `${politico.presenca_pct_atual}%`}
        </p>
        <p className="font-medium text-slate-700">{moeda(politico.gasto_total_ano)}</p>
      </div>
    </Link>
  )
}
