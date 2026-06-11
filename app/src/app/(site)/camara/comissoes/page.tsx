import type { Metadata } from 'next'
import { ComissoesClient } from './ComissoesClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Comissões Permanentes da Câmara | Meus Políticos',
  description: 'Conheça todas as 30 comissões temáticas da Câmara dos Deputados, suas atribuições legislativas e projetos de lei em tramitação.',
}

export default function ComissoesPage() {
  return <ComissoesClient />
}
