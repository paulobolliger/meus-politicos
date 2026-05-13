'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CepFormProps = {
  defaultCep?: string
}

export function CepForm({ defaultCep = '' }: CepFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [cep, setCep] = useState(defaultCep)

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cepNumerico = cep.replace(/\D/g, '').slice(0, 8)
    const params = new URLSearchParams(searchParams.toString())

    if (!cepNumerico) {
      params.delete('cep')
    } else {
      params.set('cep', cepNumerico)
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={cep}
          onChange={(event) => setCep(event.target.value)}
          inputMode="numeric"
          placeholder="Digite seu CEP"
          className="h-11 border-white/30 bg-white text-slate-900 placeholder:text-slate-500 sm:h-12 sm:text-base"
        />
        <Button type="submit" className="h-11 bg-[#2952cc] text-white hover:bg-[#2347b2] sm:h-12">
          Ver representantes
        </Button>
      </div>
      <p className="text-sm text-white/75">🔒 Seu CEP nao e armazenado</p>
    </form>
  )
}
