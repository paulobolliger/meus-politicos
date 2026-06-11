import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getPgPool } from '@/lib/db/pool'

import { FeedCivico, type FeedEvento } from '@/components/painel/FeedCivico'
import { KpiStrip } from '@/components/painel/KpiStrip'
import { PainelHeader } from '@/components/painel/PainelHeader'
import { SeguindoList, type SeguidoPolitico } from '@/components/painel/SeguindoList'
import { getCurrentUser } from '@/lib/auth/current-user'

type AcompanhamentoRow = {
  politico_id: string
  tipo: string
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

type PerfilRow = {
  nome: string | null
}

type VotacaoRow = {
  id: string
  politico_id: string
  data: string
  hora: string | null
  voto: string
  descricao_simples: string | null
  proposicao: string | null
}

type GastoRow = {
  id: string
  politico_id: string
  valor: number | string | null
  categoria: string | null
  fornecedor: string | null
  mes: number
  ano: number
  descricao: string | null
  criado_em: string | null
}
import { normalizarPolitico } from '@/lib/utils/politicos'


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

function trintaDiasAtrasISO(data: Date): string {
  const d = new Date(data)
  d.setDate(d.getDate() - 30)
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

function isFeedEvento(item: FeedEvento | null): item is FeedEvento {
  return item !== null
}

export default async function PainelPage() {
  const db = getPgPool()
  const currentUser = await getCurrentUser()

  if (!currentUser) {
    redirect('/login')
  }

  const agora = new Date()
  const dataSeteDias = seteDiasAtrasISO(agora)
  const inicioHoje = inicioDiaISO(agora)

  const { rows: perfilRows } = await db.query<PerfilRow>(
    'SELECT nome FROM perfis WHERE id = $1 LIMIT 1',
    [currentUser.perfilId],
  )
  const perfil = perfilRows[0] ?? null

  let acompanhamentosRows: AcompanhamentoRow[] = []
  try {
    const { rows } = await db.query<AcompanhamentoRow>(
      'SELECT politico_id, tipo FROM acompanhamentos WHERE usuario_id = $1',
      [currentUser.perfilId],
    )
    acompanhamentosRows = rows
  } catch {
    // Mantem o painel funcional sem quebrar a renderizacao em dev.
  }

  const acompanhamentos = acompanhamentosRows ?? []
  const idsAcompanhados = Array.from(new Set(acompanhamentos.map((a) => a.politico_id).filter(Boolean)))
  const acompanhamentosTipoMap = new Map(acompanhamentos.map((a) => [a.politico_id, a.tipo]))

  let politicosRows: PoliticoResumoRow[] = []
  if (idsAcompanhados.length) {
    try {
      const { rows } = await db.query<PoliticoResumoRow>(
        `SELECT
           p.id,
           p.slug,
           p.nome,
           p.nome_eleitoral,
           p.cargo,
           p.uf,
           p.foto_url,
           p.presenca_pct_atual,
           CASE WHEN pa.sigla IS NULL THEN NULL ELSE json_build_object('sigla', pa.sigla) END AS partidos
         FROM politicos p
         LEFT JOIN partidos pa ON pa.id = p.partido_id
         WHERE p.id = ANY($1::uuid[])`,
        [idsAcompanhados],
      )
      politicosRows = rows
    } catch {
      // Mantem o painel funcional sem quebrar a renderizacao em dev.
    }
  }

  const politicosMap = new Map(politicosRows.map((p) => [p.id, p] as const))

  const seguindo = idsAcompanhados
    .map((id) => {
      const politico = politicosMap.get(id)
      if (!politico) return null
      const item = normalizarPolitico(politico)
      if (!item) return null
      item.tipo = (acompanhamentosTipoMap.get(id) || 'seguir') as 'voto' | 'seguir'
      return item
    })
    .filter((p): p is SeguidoPolitico => p !== null)

  const ids = seguindo.map((p) => p.id)
  const politicosPorId = new Map(seguindo.map((p) => [p.id, p] as const))

  // Cálculo da média de presença em memória
  const politicosComPresenca = seguindo.filter((p) => p.presencaPctAtual !== null)
  const mediaPresenca = politicosComPresenca.length > 0
    ? politicosComPresenca.reduce((acc, p) => acc + (p.presencaPctAtual ?? 0), 0) / politicosComPresenca.length
    : null

  let totalGastos30d = 0
  let votacoes7d: VotacaoRow[] = []
  let gastos7d: GastoRow[] = []
  let sugestoes: SeguidoPolitico[] = []
  let gastosIndividuais: Record<string, number> = {}

  if (ids.length > 0) {
    const dataTrintaDias = trintaDiasAtrasISO(agora)
    const [{ rows: votacoesData }, { rows: gastosData }, { rows: totalGastosRows }] = await Promise.all([
      db.query<VotacaoRow>(
        `SELECT id, politico_id, data::text AS data, hora::text AS hora, voto, descricao_simples, proposicao
         FROM votacoes
         WHERE politico_id = ANY($1::uuid[])
           AND data >= $2
         ORDER BY data DESC
         LIMIT 20`,
        [ids, dataSeteDias],
      ),
      db.query<GastoRow>(
        `SELECT id, politico_id, valor, categoria, fornecedor, mes, ano, descricao, criado_em::text AS criado_em
         FROM gastos
         WHERE politico_id = ANY($1::uuid[])
           AND criado_em >= $2
         ORDER BY criado_em DESC
         LIMIT 20`,
        [ids, dataSeteDias],
      ),
      db.query<{ politico_id: string; total: number | string | null }>(
        `SELECT politico_id, SUM(COALESCE(valor::numeric, 0)) AS total
         FROM gastos
         WHERE politico_id = ANY($1::uuid[])
           AND criado_em >= $2
         GROUP BY politico_id`,
        [ids, dataTrintaDias],
      ),
    ])

    votacoes7d = votacoesData ?? []
    gastos7d = gastosData ?? []
    
    gastosIndividuais = Object.fromEntries(
      (totalGastosRows ?? []).map((r) => [r.politico_id, Number(r.total || 0)] as const)
    )
    totalGastos30d = Object.values(gastosIndividuais).reduce((acc, val) => acc + val, 0)

    // Injeta os gastos individuais nos políticos seguidos
    for (const p of seguindo) {
      p.gastos30d = gastosIndividuais[p.id] ?? 0
    }
  } else {
    // Buscar sugestões de políticos caso o usuário não siga ninguém
    try {
      const { rows: sugeridosRows } = await db.query<PoliticoResumoRow>(
        `SELECT
           p.id,
           p.slug,
           p.nome,
           p.nome_eleitoral,
           p.cargo,
           p.uf,
           p.foto_url,
           p.presenca_pct_atual,
           CASE WHEN pa.sigla IS NULL THEN NULL ELSE json_build_object('sigla', pa.sigla) END AS partidos
         FROM politicos p
         LEFT JOIN partidos pa ON pa.id = p.partido_id
         WHERE p.situacao = 'ativo' AND p.foto_url IS NOT NULL
         ORDER BY p.presenca_pct_atual DESC NULLS LAST
         LIMIT 5`
      )
      sugestoes = sugeridosRows
        .map((r) => normalizarPolitico(r))
        .filter((p): p is SeguidoPolitico => p !== null)
    } catch (err) {
      console.error('Erro ao buscar sugestões de políticos:', err)
    }
  }

  const eventosVotacao = votacoes7d
    .map((row) => {
      const politico = politicosPorId.get(row.politico_id)
      if (!politico) return null
      const isVoto = acompanhamentosTipoMap.get(row.politico_id) === 'voto'
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
        isVoto,
      }
      return item
    })
    .filter(isFeedEvento)

  const eventosGasto = gastos7d
    .map((row) => {
      const politico = politicosPorId.get(row.politico_id)
      if (!politico) return null
      const isVoto = acompanhamentosTipoMap.get(row.politico_id) === 'voto'
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
        isVoto,
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
    <div style={{ background: 'var(--bg)', minHeight: '100%', position: 'relative', overflow: 'hidden' }}>
      {/* Glow background circles */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '10%',
        width: '400px',
        height: '400px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, rgba(99, 102, 241, 0) 70%)',
        filter: 'blur(60px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '-5%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.1) 0%, rgba(236, 72, 153, 0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      <div className="painel-page-layout" style={{ position: 'relative', zIndex: 1, padding: '28px 24px', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
        <div style={{ flex: 1.6, minWidth: 0 }}>
          <PainelHeader
            email={currentUser.email ?? 'usuario@meuspoliticos.com.br'}
            nomeUsuario={(perfil?.nome as string | null) ?? currentUser.email ?? 'cidadão'}
            atualizacoesCount={feedEventos.length}
          />

          <KpiStrip
            politicosSeguidos={seguindo.length}
            depCount={depCount}
            senCount={senCount}
            eventosHoje={eventosHojeVot + eventosHojeGasto}
            totalGastos30d={totalGastos30d}
            mediaPresenca={mediaPresenca}
          />

          {seguindo.length > 0 && (
            <div style={{
              marginTop: 20,
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 14,
              padding: '20px 24px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            }}>
              <h2 style={{
                margin: '0 0 16px',
                fontSize: 10,
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                color: 'var(--ink-3)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}>
                Desempenho Individual dos Políticos Monitorados
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
                {seguindo.map((p) => {
                  const presenceColor = p.presencaPctAtual === null ? 'var(--ink-3)' : p.presencaPctAtual > 85 ? 'var(--pos)' : p.presencaPctAtual >= 70 ? 'var(--warn)' : 'var(--neg)'
                  const presencePct = p.presencaPctAtual ?? 0
                  return (
                    <div
                      key={p.id}
                      style={{
                        background: 'rgba(30, 41, 59, 0.25)',
                        border: '1px solid var(--line)',
                        borderRadius: 10,
                        padding: 16,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14,
                      }}
                    >
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                        {p.fotoUrl ? (
                          <img
                            src={p.fotoUrl}
                            alt={p.nomeEleitoral}
                            style={{ width: 36, height: 36, borderRadius: 999, objectFit: 'cover', border: '1px solid var(--line)' }}
                          />
                        ) : (
                          <div style={{ width: 36, height: 36, borderRadius: 999, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 11 }}>
                            {p.nomeEleitoral.charAt(0)}
                          </div>
                        )}
                        <div>
                          <Link href={`/painel/politicos/${p.slug}`} style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink)', textDecoration: 'none' }}>
                            {p.nomeEleitoral}
                          </Link>
                          <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.partido}-{p.uf} · {p.cargo}</div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                          <span style={{ color: 'var(--ink-3)' }}>PRESENÇA PLENÁRIA</span>
                          <span style={{ fontWeight: 700, color: presenceColor }}>{p.presencaPctAtual !== null ? `${Math.round(presencePct)}%` : '—'}</span>
                        </div>
                        <div style={{ height: 4, background: 'var(--bg)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${presencePct}%`, background: presenceColor, borderRadius: 2 }} />
                        </div>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: 10 }}>
                        <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>GASTOS (ÚLT. 30 DIAS)</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand-2)' }}>
                          {(p.gastos30d ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div style={{ marginTop: 20 }}>
            <FeedCivico feedEventos={feedEventos} totalSeguidos={seguindo.length} sugestoes={sugestoes} />
          </div>
        </div>

        <div className="painel-sidebar" style={{ width: 320, minWidth: 320, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <SeguindoList seguindo={seguindo} />
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          .painel-page-layout {
            flex-direction: column !important;
            padding: 20px 16px !important;
            gap: 20px !important;
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
