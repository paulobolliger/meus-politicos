import { AdminSidebar } from './AdminSidebar'

interface AdminShellProps {
  children: React.ReactNode
  email: string
}

export function AdminShell({ children, email }: AdminShellProps) {
  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        fontFamily: 'var(--font-sans)',
      }}
    >
      <AdminSidebar email={email} />
      <main
        style={{
          flex: 1,
          minWidth: 0,
          background: 'var(--bg)',
          overflowY: 'auto',
        }}
      >
        {children}
      </main>
    </div>
  )
}
