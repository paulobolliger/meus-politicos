import type { Metadata } from 'next'
import Link from 'next/link'
import { getPgPool } from '@/lib/db/pool'
import { GlossarioFiltros } from '@/components/glossario/GlossarioFiltros'
import { GlossarioViewSelector } from '@/components/glossario/GlossarioViewSelector'

export const metadata: Metadata = {
  title: 'Glossário Político | Meus Políticos',
  description: 'Entenda os termos fundamentais da democracia brasileira em linguagem simples: PL, PEC, CEAP, quórum e muito mais.',
}

const CATS: Record<string, { label: string; color: string }> = {
  legislativo:   { label: 'Legislativo',   color: '#6366f1' }, // indigo
  eleitoral:     { label: 'Eleitoral',     color: '#10b981' }, // emerald
  financeiro:    { label: 'Financeiro',    color: '#f59e0b' }, // amber
  institucional: { label: 'Institucional', color: '#f43f5e' }, // rose
}

type TermoRow = {
  slug: string
  termo: string
  definicao_simples: string
  categoria: string
}

export default async function GlossarioPage({
  searchParams,
}: {
  searchParams: Promise<{ categoria?: string; q?: string; letra?: string }>
}) {
  const params      = await searchParams
  const categoria   = params.categoria?.toLowerCase() || ''
  const q           = params.q?.trim() || ''
  const letraFiltro = params.letra?.toUpperCase() || ''

  const pool = getPgPool()

  const conditions: string[] = []
  const values: unknown[]    = []
  let idx = 1

  if (categoria) {
    conditions.push(`categoria = $${idx++}`)
    values.push(categoria)
  }
  if (q) {
    conditions.push(`(termo ILIKE $${idx} OR definicao_simples ILIKE $${idx})`)
    values.push(`%${q}%`)
    idx++
  }
  if (letraFiltro) {
    conditions.push(`UPPER(LEFT(termo, 1)) = $${idx++}`)
    values.push(letraFiltro)
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  const { rows } = await pool.query<TermoRow>(
    `SELECT slug, termo, definicao_simples, categoria
     FROM glossario ${where}
     ORDER BY termo ASC`,
    values
  )

  // Todas as letras com termos cadastrados para habilitar/desabilitar botões
  const { rows: letrasRows } = await pool.query<{ letra: string }>(
    `SELECT DISTINCT UPPER(LEFT(termo, 1)) AS letra FROM glossario ORDER BY 1`
  )
  const letrasDisponiveis = letrasRows.map(r => r.letra)

  // Agrupar termos por letra inicial para organizar a exibição
  const porLetra: Record<string, TermoRow[]> = {}
  for (const t of rows) {
    const inicial = (t.termo[0] || '#').toUpperCase()
    if (!porLetra[inicial]) porLetra[inicial] = []
    porLetra[inicial].push(t)
  }
  const letras = Object.keys(porLetra).sort()

  const totalTermos = rows.length

  return (
    <div className="bg-[#0F172A] text-slate-100 min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-12 md:py-16 md:px-8">
        
        {/* Hero Section */}
        <section className="mb-10">
          <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-widest block mb-2">
            Educação Cívica
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-4">
            Glossário Político
          </h1>
          <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-2xl">
            Entenda os termos fundamentais da democracia brasileira. 
            Descomplicamos a linguagem técnica para fortalecer a transparência e a cidadania.
            {totalTermos > 0 && (
              <span className="block mt-2 text-slate-300">
                Mostrando <strong className="text-indigo-400 font-bold">{totalTermos} termos</strong> filtrados.
              </span>
            )}
          </p>
        </section>

        {/* Componente Reativo de Busca e Filtros */}
        <GlossarioFiltros
          defaultQ={q}
          defaultCategoria={categoria}
          defaultLetra={letraFiltro}
          letrasDisponiveis={letrasDisponiveis}
        />

        {/* Grid de Conteúdo */}
        {letras.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <div className="text-5xl mb-4">📖</div>
            <p className="text-base font-semibold text-slate-300 mb-2">
              {q ? `Nenhum termo encontrado para "${q}"` : 'Nenhum termo cadastrado.'}
            </p>
            <Link
              href="/glossario"
              className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors font-semibold inline-flex items-center gap-1.5"
            >
              Ver todos os termos do glossário <span>→</span>
            </Link>
          </div>
        ) : (
          <div className="mt-8">
            <GlossarioViewSelector porLetra={porLetra} letras={letras} />
          </div>
        )}
      </div>
    </div>
  )
}
