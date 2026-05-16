import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main style={{ background: '#f4f5f0', color: '#0a0e1a', minHeight: '100vh' }}>{children}</main>
      <SiteFooter />
    </>
  )
}
