export type SeguidoPolitico = {
  id: string
  slug: string
  nome: string
  nomeEleitoral: string
  partido: string
  uf: string
  cargo: string
  fotoUrl: string | null
  presencaPctAtual: number | null
  tipo?: 'voto' | 'seguir'
  gastos30d?: number
}

export interface RawPoliticoDb {
  id: string
  slug: string
  nome: string
  nome_eleitoral?: string | null
  cargo: string | null
  uf?: string | null
  foto_url?: string | null
  presenca_pct_atual?: number | null
  partido_sigla?: string | null
  partidos?: { sigla: string | null } | { sigla: string | null }[] | null
}

export function extrairSigla(partido: any): string {
  if (!partido) return '--'
  if (typeof partido === 'string') return partido
  if (Array.isArray(partido)) {
    return partido[0]?.sigla ?? '--'
  }
  return partido.sigla ?? '--'
}

export function normalizarPolitico(bruto: RawPoliticoDb): SeguidoPolitico | null {
  if (!bruto?.id || !bruto.slug) return null

  const partidoSigla = bruto.partido_sigla || extrairSigla(bruto.partidos)

  return {
    id: bruto.id,
    slug: bruto.slug,
    nome: bruto.nome,
    nomeEleitoral: bruto.nome_eleitoral ?? bruto.nome,
    partido: partidoSigla,
    uf: bruto.uf ?? '--',
    cargo: bruto.cargo ?? '',
    fotoUrl: bruto.foto_url ?? null,
    presencaPctAtual: bruto.presenca_pct_atual != null ? Number(bruto.presenca_pct_atual) : null,
  }
}

export interface RawPoliticoComparDb {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partido_sigla: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  total_emendas_ano: number | null
  total_emendas_historico: number | null
  mandato_inicio: string | null
  mandato_fim: string | null
}

export type PoliticoCompar = {
  id: string
  slug: string
  nome_eleitoral: string
  nome: string
  foto_url: string | null
  cargo: string | null
  uf: string | null
  partido_sigla: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  total_emendas_ano: number | null
  total_emendas_historico: number | null
  mandato_inicio: string | null
  mandato_fim: string | null
}

export function normalizarPoliticoComparar(r: RawPoliticoComparDb): PoliticoCompar {
  return {
    id: r.id,
    slug: r.slug,
    nome_eleitoral: r.nome_eleitoral ?? r.nome,
    nome: r.nome,
    foto_url: r.foto_url,
    cargo: r.cargo,
    uf: r.uf,
    partido_sigla: r.partido_sigla,
    presenca_pct_atual: r.presenca_pct_atual != null ? Number(r.presenca_pct_atual) : null,
    gasto_total_ano: r.gasto_total_ano != null ? Number(r.gasto_total_ano) : null,
    total_votacoes: r.total_votacoes != null ? Number(r.total_votacoes) : null,
    total_emendas_ano: r.total_emendas_ano != null ? Number(r.total_emendas_ano) : null,
    total_emendas_historico: r.total_emendas_historico != null ? Number(r.total_emendas_historico) : null,
    mandato_inicio: r.mandato_inicio,
    mandato_fim: r.mandato_fim,
  }
}

