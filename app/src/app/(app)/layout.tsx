import { AppFooter } from '@/components/app-shell/AppFooter'
import { AppSidebar } from '@/components/app-shell/AppSidebar'
import { ThemeProvider } from '@/components/app-shell/ThemeProvider'
import { SystemBar } from '@/components/civic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <SystemBar />
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 32px)' }}>
        <AppSidebar />
        <div className="app-main-wrap" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1 }}>{children}</main>
          <AppFooter />
        </div>
      </div>
    </ThemeProvider>
  )
}
