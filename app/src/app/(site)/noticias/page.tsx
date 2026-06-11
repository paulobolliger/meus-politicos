import React from 'react'

export const metadata = {
  title: 'Notícias Cívicas - Meus Políticos',
  description: 'Central de notícias e acontecimentos cívicos agregados da política brasileira.',
}

export default function NoticiasPage() {
  return (
    <main className="min-h-screen bg-[#0F172A] text-[#CBD5E1] pt-28 pb-16 px-4 md:px-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-12">
        {/* Header Section */}
        <section className="text-center space-y-4 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-[#4C1D95]/30 text-[#A78BFA] border border-[#4C1D95] px-3.5 py-1.5 rounded-full text-xs font-mono font-bold tracking-wider uppercase">
            <span className="w-2 h-2 rounded-full bg-[#A78BFA] animate-ping" />
            Central de Notícias V2
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight font-sans">
            Acontecimentos políticos em linguagem direta
          </h1>
          <p className="text-sm md:text-base text-[#94A3B8] leading-relaxed">
            Em breve, você poderá acompanhar um agregador de notícias integrado aos perfis de cada político, projeto de lei e emenda parlamentar, cruzando fatos jornalísticos com dados oficiais.
          </p>
        </section>

        {/* Integration Status Notice */}
        <section className="bg-gradient-to-br from-[#1E293B] to-[#2D1B69] border border-[#4C1D95]/40 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 text-white">
            <span className="material-symbols-outlined text-[100px]">rss_feed</span>
          </div>
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2">
              <span className="bg-[#10B981]/15 text-[#34D399] border border-[#10B981]/30 text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded font-mono">
                collecting
              </span>
              <h3 className="text-white font-bold text-lg">Mapeamento de Fontes em Andamento</h3>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed max-w-xl">
              Nossos crawlers estão sendo configurados para indexar e classificar por IA as notícias que citam votações e recursos federais das principais agências de notícias nacionais.
            </p>
          </div>
          <div className="bg-[#0F172A] border border-[#334155] rounded-xl px-5 py-3 text-center md:text-right shrink-0 z-10">
            <span className="block text-[10px] text-[#64748B] font-mono uppercase tracking-wider">Lançamento previsto</span>
            <span className="text-white font-extrabold text-lg">Fase 2 (V2)</span>
          </div>
        </section>

        {/* Skeletons Layout demonstrating News Feed */}
        <section className="space-y-6">
          <h3 className="text-white font-bold text-lg border-b border-[#334155] pb-2 font-sans flex items-center gap-2">
            <span className="material-symbols-outlined text-[#8B5CF6]">feed</span>
            Feed de Notícias (Prévia do Layout)
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="bg-[#1E293B] border border-[#334155] rounded-xl p-4 flex flex-col gap-4 shadow-sm animate-pulse"
              >
                {/* Image Placeholder */}
                <div className="w-full h-40 bg-[#0F172A] rounded-lg border border-[#334155]/60" />

                {/* Metadata */}
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-[#0F172A] rounded w-20" />
                  <div className="h-4 bg-[#0F172A] rounded w-16" />
                </div>

                {/* Title Lines */}
                <div className="space-y-2">
                  <div className="h-4 bg-slate-800 rounded w-full" />
                  <div className="h-4 bg-slate-800 rounded w-5/6" />
                </div>

                {/* Description Lines */}
                <div className="space-y-2">
                  <div className="h-3 bg-slate-800/60 rounded w-full" />
                  <div className="h-3 bg-slate-800/60 rounded w-11/12" />
                  <div className="h-3 bg-slate-800/60 rounded w-4/5" />
                </div>

                {/* Tag Chips */}
                <div className="flex gap-2 pt-2 border-t border-[#334155]/60 mt-auto">
                  <div className="h-5 bg-[#0F172A] rounded-full w-14" />
                  <div className="h-5 bg-[#0F172A] rounded-full w-16" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
