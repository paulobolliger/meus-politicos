import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { ApoioBanner } from '@/components/site/ApoioBanner'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* paddingTop = topbar (32px) + nav (68px) = 100px */}
      <main style={{ background: 'var(--bg)', color: 'var(--ink)', minHeight: '100vh', paddingTop: 100 }}>
        {/* Banner sticky — aparece abaixo do header, não aparece em /apoio */}
        <ApoioBanner />
        {children}
      </main>
      <SiteFooter />
    </>
  )
}
