import type { Metadata } from 'next'
import { HomeCidadaoClient } from '@/components/site/home/HomeCidadaoClient'

export const metadata: Metadata = {
  title: 'Meus Políticos — Transparência política para qualquer cidadão',
  description:
    'Digite seu CEP e descubra quem te representa em Brasília. Votações, gastos e presença de todos os deputados federais.',
}

export default function HomePage() {
  return <HomeCidadaoClient />
}
