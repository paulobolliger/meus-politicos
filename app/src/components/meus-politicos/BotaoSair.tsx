'use client'

import { LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { createClient } from '@/lib/supabase/client'

export function BotaoSair() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function sair() {
    setLoading(true)

    const supabase = createClient()
    await supabase.auth.signOut()

    router.push('/')
    router.refresh()
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

