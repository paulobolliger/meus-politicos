import { MeuEstadoContent } from '@/components/meu-estado/MeuEstadoContent'

type SearchParams = Promise<Record<string, string | string[] | undefined>>

type PageProps = {
  searchParams: SearchParams
}

export default async function MeuEstadoPage({ searchParams }: PageProps) {
  const params = await searchParams
  return <MeuEstadoContent searchParams={params} />
}
