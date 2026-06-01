import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Apoiar o Projeto | Meus Políticos',
  description: 'Complete seu apoio ao projeto independente de transparência política do Brasil.',
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
