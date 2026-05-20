export type Regiao = 'Norte' | 'Nordeste' | 'Centro-Oeste' | 'Sudeste' | 'Sul'

export type EstadoConfig = {
  sigla: string
  nome: string
  capital: string
  regiao: Regiao
  /** Cor principal da identidade visual do estado (CSS hex) */
  cor: string
  /** Cor secundária */
  corSub: string
  area_km2: number
  gentilico: string
  fuso: string
  /** Total de deputados estaduais (Assembleia Legislativa) */
  depu_estaduais: number
  /** Total de deputados federais (proporcional ao IBGE) */
  depu_federais: number
  /** Total de senadores (sempre 3, exceto DF que não tem) */
  senadores: number
  /** Total de municípios */
  municipios: number
}

const CORES_REGIAO: Record<Regiao, { cor: string; corSub: string }> = {
  Norte:         { cor: '#0d9488', corSub: '#5eead4' },
  Nordeste:      { cor: '#d97706', corSub: '#fcd34d' },
  'Centro-Oeste':{ cor: '#7c3aed', corSub: '#c4b5fd' },
  Sudeste:       { cor: '#1d4ed8', corSub: '#93c5fd' },
  Sul:           { cor: '#059669', corSub: '#6ee7b7' },
}

function e(
  sigla: string, nome: string, capital: string, regiao: Regiao,
  area_km2: number, gentilico: string, fuso: string,
  depu_estaduais: number, depu_federais: number, senadores: number, municipios: number,
  corOverride?: string, corSubOverride?: string,
): EstadoConfig {
  const { cor, corSub } = CORES_REGIAO[regiao]
  return {
    sigla, nome, capital, regiao, area_km2, gentilico, fuso,
    depu_estaduais, depu_federais, senadores, municipios,
    cor: corOverride ?? cor,
    corSub: corSubOverride ?? corSub,
  }
}

export const ESTADOS: Record<string, EstadoConfig> = {
  AC: e('AC','Acre','Rio Branco','Norte',164123,'Acriano','UTC-5',24,8,3,22),
  AL: e('AL','Alagoas','Maceió','Nordeste',27779,'Alagoano','UTC-3',27,9,3,102),
  AM: e('AM','Amazonas','Manaus','Norte',1559159,'Amazonense','UTC-4',62,8,3,62),
  AP: e('AP','Amapá','Macapá','Norte',142829,'Amapaense','UTC-3',24,8,3,16),
  BA: e('BA','Bahia','Salvador','Nordeste',564733,'Baiano','UTC-3',63,39,3,417),
  CE: e('CE','Ceará','Fortaleza','Nordeste',148921,'Cearense','UTC-3',46,22,3,184),
  DF: e('DF','Distrito Federal','Brasília','Centro-Oeste',5780,'Candango','UTC-3',24,8,0,1,'#dc2626','#fca5a5'),
  ES: e('ES','Espírito Santo','Vitória','Sudeste',46074,'Capixaba','UTC-3',30,10,3,78),
  GO: e('GO','Goiás','Goiânia','Centro-Oeste',340111,'Goiano','UTC-3',41,17,3,246),
  MA: e('MA','Maranhão','São Luís','Nordeste',331983,'Maranhense','UTC-3',42,18,3,217),
  MG: e('MG','Minas Gerais','Belo Horizonte','Sudeste',586522,'Mineiro','UTC-3',77,53,3,853,'#7c3aed','#c4b5fd'),
  MS: e('MS','Mato Grosso do Sul','Campo Grande','Centro-Oeste',357145,'Sul-mato-grossense','UTC-4',24,8,3,79),
  MT: e('MT','Mato Grosso','Cuiabá','Centro-Oeste',903208,'Mato-grossense','UTC-4',24,8,3,141),
  PA: e('PA','Pará','Belém','Norte',1247950,'Paraense','UTC-3',41,17,3,144),
  PB: e('PB','Paraíba','João Pessoa','Nordeste',56439,'Paraibano','UTC-3',36,12,3,223),
  PE: e('PE','Pernambuco','Recife','Nordeste',98076,'Pernambucano','UTC-3',49,25,3,185),
  PI: e('PI','Piauí','Teresina','Nordeste',251756,'Piauiense','UTC-3',30,10,3,224),
  PR: e('PR','Paraná','Curitiba','Sul',199307,'Paranaense','UTC-3',54,30,3,399),
  RJ: e('RJ','Rio de Janeiro','Rio de Janeiro','Sudeste',43780,'Fluminense','UTC-3',70,46,3,92,'#dc2626','#fca5a5'),
  RN: e('RN','Rio Grande do Norte','Natal','Nordeste',52811,'Potiguar','UTC-3',24,8,3,167),
  RO: e('RO','Rondônia','Porto Velho','Norte',237765,'Rondoniense','UTC-4',24,8,3,52),
  RR: e('RR','Roraima','Boa Vista','Norte',224299,'Roraimense','UTC-4',24,8,3,15),
  RS: e('RS','Rio Grande do Sul','Porto Alegre','Sul',281748,'Gaúcho','UTC-3',55,31,3,497,'#dc6b19','#fdba74'),
  SC: e('SC','Santa Catarina','Florianópolis','Sul',95736,'Catarinense','UTC-3',40,16,3,295),
  SE: e('SE','Sergipe','Aracaju','Nordeste',21915,'Sergipano','UTC-3',24,8,3,75),
  SP: e('SP','São Paulo','São Paulo','Sudeste',248219,'Paulista','UTC-3',94,70,3,645,'#1d4ed8','#93c5fd'),
  TO: e('TO','Tocantins','Palmas','Norte',277621,'Tocantinense','UTC-3',24,8,3,139),
}

export function getEstado(sigla: string): EstadoConfig | null {
  return ESTADOS[sigla.toUpperCase()] ?? null
}

export const SIGLAS_ORDENADAS = Object.keys(ESTADOS).sort()

export function regiaoLabel(regiao: Regiao): string {
  return regiao
}

/** Gradiente CSS para o hero de cada estado */
export function estadoGradient(sigla: string): string {
  const cfg = getEstado(sigla)
  if (!cfg) return 'linear-gradient(135deg, #1e3a5f 0%, #0f172a 100%)'
  return `linear-gradient(135deg, ${cfg.cor}dd 0%, ${cfg.cor}44 60%, #0f172a 100%)`
}
