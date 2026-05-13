"use client"

import { useRouter } from "next/navigation"
import { FormEvent, useState } from "react"

export function CepSearch() {
  const router = useRouter()
  const [cep, setCep] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const normalizedCep = cep.trim()
    if (!normalizedCep) {
      return
    }

    router.push(`/meu-estado?cep=${encodeURIComponent(normalizedCep)}`)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full flex-col gap-3 sm:flex-row sm:items-center"
    >
      <label className="sr-only" htmlFor="hero-search-cep">
        Buscar representantes por CEP
      </label>
      <input
        id="hero-search-cep"
        name="cep"
        type="text"
        value={cep}
        onChange={(event) => setCep(event.target.value)}
        placeholder="Digite seu CEP"
        className="h-12 w-full rounded-lg border border-white/30 bg-white px-4 text-[15px] text-slate-900 placeholder:text-slate-500 focus:border-[#2952cc] focus:outline-none focus:ring-2 focus:ring-[#2952cc]/30"
      />
      <button
        type="submit"
        className="h-12 rounded-lg bg-[#2952cc] px-7 text-sm font-semibold text-white transition hover:brightness-110"
      >
        Ver meus representantes
      </button>
    </form>
  )
}
