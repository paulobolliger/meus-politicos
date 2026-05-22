import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* paddingTop = topbar (32px) + nav (68px) = 100px */}
      <main style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', paddingTop: 100 }}>{children}</main>
      <SiteFooter />
    </>
  )
}
