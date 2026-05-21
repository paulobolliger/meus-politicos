import { headers } from 'next/headers'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { AppFooter } from '@/components/app-shell/AppFooter'
import { AppMobileTopbar, AppSidebar } from '@/components/app-shell/AppSidebar'
import { AppThemeDark } from '@/components/app-shell/AppThemeDark'
import { SystemBar } from '@/components/civic'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isSite = !host.startsWith('app.')

  // ── versão SITE: header leve + footer, sem sidebar, sem dark theme ──
  if (isSite) {
    return (
      <>
        <SiteHeader />
        <main style={{ background: '#f8fafc', color: '#0a0e1a', minHeight: '100vh' }}>
          {children}
        </main>
        <SiteFooter />
      </>
    )
  }

  // ── versão APP: sidebar escuro + SystemBar ──
  return (
    <>
      <AppThemeDark />
      <SystemBar />

      {/* Topbar mobile — ocupa largura total, visível apenas em < 1024px */}
      <div className="app-mobile-only">
        <AppMobileTopbar />
      </div>

      {/* Flex row: sidebar desktop + conteúdo */}
      <div style={{ display: 'flex', alignItems: 'stretch', minHeight: 'calc(100vh - 32px)' }}>
        <div className="app-desktop-only">
          <AppSidebar />
        </div>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <main style={{ flex: 1 }}>{children}</main>
          <AppFooter />
        </div>
      </div>

      <style>{`
        .app-mobile-only { display: block; }
        .app-desktop-only { display: none; }
        @media (min-width: 1024px) {
          .app-mobile-only { display: none; }
          .app-desktop-only { display: block; }
        }
      `}</style>
    </>
  )
}
