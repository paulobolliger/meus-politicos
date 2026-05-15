import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export type SocialLink = {
  plataforma: string | null
  url: string | null
}

export type PoliticoDashboardV2Data = {
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
  dado_estado: string | null
  collected_at: string | null
  partidos: { sigla: string | null; nome: string | null; numero: number | null } | null
  redes_sociais: SocialLink[]
}

export type VotoItem = {
  id: string
  descricao: string
  voto: 'sim' | 'nao' | 'abstencao'
  data: string
}

export const NA = 'Não informado'

export const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  vice_presidente: 'Vice-presidente',
  governador: 'Governador',
  vice_governador: 'Vice-governador',
  senador: 'Senador',
  deputado_federal: 'Deputado Federal',
  deputado_estadual: 'Deputado Estadual',
  prefeito: 'Prefeito',
  vice_prefeito: 'Vice-prefeito',
  vereador: 'Vereador',
}

export const CARGO_BADGE_CLASS: Record<string, string> = {
  presidente: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
  vice_presidente: 'bg-purple-100 text-purple-800 border-purple-200',
  governador: 'bg-sky-100 text-sky-800 border-sky-200',
  vice_governador: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  senador: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  deputado_federal: 'bg-blue-100 text-blue-800 border-blue-200',
  deputado_estadual: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  prefeito: 'bg-amber-100 text-amber-800 border-amber-200',
  vice_prefeito: 'bg-orange-100 text-orange-800 border-orange-200',
  vereador: 'bg-rose-100 text-rose-800 border-rose-200',
}

export const CEAP_TETO_UF: Record<string, number> = {
  AC: 57359.87,
  AL: 46968.18,
  AM: 56151.46,
  AP: 53972.72,
  BA: 51543.56,
  CE: 51052.44,
  DF: 41612.55,
  ES: 49474.84,
  GO: 48186.75,
  MA: 51543.56,
  MG: 50148.34,
  MS: 48186.75,
  MT: 50328.66,
  PA: 53359.38,
  PB: 50034.78,
  PE: 50347.21,
  PI: 50358.53,
  PR: 48186.75,
  RJ: 50034.78,
  RN: 51287.06,
  RO: 51850.45,
  RR: 53247.70,
  RS: 48186.75,
  SC: 48186.75,
  SE: 50503.14,
  SP: 48727.46,
  TO: 51406.33,
}

export function formatDate(value: string | null) {
  if (!value) return NA

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return NA

  return format(parsed, 'dd/MM/yyyy', { locale: ptBR })
}

export function formatCurrency(value: number | null) {
  if (value == null) return NA

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

export function formatOptionalNumber(value: number | null, suffix = '') {
  if (value == null) return NA
  return `${Math.round(value)}${suffix}`
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

export function normalizePlatform(value: string | null) {
  return (value ?? '').toLowerCase().trim()
}

export function socialButtonClass(platform: string) {
  if (platform.includes('twitter') || platform === 'x') {
    return 'border-black/15 bg-black text-white hover:bg-black/90'
  }

  if (platform.includes('instagram')) {
    return 'border-purple-200 bg-purple-600 text-white hover:bg-purple-700'
  }

  if (platform.includes('youtube')) {
    return 'border-red-200 bg-red-600 text-white hover:bg-red-700'
  }

  if (platform.includes('facebook')) {
    return 'border-blue-200 bg-blue-600 text-white hover:bg-blue-700'
  }

  return 'border-slate-300 bg-slate-700 text-white hover:bg-slate-800'
}

export function formatGabinetePhone(value: string | null) {
  if (!value) return NA

  const normalized = value.trim()
  if (!normalized) return NA
  if (normalized.startsWith('(61)')) return normalized
  if (normalized.startsWith('3215-')) return `(61) ${normalized}`

  const digits = normalized.replace(/\D/g, '')
  if (digits.length === 8) {
    return `(61) ${digits.slice(0, 4)}-${digits.slice(4)}`
  }

  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  return normalized
}

export function yearsInOffice(mandatoInicio: string | null) {
  if (!mandatoInicio) return { label: NA, year: NA }

  const startDate = new Date(mandatoInicio)
  if (Number.isNaN(startDate.getTime())) return { label: NA, year: NA }

  const now = new Date()
  const years = Math.max(0, now.getFullYear() - startDate.getFullYear())
  const suffix = years === 1 ? 'ano' : 'anos'

  return {
    label: `${years} ${suffix}`,
    year: String(startDate.getFullYear()),
  }
}

export function profileFieldCount(politico: PoliticoDashboardV2Data) {
  const values = [
    politico.data_nascimento,
    politico.naturalidade,
    politico.uf_nascimento,
    politico.escolaridade,
    politico.ocupacao,
    politico.sexo,
    politico.mandato_inicio,
    politico.mandato_fim,
  ]

  return values.filter(Boolean).length
}
