'use client'

import { LogOut } from 'lucide-react'
import { useState } from 'react'

export function BotaoSair() {
  const [loading, setLoading] = useState(false)

  function sair() {
    setLoading(true)
    window.location.href = '/api/auth/logto/sign-out'
  }

  return (
    <button
      type="button"
      onClick={sair}
      disabled={loading}
      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950 disabled:pointer-events-none disabled:opacity-60"
    >
      <LogOut className="size-4" aria-hidden="true" />
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  )
}
