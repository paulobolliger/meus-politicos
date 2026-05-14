import { AuthShell } from '@/components/auth/AuthShell'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthShell
      title="Acesse sua conta"
      description="Acompanhe representantes, consulte dados públicos e mantenha sua leitura cívica organizada em um ambiente seguro."
    >
      <LoginForm />
    </AuthShell>
  )
}
