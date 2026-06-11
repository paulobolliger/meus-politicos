import type { Metadata } from 'next'
import { BuscaClient } from '@/components/busca/BuscaClient'

export const metadata: Metadata = {
  title: 'Buscar Políticos e Representantes',
  description: 'Pesquise por deputados federais e senadores. Fiscalize a assiduidade nas sessões, gastos com CEAP e histórico de votações nominais com dados oficiais.',
}

export default function BuscaPage() {
  return <BuscaClient />
}
