import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export const metadata: Metadata = {
  title: "Manutenção",
  description: "Manutencao programada do Meus Politicos.",
}

export default function MaintenancePage() {
  return (
    <SystemStateLayout
      eyebrow="Manutenção programada"
      icon={ShieldCheck}
      title="Estamos atualizando a infraestrutura da plataforma."
      description="A manutenção ajuda a preservar estabilidade, segurança e qualidade dos dados. O acesso será restabelecido assim que a operação for concluída."
      actions={[{ href: "/", label: "Voltar para Home", variant: "primary" }]}
    />
  )
}

