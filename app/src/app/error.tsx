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
      title="Não foi possível concluir esta solicitação agora."
      description="Encontramos uma instabilidade temporária ao carregar esta área. Você pode tentar novamente ou seguir para uma seção principal enquanto a operação se normaliza."
      actions={[
        { href: "/", label: "Voltar para Home" },
        { href: "/busca", label: "Buscar políticos" },
      ]}
    >
      <div className="space-y-5 text-left sm:text-center">
        <p className="text-sm leading-6 text-slate-600 sm:text-base">
          A navegação atual foi preservada. Se a instabilidade continuar, tente novamente em alguns instantes.
        </p>
        <div className="flex justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-[#2952cc] bg-[#2952cc] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] transition hover:bg-[#2349bb] focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Tentar novamente
          </button>
        </div>
      </div>
    </SystemStateLayout>
  )
}

