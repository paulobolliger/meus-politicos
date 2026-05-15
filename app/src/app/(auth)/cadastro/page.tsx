import { AuthShell } from '@/components/auth/AuthShell'
import { CadastroForm } from '@/components/auth/CadastroForm'

export default function CadastroPage() {
  return (
    <AuthShell
      title="Crie sua conta"
      description="Use a plataforma para acompanhar políticos, salvar interesses e acessar dados públicos com clareza institucional."
    >
      <CadastroForm />
    </AuthShell>
  )
}
