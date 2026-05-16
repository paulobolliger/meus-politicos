import { AppFooter } from '@/components/app-shell/AppFooter'
import { AppSidebar } from '@/components/app-shell/AppSidebar'
import { SystemBar } from '@/components/civic'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="theme-dark" style={{ minHeight: '100vh' }}>
      <SystemBar />
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 32px)' }}>
        <AppSidebar />
        <div className="app-main-wrap" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1 }}>{children}</main>
          <AppFooter />
        </div>
      </div>
    </div>
  )
}
