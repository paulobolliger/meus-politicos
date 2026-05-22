import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { PerfilApp } from '@/components/politico-v2/PerfilApp'
import { PerfilSite } from '@/components/politico-v2/PerfilSite'

type PageProps = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ aba?: string; follow?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()

  let { data } = await supabase
    .from('politicos')
    .select('nome, nome_eleitoral, cargo, uf')
    .eq('slug', id)
    .maybeSingle()

  if (!data) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (uuidRegex.test(id)) {
      const { data: byId } = await supabase
        .from('politicos')
        .select('nome, nome_eleitoral, cargo, uf')
        .eq('id', id)
        .maybeSingle()
      data = byId
    }
  }

  if (!data) return { title: 'Político não encontrado' }

  const nome = data.nome_eleitoral ?? data.nome ?? ''
  return {
    title: `${nome} · Meus Políticos`,
    description: `Votações, gastos e presença de ${nome} em linguagem simples.`,
  }
}

export default async function PerfilPage({ params, searchParams }: PageProps) {
  const { id } = await params
  const { aba = 'votacoes', follow } = await searchParams
  const followIntent = follow === '1'

  // ── detectar host para branching site vs app ──
  const headersList = await headers()
  const host = headersList.get('host') ?? ''
  const isSite = !host.startsWith('app.')

  const supabase = await createClient()
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

  // ── versão SITE (cidadão) ──
  if (isSite) {
    let { data: politico } = await supabase
      .from('politicos')
      .select('id, slug, nome, nome_eleitoral, foto_url, cargo, uf, partido_id, mandato_inicio, mandato_fim, presenca_pct_atual, gasto_total_ano, total_votacoes')
      .eq('slug', id)
      .maybeSingle()

    if (!politico && uuidRegex.test(id)) {
      const { data } = await supabase
        .from('politicos')
        .select('id, slug, nome, nome_eleitoral, foto_url, cargo, uf, partido_id, mandato_inicio, mandato_fim, presenca_pct_atual, gasto_total_ano, total_votacoes')
        .eq('id', id)
        .maybeSingle()
      politico = data
    }

    if (!politico) notFound()

    const {
      data: { user },
    } = await supabase.auth.getUser()
    const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase

    const [{ data: partidoData }, { data: votacoes }, { data: gastos }, { data: presencaRows }, { data: emendas }, { data: acompanhamento }] =
      await Promise.all([
        politico.partido_id
          ? supabase.from('partidos').select('sigla').eq('id', politico.partido_id).maybeSingle()
          : Promise.resolve({ data: null }),
        supabase
          .from('votacoes')
          .select('id, voto, descricao_simples, data, proposicao')
          .eq('politico_id', politico.id)
          .order('data', { ascending: false })
          .limit(20),
        supabase
          .from('gastos')
          .select('valor, categoria')
          .eq('politico_id', politico.id)
          .eq('ano', new Date().getFullYear())
          .limit(200),
        supabase
          .from('presenca')
          .select('percentual, mes, ano, total_sessoes, presencas')
          .eq('politico_id', politico.id)
          .order('ano', { ascending: false })
          .order('mes', { ascending: false })
          .limit(12),
        supabase
          .from('emendas')
          .select('id, valor, valor_pago, municipio_destino, uf_destino, area, municipio_nome, uf_municipio, funcao, ano')
          .eq('politico_id', politico.id)
          .order('valor_pago', { ascending: false })
          .limit(20),
        user
          ? db
              .from('acompanhamentos')
              .select('id')
              .eq('usuario_id', user.id)
              .eq('politico_id', politico.id)
              .maybeSingle()
          : Promise.resolve({ data: null }),
      ])

    return (
      <PerfilSite
        politico={politico}
        partido={partidoData}
        votacoes={votacoes ?? []}
        gastos={gastos ?? []}
        presencaRows={presencaRows ?? []}
        emendas={emendas ?? []}
        aba={aba}
        isSeguindo={!!acompanhamento}
        followIntent={followIntent}
      />
    )
  }

  // ── versão APP (analítica) ──
  let { data: politico } = await supabase
    .from('politicos')
    .select('id, slug, nome, nome_civil, nome_eleitoral, foto_url, cargo, uf, uf_nascimento, sexo, email, gabinete_nome, gabinete_telefone, gabinete_email, data_nascimento, naturalidade, escolaridade, ocupacao, partido_id, mandato_inicio, mandato_fim, presenca_pct_atual, gasto_total_ano, total_votacoes, codigo_siafi, dado_estado, collected_at, removido_em')
    .eq('slug', id)
    .maybeSingle()

  if (!politico && uuidRegex.test(id)) {
    const { data } = await supabase
      .from('politicos')
      .select('id, slug, nome, nome_civil, nome_eleitoral, foto_url, cargo, uf, uf_nascimento, sexo, email, gabinete_nome, gabinete_telefone, gabinete_email, data_nascimento, naturalidade, escolaridade, ocupacao, partido_id, mandato_inicio, mandato_fim, presenca_pct_atual, gasto_total_ano, total_votacoes, codigo_siafi, dado_estado, collected_at, removido_em')
      .eq('id', id)
      .maybeSingle()
    politico = data
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
