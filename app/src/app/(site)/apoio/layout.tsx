import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apoie o Projeto | Meus Políticos',
  description: 'Meus Políticos é independente, sem paywall e sem alinhamento partidário. Sustente a transparência política no Brasil.',
}

export default function ApoioLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
