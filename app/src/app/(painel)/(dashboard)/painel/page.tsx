import { redirect } from 'next/navigation'

import { AlertasList } from '@/components/painel/AlertasList'
import { FeedCivico, type FeedEvento } from '@/components/painel/FeedCivico'
import { KpiStrip } from '@/components/painel/KpiStrip'
import { PainelHeader } from '@/components/painel/PainelHeader'
import { ProximasVotacoes } from '@/components/painel/ProximasVotacoes'
import { SeguindoList, type SeguidoPolitico } from '@/components/painel/SeguindoList'
import { createAdminClient, createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type AcompanhamentoRow = {
  politico_id: string
}

type PoliticoResumoRow = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  presenca_pct_atual: number | null
  partidos: { sigla: string | null } | { sigla: string | null }[] | null
}

type VotacaoRow = Pick<
  Database['public']['Tables']['votacoes']['Row'],
  'id' | 'politico_id' | 'data' | 'hora' | 'voto' | 'descricao_simples' | 'proposicao'
>

type GastoRow = Pick<
  Database['public']['Tables']['gastos']['Row'],
  'id' | 'politico_id' | 'valor' | 'categoria' | 'fornecedor' | 'mes' | 'ano' | 'descricao' | 'criado_em'
>

function extrairSigla(partidos: { sigla: string | null } | { sigla: string | null }[] | null | undefined): string {
  if (!partidos) return '--'
  if (Array.isArray(partidos)) {
    return partidos[0]?.sigla ?? '--'
  }
  return partidos.sigla ?? '--'
}

function normalizarPolitico(bruto: PoliticoResumoRow): SeguidoPolitico | null {
  if (!bruto?.id || !bruto.slug) return null

  return {
    id: bruto.id,
    slug: bruto.slug,
    nome: bruto.nome,
    nomeEleitoral: bruto.nome_eleitoral ?? bruto.nome,
    partido: extrairSigla(bruto.partidos),
    uf: bruto.uf ?? '--',
    cargo: bruto.cargo,
    fotoUrl: bruto.foto_url,
    presencaPctAtual: bruto.presenca_pct_atual,
  }
}

function votoChip(voto: string): 'SIM' | 'NÃO' | 'ABS' | 'AUS' | 'OBS' {
  const v = voto.toLowerCase()
  if (v === 'sim') return 'SIM'
  if (v === 'nao') return 'NÃO'
  if (v === 'abstencao') return 'ABS'
  if (v === 'ausente') return 'AUS'
  return 'OBS'
}

function tipoBadge(voto: string): FeedEvento['badgeTipo'] {
  const v = voto.toLowerCase()
  if (v === 'sim') return 'VOTAÇÃO_POS'
  if (v === 'nao') return 'VOTAÇÃO_NEG'
  return 'VOTAÇÃO_NEUTRA'
}

