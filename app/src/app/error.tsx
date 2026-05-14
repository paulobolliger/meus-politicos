"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <SystemStateLayout
      eyebrow="Estabilidade da plataforma"
      icon={AlertTriangle}
      title="Não foi possível concluir esta solicitação."
      description="Encontramos uma instabilidade ao carregar esta área. Você pode tentar novamente ou retornar para uma área principal enquanto verificamos a operação."
      actions={[
        { href: "/", label: "Voltar para Home" },
        { href: "/busca", label: "Buscar políticos" },
      ]}
    >
      <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm sm:p-8">
        <p className="text-sm leading-6 text-slate-600">
          A página preservou sua navegação. Se a instabilidade continuar, tente novamente em alguns instantes.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#2952cc] bg-[#2952cc] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] transition hover:bg-[#2349bb] focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none"
        >
          <RefreshCw className="size-4" aria-hidden="true" />
          Tentar novamente
        </button>
      </div>
    </SystemStateLayout>
  )
}

