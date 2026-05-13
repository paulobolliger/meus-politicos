"use client"

import { Search } from "lucide-react"
import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export function SearchBar() {
  const router = useRouter()
  const [term, setTerm] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const query = term.trim()
    if (!query) {
      return
    }

    router.push(`/busca?q=${encodeURIComponent(query)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
    >
      <label className="sr-only" htmlFor="hero-search-name">
        Buscar político por nome
      </label>
      <div className="relative w-full">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500"
          size={18}
        />
        <input
          id="hero-search-name"
          name="q"
          type="text"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Buscar político por nome..."
          className="h-12 w-full rounded-lg border border-white/30 bg-white pl-11 pr-4 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-[#2952cc] focus:outline-none focus:ring-2 focus:ring-[#2952cc]/30"
        />
      </div>
      <button
        type="submit"
        className="h-12 rounded-lg bg-[#2952cc] px-7 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Buscar
      </button>
    </form>
  )
}
