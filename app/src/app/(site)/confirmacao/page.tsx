import type { Metadata } from "next"
import { CheckCircle2 } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export const metadata: Metadata = {
  title: "Confirmação",
  description: "Confirmacao de acao no Meus Politicos.",
}

export default function ConfirmationPage() {
  return (
    <SystemStateLayout
      eyebrow="Solicitação registrada"
      icon={CheckCircle2}
      title="A ação foi concluída com sucesso."
      description="Sua solicitação foi processada. Você pode continuar navegando pela plataforma ou retornar para a área principal."
      actions={[
        { href: "/busca", label: "Explorar plataforma", variant: "primary" },
        { href: "/", label: "Voltar para Home" },
      ]}
    />
  )
}

