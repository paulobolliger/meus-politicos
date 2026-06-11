import type { Metadata } from 'next'
import { ComissoesSenadoClient } from './ComissoesSenadoClient'

export const revalidate = 86400

export const metadata: Metadata = {
  title: 'Comissões Permanentes do Senado | Meus Políticos',
  description: 'Conheça todas as 17 comissões temáticas do Senado Federal, suas atribuições legislativas e projetos de lei em tramitação.',
}

export default function ComissoesSenadoPage() {
  return <ComissoesSenadoClient />
}
