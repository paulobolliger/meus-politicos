import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPgPool } from '@/lib/db/pool'
import Link from 'next/link'
import { FeedbackVerbete } from '@/components/glossario/FeedbackVerbete'
import { IAPerguntaGlossario } from '@/components/glossario/IAPerguntaGlossario'

type Props = { params: Promise<{ slug: string }> }

type Verbete = {
  slug: string
  termo: string
  definicao_simples: string
  definicao_tecnica: string | null
  categoria: string
  exemplo: string | null
  termos_relacionados: string[] | null
}

type TermoRelacionado = { slug: string; termo: string }

const CATS: Record<string, { label: string; color: string; bg: string }> = {
  legislativo:   { label: 'Legislativo',   color: '#818cf8', bg: 'rgba(99, 102, 241, 0.15)' }, // indigo
  eleitoral:     { label: 'Eleitoral',     color: '#34d399', bg: 'rgba(16, 185, 129, 0.15)' }, // emerald
  financeiro:    { label: 'Financeiro',    color: '#fbbf24', bg: 'rgba(245, 158, 11, 0.15)' }, // amber
  institucional: { label: 'Institucional', color: '#f43f5e', bg: 'rgba(244, 63, 94, 0.15)' }, // rose
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const pool = getPgPool()
  const { rows } = await pool.query<{ termo: string; definicao_simples: string }>(
    `SELECT termo, definicao_simples FROM glossario WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  if (!rows[0]) return { title: 'Termo não encontrado | Glossário' }
  return {
    title: `${rows[0].termo} | Glossário Político — Meus Políticos`,
    description: rows[0].definicao_simples?.slice(0, 160),
  }
}

export default async function VerbetePage({ params }: Props) {
  const { slug } = await params
  const pool = getPgPool()

  const { rows } = await pool.query<Verbete>(
    `SELECT slug, termo, definicao_simples, definicao_tecnica,
            categoria, exemplo, termos_relacionados
     FROM glossario WHERE slug = $1 LIMIT 1`,
    [slug]
  )
  if (!rows[0]) notFound()
  const verbete = rows[0]

  let relacionados: TermoRelacionado[] = []
  if (verbete.termos_relacionados?.length) {
    const { rows: rel } = await pool.query<TermoRelacionado>(
      `SELECT slug, termo FROM glossario WHERE slug = ANY($1::text[]) ORDER BY termo ASC`,
      [verbete.termos_relacionados]
    )
    relacionados = rel
  }

  const cat = CATS[verbete.categoria]

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DefinedTerm',
    'name': verbete.termo,
    'description': verbete.definicao_simples,
    'inDefinedTermSet': {
      '@type': 'DefinedTermSet',
      'name': 'Glossário Político Meus Políticos',
      'url': 'https://meuspoliticos.com.br/glossario'
    }
  }

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-7xl mx-auto px-6 py-10 md:px-8">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 mb-8 text-xs text-slate-400 font-mono">
          <Link href="/" className="hover:text-indigo-400 transition-colors">
            Início
          </Link>
          <span className="text-slate-600">/</span>
          <Link href="/glossario" className="hover:text-indigo-400 transition-colors">
            Glossário
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-200 font-semibold">{verbete.termo}</span>
        </nav>

        {/* Grid Principal */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 items-start">

          {/* Coluna Esquerda (Conteúdo) */}
          <div className="lg:col-span-2 space-y-8">

            {/* Cabeçalho do Verbete */}
            <header className="border-b border-slate-800/80 pb-6">
              <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-2">
                Verbete do Glossário
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mb-4">
                {verbete.termo}
              </h1>
              {cat && (
                <span
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase font-mono border border-transparent"
                  style={{ color: cat.color, background: cat.bg, borderColor: `${cat.color}20` }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: cat.color }} />
                  {cat.label}
                </span>
              )}
            </header>

            {/* Destaque: O que é em poucas palavras */}
            <section className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 md:p-8 shadow-md">
              <div className="flex gap-4 items-start">
                <span className="text-2xl mt-0.5 bg-indigo-500/10 border border-indigo-500/20 w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-indigo-400">
                  💡
                </span>
                <div>
                  <h2 className="text-slate-200 font-bold text-base mb-2">
                    O que é, em poucas palavras
                  </h2>
                  <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                    {verbete.definicao_simples}
                  </p>
                </div>
              </div>
            </section>

            {/* Como funciona na prática */}
            {verbete.exemplo && (
              <section className="space-y-3">
                <h3 className="text-slate-200 font-bold text-lg flex items-center gap-2">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-sm">
                    ⚡
                  </span>
                  Como funciona na prática
                </h3>
                <div className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-5 md:p-6">
                  <p className="text-slate-400 text-xs md:text-sm leading-relaxed italic">
                    "{verbete.exemplo}"
                  </p>
                </div>
              </section>
            )}

            {/* Por que isso importa */}
            {verbete.definicao_tecnica && (
              <section className="bg-indigo-950/20 border border-indigo-500/15 rounded-2xl p-6 md:p-8 relative overflow-hidden">
                <h3 className="text-slate-200 font-bold text-lg flex items-center gap-2 mb-4">
                  <span className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-sm">
                    ⚖️
                  </span>
                  Por que isso importa?
                </h3>
                <p className="text-slate-300 text-xs md:text-sm leading-relaxed relative z-10">
                  {verbete.definicao_tecnica}
                </p>
                <div className="absolute -right-10 -bottom-10 w-36 h-36 rounded-full bg-indigo-500/5 pointer-events-none" />
              </section>
            )}

          </div>

          {/* Coluna Direita (Sidebar) */}
          <aside className="space-y-6 lg:sticky lg:top-8">

            {/* Inteligência Cívica Chat Box */}
            <IAPerguntaGlossario termoSlug={verbete.slug} termoNome={verbete.termo} />

            {/* Termos Relacionados */}
            {relacionados.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
                <div className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-3.5">
                  Termos Relacionados
                </div>
                <ul className="space-y-2">
                  {relacionados.map((r) => (
                    <li key={r.slug}>
                      <Link
                        href={`/glossario/${r.slug}`}
                        className="flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-900 border border-slate-800/40 hover:border-indigo-500/30 rounded-xl transition-all duration-200 group text-slate-300 hover:text-indigo-400"
                      >
                        <span className="text-xs font-semibold">{r.termo}</span>
                        <span className="text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all text-xs font-bold font-mono">
                          →
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Contexto Legal */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
              <div className="text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase mb-4">
                Contexto Legal
              </div>
              <div className="space-y-4">
                <div className="flex gap-3 items-start text-slate-300">
                  <span className="text-base mt-0.5 flex-shrink-0">⚖️</span>
                  <div className="text-xs leading-normal">
                    <div className="font-bold text-slate-200 mb-0.5">Constituição Federal</div>
                    <div className="text-slate-400 mb-2">Base constitucional para a estrutura administrativa e direito público.</div>
                    <a
                      href="https://www.planalto.gov.br/ccivil_03/constituicao/constituicao.htm"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:underline"
                    >
                      Ver no Planalto
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                </div>
                
                <hr className="border-slate-800" />

                <div className="flex gap-3 items-start text-slate-300">
                  <span className="text-base mt-0.5 flex-shrink-0">🏛️</span>
                  <div className="text-xs leading-normal">
                    <div className="font-bold text-slate-200 mb-0.5">Portal do TSE / Congresso</div>
                    <div className="text-slate-400 mb-2">Glossários legislativos e resoluções do Tribunal Superior Eleitoral.</div>
                    <a
                      href="https://www.tse.jus.br"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 font-semibold text-indigo-400 hover:underline"
                    >
                      Acessar Portais
                      <span className="text-[10px]">↗</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Feedback React Component */}
            <FeedbackVerbete />

            {/* Botão Voltar */}
            <div className="pt-2">
              <Link
                href="/glossario"
                className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:underline transition-colors"
              >
                <span>←</span> Voltar para todos os termos
              </Link>
            </div>

          </aside>

        </div>
      </div>
    </div>
  )
}
