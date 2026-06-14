import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getPgPool } from '@/lib/db/pool'
import { getEstado } from '@/lib/estados-config'

export const revalidate = 86400

export function generateStaticParams() {
  return []
}

export async function generateMetadata(
  { params }: { params: Promise<{ ano: string; uf: string }> }
): Promise<Metadata> {
  const { ano, uf } = await params
  const stateCfg = getEstado(uf)

  if (!stateCfg) {
    return { title: 'Estado não encontrado | Meus Políticos' }
  }

  return {
    title: `Candidatos de ${stateCfg.nome} ${ano} | Meus Políticos`,
    description: `Acompanhe todos os candidatos registrados no TSE para disputas no estado de ${stateCfg.nome} nas Eleições ${ano}.`,
  }
}

type CandidatoRow = {
  id: string
  nome: string
  nome_urna: string | null
  slug: string | null
  cargo: string
  uf: string
  situacao: string | null
  foto_url: string | null
  partido_sigla: string | null
  partido_nome: string | null
  politico_slug: string | null
}

type BadgeStyle = { bg: string; color: string; border: string; label: string }
function getSituacaoBadge(situacao: string | null): BadgeStyle {
  const s = (situacao ?? '').toLowerCase()
  if (s.includes('deferido') && !s.includes('in')) {
    return { bg: 'rgba(16,185,129,0.15)', color: '#10B981', border: 'rgba(16,185,129,0.3)', label: '✓ Deferida' }
  }
  if (s.includes('indeferido') || s.includes('cassado') || s.includes('cancelado')) {
    return { bg: 'rgba(239,68,68,0.15)', color: '#EF4444', border: 'rgba(239,68,68,0.3)', label: '✗ Indeferida' }
  }
  if (s.includes('julgamento') || s.includes('pendente') || s.includes('aguardando')) {
    return { bg: 'rgba(245,158,11,0.15)', color: '#F59E0B', border: 'rgba(245,158,11,0.3)', label: 'Em Julgamento' }
  }
  return { bg: 'rgba(148,163,184,0.1)', color: '#94A3B8', border: 'rgba(148,163,184,0.2)', label: situacao ?? 'Pendente' }
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()
}

const AVATAR_PALETTE = ['#4f46e5', '#7c3aed', '#2563eb', '#db2777', '#059669', '#d97706', '#dc2626', '#0891b2']
function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

const CARGO_ORDEM = [
  'governador',
  'vice_governador',
  'senador',
  'deputado_federal',
  'deputado_estadual',
]

const CARGO_TITULO: Record<string, string> = {
  governador: 'Governador',
  vice_governador: 'Vice-Governador',
  senador: 'Senador',
  deputado_federal: 'Deputado Federal',
  deputado_estadual: 'Deputado Estadual',
}

