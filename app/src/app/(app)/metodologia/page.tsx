import type { Metadata } from 'next'
import { MetodologiaContent } from '@/components/site/MetodologiaContent'

export const metadata: Metadata = {
  title: 'Metodologia',
  description: 'Como calculamos os dados: metodologia científica dos scores do Meus Políticos.',
}

export default function MetodologiaPage() {
  return <MetodologiaContent />
}
