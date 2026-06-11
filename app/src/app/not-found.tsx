'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { FileQuestion, Home, Search } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-linear-to-b from-[#0F172A] to-[#0b0f19] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-violet-600/5 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md bg-[#1E293B]/60 backdrop-blur-md border border-slate-800 rounded-2xl p-8 shadow-2xl text-center relative z-10"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
          className="mx-auto w-16 h-16 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center mb-6 shadow-[0_8px_32px_-16px_rgba(139,92,246,0.5)]"
        >
          <FileQuestion className="w-8 h-8" />
        </motion.div>

        <span className="font-mono text-[10px] text-slate-500 tracking-[0.2em] uppercase font-semibold">
          Erro 404 · Recurso Inexistente
        </span>

        <h1 className="text-4xl font-extrabold text-slate-100 tracking-tight mt-3 mb-4">
          Página não encontrada
        </h1>

        <p className="text-sm text-slate-400 leading-relaxed mb-8">
          O endereço digitado não existe, foi modificado ou a página foi removida permanentemente.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-violet-600/15 active:scale-[0.98]"
          >
            <Home className="w-4 h-4 text-violet-200" />
            <span>Voltar ao início</span>
          </Link>
          <Link
            href="/busca"
            className="flex-1 py-3 px-4 bg-slate-900/60 hover:bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 font-semibold text-sm rounded-xl transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Buscar políticos</span>
          </Link>
        </div>
      </motion.div>

      <div className="mt-8 text-[10px] text-slate-600 font-mono tracking-widest uppercase select-none">
        meuspoliticos.com.br · transparência · cidadania
      </div>
    </div>
  )
}
