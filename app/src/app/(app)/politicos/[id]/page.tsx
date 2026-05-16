import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { createClient } from '@/lib/supabase/server'
import { PerfilApp } from '@/components/politico-v2/PerfilApp'

type PageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  const { data } = await supabase
    .from('politicos')
    .select('nome, nome_eleitoral')
    .or(`slug.eq.${id},id.eq.${id}`)
    .maybeSingle()

  if (!data) return { title: 'Político não encontrado' }

  return {
    title: `${data.nome_eleitoral ?? data.nome} · Meus Políticos`,
  }
}

export default async function AppPerfilPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: politico } = await supabase
    .from('politicos')
    .select(
      `
      *,
      partidos(sigla, nome, numero),
      redes_sociais(plataforma, url),
      gastos(valor, categoria, mes, ano),
      presenca(percentual, mes, ano, total_sessoes, presencas),
      votacoes(id, voto, descricao_simples, data, proposicao)
      `
    )
    .or(`slug.eq.${id},id.eq.${id}`)
    .order('data', { referencedTable: 'votacoes', ascending: false })
    .limit(8, { referencedTable: 'votacoes' })
    .limit(24, { referencedTable: 'gastos' })
    .limit(24, { referencedTable: 'presenca' })
    .maybeSingle()

  if (!politico) notFound()

  return <PerfilApp politico={politico} />
}
