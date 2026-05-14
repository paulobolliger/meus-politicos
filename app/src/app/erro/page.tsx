import type { Metadata } from "next"
import { ServerCrash } from "lucide-react"

import { SystemStateLayout } from "@/components/system"
import { RecarregarAgoraButton } from "./RecarregarAgoraButton"

export const metadata: Metadata = {
  title: "Erro do servidor",
  description: "Instabilidade temporaria no Meus Politicos.",
}

export default function GenericServerErrorPage() {
  return (
    <SystemStateLayout
      eyebrow="Operação temporariamente indisponível"
      icon={ServerCrash}
      title="A plataforma encontrou uma instabilidade temporária."
      description="A solicitação não pôde ser processada neste momento. Você pode recarregar a página ou seguir para uma área principal enquanto a operação se normaliza."
      actions={[
        { href: "/busca", label: "Tentar pela busca", variant: "primary" },
        { href: "/", label: "Voltar para Home" },
      ]}
      footer={
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 text-center sm:flex-row sm:justify-between sm:text-left">
          <p className="text-sm leading-6 text-slate-600">
            Se preferir, recarregue a sessão atual para tentar novamente sem alterar seu contexto.
          </p>
          <RecarregarAgoraButton />
        </div>
      }
    />
  )
}

