import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPgPool } from '@/lib/db/pool'

export const revalidate = 86400

export function generateStaticParams() {
  return []
}

export async function generateMetadata(
  { params }: { params: Promise<{ ano: string }> }
): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Candidatos Legislativo Federal ${ano} | Meus Políticos`,
    description: `Lista de candidatos a Deputado Federal e Senador nas Eleições de ${ano}.`,
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

const CARGO_LABEL: Record<string, string> = {
  senador: 'Senador',
  deputado_federal: 'Dep. Federal',
}

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG',
  'MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR',
  'RS','SC','SE','SP','TO',
]

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

export default async function FederalLegislativoPage({
  params,
  searchParams,
}: {
  params: Promise<{ ano: string }>
  searchParams: Promise<{ cargo?: string; uf?: string; pagina?: string }>
}) {
  const { ano } = await params
  const anoNum = parseInt(ano, 10)
  if (isNaN(anoNum)) notFound()

  const sParams = await searchParams
  const cargoSelected = sParams.cargo?.toLowerCase() || null
  const ufSelected = sParams.uf?.toUpperCase() || null
  const pagina = Math.max(1, parseInt(sParams.pagina || '1', 10))
  const porPagina = 24
  const offset = (pagina - 1) * porPagina

  const pool = getPgPool()
  let candidatos: CandidatoRow[] = []
  let total = 0

  const conditions: string[] = ["c.eleicao_ano = $1 AND c.cargo IN ('senador', 'deputado_federal')"]
  const values: (string | number)[] = [anoNum]
  let idx = 2

  if (cargoSelected === 'senador' || cargoSelected === 'deputado_federal') {
    conditions.push(`c.cargo = $${idx++}`)
    values.push(cargoSelected)
  }
  if (ufSelected && UFS.includes(ufSelected)) {
    conditions.push(`c.uf = $${idx++}`)
    values.push(ufSelected)
  }

  const where = `WHERE ${conditions.join(' AND ')}`

  try {
    const [rowsRes, countRes] = await Promise.all([
      pool.query<CandidatoRow>(
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
         ${where}
         ORDER BY c.nome_urna, c.nome
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...values, porPagina, offset]
      ),
      pool.query<{ total: string }>(
        `SELECT COUNT(*) AS total FROM candidatos c ${where}`,
        values
      ),
    ])
    candidatos = rowsRes.rows
    total = parseInt(countRes.rows[0]?.total ?? '0', 10)
  } catch (err) {
    console.error('Erro ao buscar candidatos legislativo federal:', err)
  }

  const totalPaginas = Math.ceil(total / porPagina)
  const inicio = total > 0 ? offset + 1 : 0
  const fim = Math.min(offset + porPagina, total)

  const buildUrl = (extra: Record<string, string | null>) => {
    const p: Record<string, string> = {}
    if (cargoSelected) p.cargo = cargoSelected
    if (ufSelected) p.uf = ufSelected
    Object.entries(extra).forEach(([k, v]) => { if (v != null) p[k] = v; else delete p[k] })
    const str = new URLSearchParams(p).toString()
    return `/eleicao/${ano}/federal-legislativo` + (str ? '?' + str : '')
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 px-6 py-16 border-b border-slate-900">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.12),transparent_50%)]" />
        <div className="max-w-6xl mx-auto relative z-10">
          <Link
            href={`/eleicao/${ano}`}
            className="inline-flex items-center text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition mb-4 uppercase tracking-wider"
          >
            ← Voltar para Painel da Eleição
          </Link>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 mb-4 text-xs font-bold tracking-widest uppercase">
            <span>🏛️</span> Legislativo Federal
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display mb-3">
            Candidatos ao Legislativo Federal {ano}
          </h1>
          <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
            Explorar candidaturas registradas para o Senado Federal e para a Câmara dos Deputados no Congresso Nacional nas Eleições {ano}.
          </p>
        </div>
      </section>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        {/* Filters Panel */}
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-5 mb-8">
          <div className="flex flex-col gap-4">
            {/* Cargo selector */}
            <div className="flex items-center flex-wrap gap-2">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-2">Cargo:</span>
              <Link
                href={buildUrl({ cargo: null, pagina: null })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                  !cargoSelected
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                Todos (Senadores e Deputados)
              </Link>
              <Link
                href={buildUrl({ cargo: 'senador', pagina: null })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                  cargoSelected === 'senador'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                Senadores
              </Link>
              <Link
                href={buildUrl({ cargo: 'deputado_federal', pagina: null })}
                className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition ${
                  cargoSelected === 'deputado_federal'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                Deputados Federais
              </Link>
            </div>

            {/* State (UF) Selector */}
            <div className="flex items-start flex-wrap gap-1">
              <span className="text-xs font-mono text-slate-500 uppercase tracking-wider mr-2 mt-1 flex-shrink-0">Estado (UF):</span>
              <div className="flex flex-wrap gap-1">
                <Link
                  href={buildUrl({ uf: null, pagina: null })}
                  className={`text-[10px] font-mono px-2 py-1 rounded transition border ${
                    !ufSelected
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-650'
                  }`}
                >
                  BR
                </Link>
                {UFS.map((u) => (
                  <Link
                    key={u}
                    href={buildUrl({ uf: u, pagina: null })}
                    className={`text-[10px] font-mono px-2 py-1 rounded transition border ${
                      ufSelected === u
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-650'
                    }`}
                  >
                    {u}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Results Counter */}
        {total > 0 && (
          <div className="mb-6 text-xs text-slate-400">
            Exibindo <strong className="text-slate-200">{inicio}–{fim}</strong> de{' '}
            <strong className="text-slate-200">{total.toLocaleString('pt-BR')}</strong> candidatos cadastrados.
          </div>
        )}

        {/* Grid and Empty States */}
        {candidatos.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-900 rounded-2xl">
            <span className="text-5xl block mb-4">🏛️</span>
            <h3 className="text-lg font-bold text-slate-350">Nenhum candidato encontrado</h3>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
              Nenhum candidato localizado com os filtros selecionados (Cargo: {cargoSelected ?? 'Todos'}, UF: {ufSelected ?? 'Brasil'}).
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {candidatos.map((c) => {
              const nome = c.nome_urna || c.nome
              const badge = getSituacaoBadge(c.situacao)
              const bg = avatarBg(nome)
              const href = c.slug ? `/eleicao/${ano}/candidatos/${c.slug}` : null
              const cargoLabel = CARGO_LABEL[c.cargo] ?? c.cargo

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
                      <h3 className="font-bold text-slate-100 group-hover:text-indigo-400 transition text-sm md:text-base leading-snug line-clamp-1">
                        {nome}
                      </h3>
                      {c.nome_urna && c.nome_urna !== c.nome && (
                        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">
                          Nome civil: {c.nome}
                        </p>
                      )}
                      <p className="text-[11px] text-slate-400 mt-2 font-mono uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                        {cargoLabel} • {c.uf}
                      </p>
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
        )}

        {/* Pagination */}
        {totalPaginas > 1 && (
          <div className="flex justify-center items-center gap-2 mt-12 flex-wrap">
            {pagina > 1 && (
              <Link
                href={buildUrl({ pagina: String(pagina - 1) })}
                className="inline-flex items-center justify-center px-4 h-9 rounded-lg border border-slate-800 bg-slate-900 text-slate-350 text-xs hover:border-slate-700 transition"
              >
                ← Anterior
              </Link>
            )}

            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .slice(Math.max(0, pagina - 3), Math.min(totalPaginas, Math.max(0, pagina - 3) + 5))
              .map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ pagina: String(p) })}
                  className={`inline-flex items-center justify-center w-9 h-9 rounded-lg border text-xs transition ${
                    p === pagina
                      ? 'bg-white border-white text-slate-950 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-350 hover:border-slate-700'
                  }`}
                >
                  {p}
                </Link>
              ))}

            {pagina < totalPaginas && (
              <Link
                href={buildUrl({ pagina: String(pagina + 1) })}
                className="inline-flex items-center justify-center px-4 h-9 rounded-lg border border-slate-800 bg-slate-900 text-slate-350 text-xs hover:border-slate-700 transition"
              >
                Próxima →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
