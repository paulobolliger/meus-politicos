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

  const POLITICO_FIELDS = 'id, slug, nome, nome_civil, nome_eleitoral, foto_url, cargo, uf, uf_nascimento, sexo, email, gabinete_nome, gabinete_telefone, gabinete_email, data_nascimento, naturalidade, escolaridade, ocupacao, partido_id, mandato_inicio, mandato_fim, presenca_pct_atual, gasto_total_ano, total_votacoes, codigo_siafi, dado_estado, collected_at, removido_em'

  let { data: politico } = await supabase
    .from('politicos')
    .select(POLITICO_FIELDS)
    .eq('slug', id)
    .maybeSingle()

  if (!politico) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      const { data } = await supabase
        .from('politicos')
        .select(POLITICO_FIELDS)
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
      .eq('ano', new Date().getFullYear())
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