export default async function EstadoCandidatosPage({
  params,
  searchParams,
}: {
  params: Promise<{ ano: string; uf: string }>
  searchParams: Promise<{ cargo?: string }>
}) {
  const { ano, uf } = await params
  const anoNum = parseInt(ano, 10)
  if (isNaN(anoNum)) notFound()

  const stateCfg = getEstado(uf)
  if (!stateCfg) {
    notFound()
  }

  const sParams = await searchParams
  const cargoFiltrado = sParams.cargo?.toLowerCase() || null

  const pool = getPgPool()
  let candidatos: CandidatoRow[] = []

  try {
    const res = await pool.query<CandidatoRow>(
      `SELECT
         c.id, c.nome, c.nome_urna, c.slug, c.cargo, c.uf,
         c.situacao, pol.foto_url,
         pt.sigla  AS partido_sigla,
         pt.nome   AS partido_nome,
         p.slug    AS politico_slug
       FROM candidatos c
       LEFT JOIN partidos  pt  ON pt.id  = c.partido_id
       LEFT JOIN politicos p   ON p.id   = c.politico_id
       LEFT JOIN politicos pol ON pol.id = c.politico_id
       WHERE c.eleicao_ano = $1 AND c.uf = $2
       ORDER BY c.cargo, c.nome_urna, c.nome`,
      [anoNum, stateCfg.sigla]
    )
    candidatos = res.rows
  } catch (err) {
    console.error(`Erro ao buscar candidatos para UF ${stateCfg.sigla}:`, err)
  }

  // Agrupar candidatos por cargo
  const agrupado: Record<string, CandidatoRow[]> = {}
  CARGO_ORDEM.forEach((cargo) => {
    agrupado[cargo] = candidatos.filter((c) => c.cargo === cargo)
  })

  // Se houver algum cargo não mapeado
  candidatos.forEach((c) => {
    if (!CARGO_ORDEM.includes(c.cargo)) {
      if (!agrupado[c.cargo]) agrupado[c.cargo] = []
      agrupado[c.cargo].push(c)
    }
  })

  // Contagens
  const countPorCargo = Object.entries(agrupado).reduce((acc, [k, v]) => {
    acc[k] = v.length
    return acc
  }, {} as Record<string, number>)

  const cargosComCandidatos = Object.keys(agrupado).filter((k) => agrupado[k].length > 0)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Section with State Color Gradient */}
      <section
        className="relative overflow-hidden px-6 py-16 border-b border-slate-900"
        style={{
          background: `linear-gradient(155deg, ${stateCfg.cor}dd 0%, ${stateCfg.cor}33 50%, #020617 100%)`,
        }}
      >
        <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] pointer-events-none" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Link
            href={`/eleicao/${ano}/estados`}
            className="inline-flex items-center text-xs font-bold text-white/95 hover:text-white transition mb-4 uppercase tracking-wider bg-black/20 px-3 py-1 rounded-full border border-white/10"
          >
            ← Escolher outro Estado
          </Link>
          <div className="flex justify-between items-start flex-wrap gap-4 mt-2">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-slate-800 text-indigo-300 mb-4 text-xs font-bold uppercase tracking-wider">
                <span>🗳️</span> Candidatos {ano}
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white font-display">
                Disputas Eleitorais: {stateCfg.nome}
              </h1>
              <p className="text-white/80 max-w-xl text-sm md:text-base leading-relaxed mt-2">
                Veja a listagem de todos os concorrentes a cargos executivos e legislativos que disputam vagas pelo estado de {stateCfg.nome} nas Eleições {ano}.
              </p>
            </div>
            {/* Quick State Info Panel */}
            <div className="bg-slate-950/70 border border-slate-800/80 p-4 rounded-xl text-xs flex gap-6 text-slate-300 backdrop-blur-md">
              <div>
                <span className="text-slate-500 block uppercase font-mono tracking-wider mb-1">Assembleia Legislativa</span>
                <strong>{stateCfg.depu_estaduais} cadeiras</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-mono tracking-wider mb-1">Bancada Federal</span>
                <strong>{stateCfg.depu_federais} deputados</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-mono tracking-wider mb-1">Capital</span>
                <strong>{stateCfg.capital}</strong>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Navigation Tabs */}
        {cargosComCandidatos.length > 1 && (
          <div className="flex gap-2 flex-wrap pb-4 border-b border-slate-800 mb-8 items-center">
            <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-2">Filtrar por:</span>
            <Link
              href={`/eleicao/${ano}/estados/${stateCfg.sigla.toLowerCase()}`}
              className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                !cargoFiltrado
                  ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              Mostrar Todos ({candidatos.length})
            </Link>
            {cargosComCandidatos.map((k) => (
              <Link
                key={k}
                href={`?cargo=${k}`}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                  cargoFiltrado === k
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                {CARGO_TITULO[k] ?? k} ({countPorCargo[k]})
              </Link>
            ))}
          </div>
        )}

        {candidatos.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/30 border border-slate-900 rounded-2xl">
            <span className="text-5xl block mb-4">🗺️</span>
            <h3 className="text-lg font-bold text-slate-350">Nenhum candidato cadastrado ainda</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              Nenhum candidato para o estado de {stateCfg.nome} foi encontrado na base de dados.
            </p>
          </div>
        ) : (
          <div className="space-y-12">
            {Object.entries(agrupado)
              .filter(([cargo, list]) => list.length > 0 && (!cargoFiltrado || cargoFiltrado === cargo))
              .map(([cargo, list]) => {
                const titulo = CARGO_TITULO[cargo] ?? cargo

                return (
                  <div key={cargo} className="space-y-6">
                    <h2 className="text-lg md:text-xl font-bold tracking-tight text-slate-200 border-l-2 pl-3 border-indigo-500 flex items-center gap-2">
                      {titulo}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                        {list.length}
                      </span>
                    </h2>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                      {list.map((c) => {
                        const nome = c.nome_urna || c.nome
                        const badge = getSituacaoBadge(c.situacao)
                        const bg = avatarBg(nome)
                        const href = c.slug ? `/eleicao/${ano}/candidatos/${c.slug}` : null

                        const cardContent = (
                          <div className="bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-xl overflow-hidden shadow-lg transition duration-200 flex flex-col h-full group">
                            {/* Photo container */}
                            <div className="h-44 relative overflow-hidden bg-slate-800 flex-shrink-0">
                              {c.foto_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={c.foto_url}
                                  alt={nome}
                                  className="w-full h-full object-cover object-top transition duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center font-bold text-3xl text-white/90 font-display"
                                  style={{ backgroundColor: bg }}
                                >
                                  {initials(nome)}
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent pointer-events-none" />

                              {/* Situação badge */}
                              <div
                                className="absolute top-3 right-3 text-[10px] font-bold px-2 py-0.5 rounded-full border backdrop-blur-sm"
                                style={{ backgroundColor: badge.bg, color: badge.color, borderColor: badge.border }}
                              >
                                {badge.label}
                              </div>

                              {/* Partido */}
                              {c.partido_sigla && (
                                <div className="absolute bottom-3 left-3 bg-slate-950/80 border border-slate-800 text-[10px] font-bold px-2 py-0.5 rounded text-indigo-300">
                                  {c.partido_sigla}
                                </div>
                              )}
                            </div>

                            {/* Body */}
                            <div className="p-4 flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition text-sm leading-snug line-clamp-1">
                                  {nome}
                                </h3>
                                {c.nome_urna && c.nome_urna !== c.nome && (
                                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                                    Nome civil: {c.nome}
                                  </p>
                                )}
                              </div>

                              <div className="mt-4 pt-3 border-t border-slate-800/60">
                                {href ? (
                                  <span className="inline-flex w-full items-center justify-center h-8 bg-indigo-600 hover:bg-indigo-700 text-xs font-semibold rounded-lg text-white transition">
                                    Ver Perfil Completo
                                  </span>
                                ) : (
                                  <span className="inline-flex w-full items-center justify-center h-8 bg-slate-800 text-slate-500 text-xs font-medium rounded-lg cursor-not-allowed">
                                    Perfil Indisponível
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        )

                        return href ? (
                          <Link key={c.id} href={href} className="no-underline h-full block">
                            {cardContent}
                          </Link>
                        ) : (
                          <div key={c.id} className="h-full block">
                            {cardContent}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
          </div>
        )}
      </div>
    </div>
  )
}
