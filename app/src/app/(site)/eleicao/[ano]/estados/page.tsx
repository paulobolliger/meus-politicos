import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ESTADOS, SIGLAS_ORDENADAS } from '@/lib/estados-config'

export const revalidate = 86400

export function generateStaticParams() {
  return [
    { ano: '2026' },
    { ano: '2024' },
    { ano: '2022' },
  ]
}

export async function generateMetadata(
  { params }: { params: Promise<{ ano: string }> }
): Promise<Metadata> {
  const { ano } = await params
  return {
    title: `Candidatos por Estado ${ano} | Meus Políticos`,
    description: `Selecione o estado para ver as candidaturas de Governador, Senador e Deputados para as Eleições de ${ano}.`,
  }
}

export default async function EstadosCandidatosIndexPage({
  params,
}: {
  params: Promise<{ ano: string }>
}) {
  const { ano } = await params
  const anoNum = parseInt(ano, 10)
  if (isNaN(anoNum)) notFound()

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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 mb-4 text-xs font-bold tracking-widest uppercase">
            <span>🗺️</span> Disputas Estaduais
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white font-display mb-3">
            Candidaturas por Estado — {ano}
          </h1>
          <p className="text-slate-400 max-w-xl text-sm md:text-base leading-relaxed">
            Selecione uma unidade federativa para explorar os candidatos a Governador, Senador, Deputado Federal e Deputado Estadual.
          </p>
        </div>
      </section>

      {/* Main Grid */}
      <div className="max-w-6xl mx-auto px-6 mt-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {SIGLAS_ORDENADAS.map((sigla) => {
            const cfg = ESTADOS[sigla]
            if (!cfg) return null

            return (
              <Link
                key={sigla}
                href={`/eleicao/${ano}/estados/${sigla.toLowerCase()}`}
                className="group relative overflow-hidden bg-slate-900/50 hover:bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 rounded-xl p-5 shadow-lg transition duration-200 flex flex-col justify-between h-full"
              >
                {/* State Accent Line on hover */}
                <div
                  className="absolute top-0 inset-x-0 h-1 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300"
                  style={{ backgroundColor: cfg.cor }}
                />

                <div>
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-extrabold text-white text-lg tracking-tight group-hover:text-indigo-400 transition">
                      {cfg.nome}
                    </h3>
                    <span
                      className="font-mono text-xs font-black px-2 py-0.5 rounded border"
                      style={{
                        borderColor: `${cfg.cor}30`,
                        color: cfg.corSub,
                        backgroundColor: `${cfg.cor}10`,
                      }}
                    >
                      {sigla}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mb-4 font-medium">
                    Capital: {cfg.capital} • Região {cfg.regiao}
                  </p>

                  <div className="grid grid-cols-2 gap-y-2 gap-x-1 text-slate-400 text-xs border-t border-slate-800/60 pt-3">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Dep. Estaduais</span>
                      <strong className="text-slate-200">{cfg.depu_estaduais} vagas</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Dep. Federais</span>
                      <strong className="text-slate-200">{cfg.depu_federais} vagas</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Senadores</span>
                      <strong className="text-slate-200">{cfg.senadores} vagas</strong>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-mono tracking-wider">Municípios</span>
                      <strong className="text-slate-200">{cfg.municipios}</strong>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-3 border-t border-slate-800/40 text-right">
                  <span className="inline-flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300 transition gap-1">
                    Ver Candidatos <span className="transform translate-x-0 group-hover:translate-x-1 transition-transform">→</span>
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
