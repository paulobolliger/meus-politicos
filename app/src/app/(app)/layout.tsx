import { AppFooter } from '@/components/app-shell/AppFooter'
import { AppHeader } from '@/components/app-shell/AppHeader'
import { ThemeProvider } from '@/components/app-shell/ThemeProvider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AppHeader />
      <main>{children}</main>
      <AppFooter />
    </ThemeProvider>
  )
}
