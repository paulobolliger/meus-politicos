import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin/AdminShell'
import { getCurrentUser } from '@/lib/auth/current-user'

export const metadata = { title: 'Admin — Meus Políticos' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  if (currentUser.role !== 'admin') {
    redirect('/painel')
  }

  return <AdminShell email={currentUser.email ?? ''}>{children}</AdminShell>
}