function inicioDiaISO(data: Date): string {
  const d = new Date(data)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function seteDiasAtrasISO(data: Date): string {
  const d = new Date(data)
  d.setDate(d.getDate() - 7)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function isFeedEvento(item: FeedEvento | null): item is FeedEvento {
  return item !== null
}

export default async function PainelPage() {
  const supabase = await createClient()
  const db = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : supabase
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const agora = new Date()
  const dataSeteDias = seteDiasAtrasISO(agora)
  const inicioHoje = inicioDiaISO(agora)

  const { data: perfil } = await supabase.from('perfis').select('nome').eq('id', user.id).single()

  const { data: acompanhamentosRows, error: acompanhamentosError } = await db
    .from('acompanhamentos')
    .select('politico_id')
    .eq('usuario_id', user.id)

  if (acompanhamentosError) {
    // Mantem o painel funcional sem quebrar a renderizacao em dev.
  }

  const acompanhamentos = (acompanhamentosRows ?? []) as AcompanhamentoRow[]
  const idsAcompanhados = Array.from(new Set(acompanhamentos.map((a) => a.politico_id).filter(Boolean)))

  const { data: politicosRows, error: politicosError } = idsAcompanhados.length
    ? await supabase
        .from('politicos')
        .select('id, slug, nome, nome_eleitoral, cargo, uf, foto_url, presenca_pct_atual, partidos:partido_id(sigla)')
        .in('id', idsAcompanhados)
    : { data: [], error: null }

  if (politicosError) {
    // Mantem o painel funcional sem quebrar a renderizacao em dev.
  }

  const politicosMap = new Map(
    (((politicosRows ?? []) as PoliticoResumoRow[]).map((p) => [p.id, p] as const))
  )

  const seguindo = idsAcompanhados
    .map((id) => {
      const politico = politicosMap.get(id)
      if (!politico) return null
      return normalizarPolitico(politico)
    })
    .filter((p): p is SeguidoPolitico => Boolean(p?.id))

  const ids = seguindo.map((p) => p.id)
  const politicosPorId = new Map(seguindo.map((p) => [p.id, p] as const))

  let votacoes7d: VotacaoRow[] = []
  let gastos7d: GastoRow[] = []

  if (ids.length > 0) {
    const { data: votacoesData } = await supabase
      .from('votacoes')
      .select('id, politico_id, data, hora, voto, descricao_simples, proposicao')
      .in('politico_id', ids)
      .gte('data', dataSeteDias)
      .order('data', { ascending: false })
      .limit(20)

    const { data: gastosData } = await supabase
      .from('gastos')
      .select('id, politico_id, valor, categoria, fornecedor, mes, ano, descricao, criado_em')
      .in('politico_id', ids)
      .gte('criado_em', dataSeteDias)
      .order('criado_em', { ascending: false })
      .limit(20)

    votacoes7d = (votacoesData ?? []) as VotacaoRow[]
    gastos7d = (gastosData ?? []) as GastoRow[]
  }

  const eventosVotacao = votacoes7d
    .map((row) => {
      const politico = politicosPorId.get(row.politico_id)
      if (!politico) return null
      const item: FeedEvento = {
        id: `vot-${row.id}`,
        tipo: 'VOTAÇÃO',
        badgeTipo: tipoBadge(row.voto),
        voto: votoChip(row.voto),
        timestamp: row.data,
        hora: row.hora ?? '00:00',
        politico,
        titulo: row.proposicao ?? 'Votação em plenário',
        descricao: row.descricao_simples ?? 'Sem descrição simplificada.',
        contexto: `Voto registrado: ${row.voto}`,
        source: 'camara/senado',
      }
      return item
    })
    .filter(isFeedEvento)

  const eventosGasto = gastos7d
    .map((row) => {
      const politico = politicosPorId.get(row.politico_id)
      if (!politico) return null
      const item: FeedEvento = {
        id: `gst-${row.id}`,
        tipo: 'GASTOS',
        badgeTipo: 'ALERTA_GASTOS',
        voto: null,
        timestamp: row.criado_em ?? `${row.ano}-${String(row.mes).padStart(2, '0')}-01`,
        hora: '00:00',
        politico,
        titulo: row.categoria ?? 'Gasto parlamentar',
        descricao:
          row.descricao ??
          `Fornecedor: ${row.fornecedor ?? 'não informado'} · Valor: ${Number(row.valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`,
        contexto: `Mês ${String(row.mes).padStart(2, '0')}/${row.ano}`,
        source: 'portal-transparencia',
      }
      return item
    })
    .filter(isFeedEvento)

  const feedEventos = [...eventosVotacao, ...eventosGasto]
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 40)

  const eventosHojeVot = votacoes7d.filter((v) => new Date(v.data).getTime() >= new Date(inicioHoje).getTime()).length
  const eventosHojeGasto = gastos7d.filter((g) => {
    if (!g.criado_em) return false
    return new Date(g.criado_em).getTime() >= new Date(inicioHoje).getTime()
  }).length

  const depCount = seguindo.filter((p) => p.cargo.toLowerCase().includes('deput')).length
  const senCount = seguindo.filter((p) => p.cargo.toLowerCase().includes('sen')).length

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100%' }}>
      <div className="painel-page-layout" style={{ padding: 24, display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div style={{ flex: 1.6, minWidth: 0 }}>
          <PainelHeader
            email={user.email ?? 'usuario@meuspoliticos.com.br'}
            nomeUsuario={(perfil?.nome as string | null) ?? user.email ?? 'cidadão'}
            atualizacoesCount={feedEventos.length}
          />

          <KpiStrip
            politicosSeguidos={seguindo.length}
            depCount={depCount}
            senCount={senCount}
            eventosHoje={eventosHojeVot + eventosHojeGasto}
            alertasAtivos={0}
            proximaVotacaoLabel={null}
          />

          <div style={{ marginTop: 16 }}>
            <FeedCivico feedEventos={feedEventos} totalSeguidos={seguindo.length} />
          </div>
        </div>

        <div className="painel-sidebar" style={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <SeguindoList seguindo={seguindo} />
          <AlertasList />
          <ProximasVotacoes />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .painel-page-layout {
            flex-direction: column !important;
            padding: 16px !important;
          }
          .painel-sidebar {
            width: 100% !important;
            min-width: 0 !important;
          }
        }
        @media (max-width: 640px) {
          .feed-item-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  )
}
