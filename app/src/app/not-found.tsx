import { Compass } from "lucide-react"

import { SystemStateLayout } from "@/components/system"

export default function NotFound() {
  return (
    <SystemStateLayout
      eyebrow="Navegação institucional"
      statusCode="404"
      icon={Compass}
      title="Não encontramos a página que você está procurando."
      description="O endereço pode ter sido alterado, removido ou digitado com algum detalhe incorreto. Você pode retornar a uma área principal da plataforma sem perder o contexto da navegação."
      actions={[
        { href: "/", label: "Voltar para Home", variant: "primary" },
        { href: "/busca", label: "Buscar políticos" },
        { href: "/meu-estado", label: "Explorar plataforma" },
      ]}
      footer={
        <p className="mx-auto max-w-3xl text-center text-sm leading-6 text-slate-600">
          O Meus Políticos organiza informações públicas com foco em clareza, rastreabilidade e leitura cívica.
        </p>
      }
    />
  )
}

