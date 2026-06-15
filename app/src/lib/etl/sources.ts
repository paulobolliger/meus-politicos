export type EtlSourceDefinition = {
  allowedParams: readonly string[]
  defaultParams?: Record<string, unknown>
}

export const ETL_SOURCES = {
  camara_deputados: { allowedParams: [] },
  camara_ceap: { allowedParams: ['ano', 'paginas'] },
  camara_votacoes: { allowedParams: [] },
  camara_proposicoes: { allowedParams: ['ano', 'tipo', 'paginas'] },
  senado_senadores: { allowedParams: [] },
  senado_ceap: { allowedParams: ['ano'] },
  senado_votacoes: { allowedParams: [] },
  portal_transparencia_emendas: { allowedParams: ['anos', 'tipo'] },
  ibge_municipios: { allowedParams: [] },
  ibge_estados: { allowedParams: ['ano'] },
  stn_pacto_federativo: { allowedParams: ['ano'] },
  stn_financas_municipais: { allowedParams: ['ano', 'uf'] },
  tse_candidatos_2026: { allowedParams: [] },
} as const satisfies Record<string, EtlSourceDefinition>

export type EtlSource = keyof typeof ETL_SOURCES

export function sanitizeEtlParams(source: EtlSource, value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}

  const allowed = new Set<string>(ETL_SOURCES[source].allowedParams)
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => allowed.has(key))
      .map(([key, item]) => [key, item])
  )
}
