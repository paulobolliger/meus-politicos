"use client"

import { useRouter } from "next/navigation"

export function RecarregarAgoraButton() {
  const router = useRouter()

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950 focus-visible:ring-3 focus-visible:ring-[#2952cc]/20 focus-visible:outline-none"
    >
      Recarregar agora
    </button>
  )
}