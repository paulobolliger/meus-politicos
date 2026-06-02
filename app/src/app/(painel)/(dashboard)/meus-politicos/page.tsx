import { redirect } from 'next/navigation'

import { getCurrentUser } from '@/lib/auth/current-user'

export default async function MeusPoliticosPage() {
  const currentUser = await getCurrentUser()

  if (!currentUser) redirect('/login')

  redirect('/painel')
}
