import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { ApoioBanner } from '@/components/site/ApoioBanner'
import { CookieBanner } from '@/components/site/CookieBanner'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {/* paddingTop = topbar (32px) + nav (68px) = 100px */}
      <main className="bg-bg text-ink min-h-screen pt-[100px]">
        {/* Banner sticky — aparece abaixo do header, não aparece em /apoio */}
        <ApoioBanner />
        {children}
      </main>
      <SiteFooter />
      <CookieBanner />
    </>
  )
}
