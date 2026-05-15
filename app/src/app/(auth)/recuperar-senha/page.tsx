import type { Metadata } from 'next'

import { AuthShell } from '@/components/auth/AuthShell'
import { RecuperarSenhaForm } from '@/components/auth/RecuperarSenhaForm'

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Recuperacao de acesso da conta Meus Politicos.',
}

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      title="Recuperar acesso"
      description="Enviaremos um link para redefinir sua senha com seguranca e retomar o acesso a sua conta."
    >
      <RecuperarSenhaForm />
    </AuthShell>
  )
}

