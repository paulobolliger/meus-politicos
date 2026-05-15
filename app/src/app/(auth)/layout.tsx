import Image from 'next/image'
import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div
        style={{
          background: 'var(--panel)',
          borderBottom: '1px solid var(--line)',
          padding: '0 32px',
          height: 64,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <Link href="/">
          <Image
            src="/logos_meus-politicos_colorido_semfundo.png"
            alt="Meus Politicos"
            height={28}
            width={140}
            style={{ height: 28, width: 'auto' }}
          />
        </Link>
      </div>
      <main>{children}</main>
    </>
  )
}
