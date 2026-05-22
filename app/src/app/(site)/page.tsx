import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { HomeCidadaoClient } from '@/components/site/home/HomeCidadaoClient'

export const metadata: Metadata = {
  title: 'Meus Políticos — Transparência política para qualquer cidadão',
  description:
    'Digite seu CEP e descubra quem te representa em Brasília. Votações, gastos e presença de todos os deputados federais e senadores.',
}

export type VotacaoRecente = {
  proposicao: string
  descricao_simples: string | null
  data: string
  total_sim: number
  total_nao: number
  total_abstencao: number
}

export default async function HomePage() {
  const supabase = await createClient()

  // Buscar votações recentes da Câmara (proposicao_id preenchido), agrupar por votação
  // Como Supabase client não faz GROUP BY, buscamos raw e agregamos em JS
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: raw } = await (supabase as any)
    .from('votacoes')
    .select('proposicao_id, proposicao, descricao_simples, data, voto')
    .not('proposicao_id', 'is', null)
    .not('data', 'is', null)
    .eq('source_id', 'camara_votos_bulk')
    .order('data', { ascending: false })
    .limit(600)

  // Agrupar por proposicao_id → pegar as 4 mais recentes distintas
  type VotMap = {
    proposicao_id: string
    proposicao: string | null
    descricao_simples: string | null
    data: string
    sim: number
    nao: number
    abstencao: number
  }
  const map = new Map<string, VotMap>()
  for (const r of raw ?? []) {
    if (!r.proposicao_id || !r.data) continue
    if (!map.has(r.proposicao_id)) {
      map.set(r.proposicao_id, {
        proposicao_id: r.proposicao_id,
        proposicao: r.proposicao,
        descricao_simples: r.descricao_simples,
        data: r.data,
        sim: 0,
        nao: 0,
        abstencao: 0,
      })
    }
    const entry = map.get(r.proposicao_id)!
    if (r.voto === 'sim') entry.sim++
    else if (r.voto === 'nao') entry.nao++
    else entry.abstencao++
  }

  const recentVotacoes: VotacaoRecente[] = Array.from(map.values())
    .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
    .slice(0, 4)
    .map((v) => ({
      proposicao: v.proposicao || v.proposicao_id,
      descricao_simples: v.descricao_simples,
      data: v.data,
      total_sim: v.sim,
      total_nao: v.nao,
      total_abstencao: v.abstencao,
    }))

  return <HomeCidadaoClient recentVotacoes={recentVotacoes} />
}
