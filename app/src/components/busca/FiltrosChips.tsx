'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'

const CARGOS = [
  { label: 'Todos', value: '' },
  { label: 'Dep. Federal', value: 'deputado_federal' },
  { label: 'Senador', value: 'senador' },
  { label: 'Governador', value: 'governador' },
  { label: 'Prefeito', value: 'prefeito' },
  { label: 'Dep. Estadual', value: 'deputado_estadual' },
  { label: 'Vereador', value: 'vereador' },
]

const UFS = [
  '', 'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
  'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP',
  'SE', 'TO',
]

type FiltrosChipsProps = {
  cargoAtual: string
  ufAtual: string
}

export function FiltrosChips({ cargoAtual, ufAtual }: FiltrosChipsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function atualizarFiltros(chave: 'cargo' | 'uf', valor: string) {
    const params = new URLSearchParams(searchParams.toString())

    if (valor) {
      params.set(chave, valor)
    } else {
      params.delete(chave)
    }

    params.delete('pagina')

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">Cargo</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {CARGOS.map((cargo) => {
            const ativo = cargoAtual === cargo.value

            return (
              <button
                key={cargo.label}
                type="button"
                onClick={() => atualizarFiltros('cargo', cargo.value)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  ativo
                    ? 'border-[#2952cc] bg-[#2952cc] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                )}
              >
                {cargo.label}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500">UF</p>
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          {UFS.map((uf) => {
            const label = uf || 'Todos'
            const ativo = ufAtual === uf

            return (
              <button
                key={label}
                type="button"
                onClick={() => atualizarFiltros('uf', uf)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition',
                  ativo
                    ? 'border-[#2952cc] bg-[#2952cc] text-white'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                )}
              >
                {label}
              </button>
            )}
          )}
        </div>
      </div>
    </div>
  )
}
