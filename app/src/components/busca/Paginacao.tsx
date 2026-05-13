'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { cn } from '@/lib/utils'

type PaginacaoProps = {
  paginaAtual: number
  totalPaginas: number
}

function gerarPaginas(paginaAtual: number, totalPaginas: number) {
  const paginas = new Set<number>([1, totalPaginas, paginaAtual, paginaAtual - 1, paginaAtual + 1])

  return Array.from(paginas)
    .filter((n) => n >= 1 && n <= totalPaginas)
    .sort((a, b) => a - b)
}

export function Paginacao({ paginaAtual, totalPaginas }: PaginacaoProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  if (totalPaginas <= 1) {
    return null
  }

  const paginas = gerarPaginas(paginaAtual, totalPaginas)

  function navegar(pagina: number) {
    const params = new URLSearchParams(searchParams.toString())

    if (pagina <= 1) {
      params.delete('pagina')
    } else {
      params.set('pagina', String(pagina))
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <nav className="mt-8 flex flex-wrap items-center justify-center gap-2" aria-label="Paginação">
      <button
        type="button"
        onClick={() => navegar(paginaAtual - 1)}
        disabled={paginaAtual <= 1}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Anterior
      </button>

      {paginas.map((pagina, index) => {
        const anterior = paginas[index - 1]
        const mostrarReticencias = anterior && pagina - anterior > 1

        return (
          <div key={pagina} className="contents">
            {mostrarReticencias ? <span className="px-1 text-slate-400">...</span> : null}
            <button
              type="button"
              onClick={() => navegar(pagina)}
              className={cn(
                'min-w-9 rounded-lg border px-3 py-1.5 text-sm',
                paginaAtual === pagina
                  ? 'border-[#2952cc] bg-[#2952cc] text-white'
                  : 'border-slate-300 bg-white text-slate-700'
              )}
            >
              {pagina}
            </button>
          </div>
        )
      })}

      <button
        type="button"
        onClick={() => navegar(paginaAtual + 1)}
        disabled={paginaAtual >= totalPaginas}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Próximo
      </button>
    </nav>
  )
}
