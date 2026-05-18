export type PoliticoBusca = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  mandato_inicio: string | null
  partidos: { sigla: string | null } | null
}

export type BuscaChipCargo = {
  id: string
  label: string
  total: number | null
}

export type BuscaResponse = {
  items: PoliticoBusca[]
  total: number
  totalPaginas: number
  pagina: number
  porPagina: number
  elapsedMs: number
  totalIndexados: number
  chips: {
    cargos: BuscaChipCargo[]
    ufs: string[]
    partidos: string[]
  }
}
