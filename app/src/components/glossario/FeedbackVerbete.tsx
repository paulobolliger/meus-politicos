'use client'

import { useState } from 'react'

export function FeedbackVerbete() {
  const [clicked, setClicked] = useState<string | null>(null)

  const handleFeedback = (label: string) => {
    setClicked(label)
    setTimeout(() => {
      setClicked(null)
    }, 2000)
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 text-center shadow-lg">
      <p className="m-0 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        Esta explicação foi clara?
      </p>
      
      {clicked ? (
        <div className="flex flex-col items-center justify-center h-16 animate-fade-in">
          <span className="text-xl mb-1">✨</span>
          <span className="text-sm font-semibold text-indigo-400">Obrigado pelo feedback!</span>
        </div>
      ) : (
        <div className="flex justify-center gap-6">
          <button
            onClick={() => handleFeedback('Sim')}
            className="flex flex-col items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 group focus:outline-none"
            aria-label="Avaliar como útil"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/60 text-lg transition-all duration-200 group-hover:bg-indigo-500/20 group-hover:border-indigo-500/40 group-hover:scale-105 active:scale-95">
              👍
            </span>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-colors duration-200 group-hover:text-indigo-400">
              Sim
            </span>
          </button>
          
          <button
            onClick={() => handleFeedback('Não')}
            className="flex flex-col items-center gap-1.5 bg-transparent border-0 cursor-pointer p-0 group focus:outline-none"
            aria-label="Avaliar como não útil"
          >
            <span className="flex items-center justify-center w-11 h-11 rounded-full bg-slate-800/80 border border-slate-700/60 text-lg transition-all duration-200 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 group-hover:scale-105 active:scale-95">
              👎
            </span>
            <span className="text-[10px] font-bold tracking-wider text-slate-500 uppercase transition-colors duration-200 group-hover:text-rose-400">
              Não
            </span>
          </button>
        </div>
      )}
    </div>
  )
}
