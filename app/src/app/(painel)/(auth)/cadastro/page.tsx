import { AuthShell } from '@/components/auth/AuthShell'
import { CadastroForm } from '@/components/auth/CadastroForm'

export default function CadastroPage() {
  return (
    <AuthShell
      leftLabel="NOVA CONTA"
      leftHeadline="Transparência para decidir melhor"
      leftSub="Crie uma conta gratuita para salvar seus políticos, acompanhar votações e consultar dados públicos organizados."
    >
      <CadastroForm />
    </AuthShell>
  )
}
