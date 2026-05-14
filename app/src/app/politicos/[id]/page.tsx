import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { PoliticoDashboardV2 } from '@/components/politico-v2/PoliticoDashboardV2'
import type { Database } from '@/lib/supabase/types'

type PageProps = {
  params: Promise<{ id: string }>
}

type PoliticoPerfil = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  uf_nascimento: string | null
  sexo: string | null
  foto_url: string | null
  email: string | null
  gabinete_nome: string | null
  gabinete_telefone: string | null
  gabinete_email: string | null
  data_nascimento: string | null
  naturalidade: string | null
  escolaridade: string | null
  ocupacao: string | null
  mandato_inicio: string | null
  mandato_fim: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  dado_estado: Database['public']['Enums']['dado_estado'] | null
  collected_at: string | null
  partidos: { sigla: string | null; nome: string | null; numero: number | null } | null
  redes_sociais: Array<{ plataforma: string | null; url: string | null }> | null
}

async function buscarPolitico(idOuSlug: string): Promise<PoliticoPerfil | null> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data } = await supabase
    .from('politicos')
    .select(`
      id, slug, nome, nome_civil, nome_eleitoral,
      cargo, uf, uf_nascimento, sexo,
      foto_url, foto_url,
      email, gabinete_nome, gabinete_telefone, gabinete_email,
      data_nascimento, naturalidade, escolaridade, ocupacao,
      mandato_inicio, mandato_fim,
      presenca_pct_atual, gasto_total_ano, total_votacoes,
      dado_estado, collected_at,
      partidos(sigla, nome, numero),
      redes_sociais(plataforma, url)
    `)
    .or(`slug.eq.${idOuSlug},id.eq.${idOuSlug}`)
    .maybeSingle()

  return data as PoliticoPerfil | null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const politico = await buscarPolitico(id)

  if (!politico) {
    return {
      title: 'Politico nao encontrado - V2',
    }
  }

  return {
    title: `${politico.nome_eleitoral ?? politico.nome} - Radar Politico V2`,
  }
}

export default async function PoliticoV2Page({ params }: PageProps) {
  const { id } = await params
  const politico = await buscarPolitico(id)

  if (!politico) {
    notFound()
  }

  return <PoliticoDashboardV2 politico={{ ...politico, redes_sociais: politico.redes_sociais ?? [] }} />
}