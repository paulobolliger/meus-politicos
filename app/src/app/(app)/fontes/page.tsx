import type { Metadata } from 'next'
import { FontesContent } from '@/components/site/FontesContent'

export const metadata: Metadata = {
  title: 'Fontes de dados',
  description: 'De onde vêm os dados exibidos no Meus Políticos: rastreabilidade e transparência.',
}

export default function FontesPage() {
  return <FontesContent />
}
