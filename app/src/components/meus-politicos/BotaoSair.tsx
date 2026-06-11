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
      className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-[var(--surface)] px-4 text-xs font-semibold text-[var(--ink)] shadow-sm transition hover:bg-[var(--panel)] hover:border-[var(--line-strong)] disabled:pointer-events-none disabled:opacity-60"
    >
      <LogOut className="size-3.5" aria-hidden="true" />
      {loading ? 'Saindo...' : 'Sair'}
    </button>
  )
}
