import type { Metadata } from 'next'

import { AuthShell } from '@/components/auth/AuthShell'
import { RecuperarSenhaForm } from '@/components/auth/RecuperarSenhaForm'

export const metadata: Metadata = {
  title: 'Recuperar senha',
  description: 'Recuperação de acesso da conta Meus Políticos.',
}

export default function RecuperarSenhaPage() {
  return (
    <AuthShell
      leftLabel="RECUPERAR ACESSO"
      leftHeadline="Recuperar acesso"
      leftSub="Enviaremos um link seguro para redefinir sua senha e retomar o acesso à sua conta."
    >
      <RecuperarSenhaForm />
    </AuthShell>
  )
}

