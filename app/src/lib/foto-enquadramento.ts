type FotoEnquadramentoInput = {
  cargo?: string | null
  slug?: string | null
}

const CARGO_FOTO_OBJETO: Record<string, string> = {
  presidente: 'object-[50%_16%]',
  vice_presidente: 'object-[50%_16%]',
  governador: 'object-[50%_16%]',
  vice_governador: 'object-[50%_16%]',
  senador: 'object-[50%_15%]',
  deputado_federal: 'object-[50%_18%]',
  deputado_estadual: 'object-[50%_18%]',
  prefeito: 'object-[50%_18%]',
  vice_prefeito: 'object-[50%_18%]',
  vereador: 'object-[50%_20%]',
}

// Ajustes finos para retratos conhecidos que fogem do enquadramento medio.
const POLITICO_FOTO_OBJETO: Record<string, string> = {
  'acacio-favacho': 'object-[50%_12%]',
  'acacio-da-silva-favacho-neto': 'object-[50%_12%]',
}

export function classeFotoEnquadramento({ cargo, slug }: FotoEnquadramentoInput) {
  if (slug) {
    const ajustePorSlug = POLITICO_FOTO_OBJETO[slug]
    if (ajustePorSlug) return ajustePorSlug
  }

  if (cargo) {
    return CARGO_FOTO_OBJETO[cargo] ?? 'object-[50%_18%]'
  }

  return 'object-[50%_18%]'
}
