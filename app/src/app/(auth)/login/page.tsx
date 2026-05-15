import { AuthShell } from '@/components/auth/AuthShell'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <AuthShell
      leftLabel="ACESSO À PLATAFORMA"
      leftHeadline="Acompanhe seus políticos"
      leftSub="Dados públicos organizados para uma leitura cívica clara e rastreável. Acompanhe representantes e fique por dentro das atividades."
    >
      <LoginForm />
    </AuthShell>
  )
}
