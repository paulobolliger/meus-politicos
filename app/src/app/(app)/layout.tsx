import { AppFooter } from '@/components/app-shell/AppFooter'
import { AppHeader } from '@/components/app-shell/AppHeader'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
    </>
  )
}
