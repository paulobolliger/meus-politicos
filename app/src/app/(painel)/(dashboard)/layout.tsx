'use client'

import { useEffect } from 'react'
import { AppFooter } from '@/components/app-shell/AppFooter'
import { AppMobileTopbar, AppSidebar } from '@/components/app-shell/AppSidebar'
import { SystemBar } from '@/components/civic'

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add('theme-dark')
    return () => {
      document.documentElement.classList.remove('theme-dark')
    }
  }, [])

  return (
    <>
      <SystemBar />

      {/* Topbar mobile — largura total, visível apenas em < 1024px */}
      <div className="app-mobile-only">
        <AppMobileTopbar />
      </div>

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
