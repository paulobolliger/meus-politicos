import type { Metadata } from "next"
import { LockKeyhole } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export const metadata: Metadata = {
  title: "Acesso negado",
  description: "Area restrita do Meus Politicos.",
}

export default function AccessDeniedPage() {
  return (
    <SystemStateLayout
      eyebrow="Controle de acesso"
      icon={LockKeyhole}
      title="Você não tem acesso a esta área."
      description="Algumas funcionalidades exigem autenticação ou permissões específicas. Entre com uma conta autorizada para continuar."
      actions={[
        { href: "/login", label: "Entrar na conta", variant: "primary" },
        { href: "/", label: "Voltar para Home" },
      ]}
    />
  )
}

