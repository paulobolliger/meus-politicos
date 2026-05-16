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

  let { data } = await supabase
    .from('politicos')
    .select('nome, nome_eleitoral')
    .eq('slug', id)
    .maybeSingle()

  if (!data) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      const { data: byId } = await supabase
        .from('politicos')
        .select('nome, nome_eleitoral')
        .eq('id', id)
        .maybeSingle()
      data = byId
    }
  }

  if (!data) return { title: 'Político não encontrado' }

  return {
    title: `${data.nome_eleitoral ?? data.nome} · Meus Políticos`,
  }
}

export default async function AppPerfilPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()

  let { data: politico } = await supabase
    .from('politicos')
    .select('*')
    .eq('slug', id)
    .maybeSingle()

  if (!politico) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      const { data } = await supabase
        .from('politicos')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      politico = data
    }
  }

  if (!politico) notFound()

  const [{ data: votacoes }, { data: gastos }, { data: presenca }] = await Promise.all([
    supabase
      .from('votacoes')
      .select('id, voto, descricao_simples, data, proposicao')
      .eq('politico_id', politico.id)
      .order('data', { ascending: false })
      .limit(8),
    supabase
      .from('gastos')
      .select('valor, categoria, mes, ano')
      .eq('politico_id', politico.id)
      .eq('ano', 2025)
      .limit(100),
    supabase
      .from('presenca')
      .select('percentual, mes, ano, total_sessoes, presencas')
      .eq('politico_id', politico.id)
      .order('ano', { ascending: false })
      .order('mes', { ascending: false })
      .limit(24),
  ])

  return (
    <PerfilApp
      politico={politico}
      votacoes={votacoes ?? []}
      gastos={gastos ?? []}
      presenca={presenca ?? []}
    />
  )
}
