import type { Metadata } from "next"
import { ServerCrash } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export const metadata: Metadata = {
  title: "Erro do servidor",
  description: "Instabilidade temporaria no Meus Politicos.",
}

export default function GenericServerErrorPage() {
  return (
    <SystemStateLayout
      eyebrow="Operação indisponível"
      icon={ServerCrash}
      title="A plataforma encontrou uma instabilidade temporária."
      description="A solicitação não pôde ser processada neste momento. Nossa recomendação é tentar novamente em alguns instantes."
      actions={[
        { href: "/busca", label: "Tentar pela busca", variant: "primary" },
        { href: "/", label: "Voltar para Home" },
      ]}
    />
  )
}

