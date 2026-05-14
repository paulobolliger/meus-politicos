import type { Metadata } from "next"
import { WifiOff } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export const metadata: Metadata = {
  title: "Serviço indisponível",
  description: "Estado de indisponibilidade do Meus Politicos.",
}

export default function UnavailablePage() {
  return (
    <SystemStateLayout
      eyebrow="Disponibilidade"
      icon={WifiOff}
      title="Não foi possível conectar com segurança agora."
      description="A conexão pode estar offline, instável ou uma fonte pública pode estar temporariamente indisponível. Verifique sua rede e tente novamente."
      actions={[
        { href: "/", label: "Voltar para Home", variant: "primary" },
        { href: "/busca", label: "Acessar busca pública" },
      ]}
    />
  )
}

