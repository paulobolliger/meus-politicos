import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminShell } from '@/components/admin/AdminShell'

export const metadata = { title: 'Admin — Meus Políticos' }

type PerfilAdmin = {
  role: string | null
  email: string | null
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Use admin client to read new 'role' column (not yet in generated types)
  const adminClient = createAdminClient()
  const { data: perfil } = await adminClient
    .from('perfis')
    .select('role, email')
    .eq('id', user.id)
    .single() as { data: PerfilAdmin | null; error: unknown }

  if (!perfil || perfil.role !== 'admin') {
    redirect('/')
  }

  return <AdminShell email={perfil.email ?? user.email ?? ''}>{children}</AdminShell>
}
