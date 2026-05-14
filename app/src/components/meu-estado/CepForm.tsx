'use client'

import { useState } from 'react'
import { Loader2, MapPin } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type CepFormProps = {
  defaultLocalidade?: string
}

export function CepForm({ defaultLocalidade = '' }: CepFormProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [localidade, setLocalidade] = useState(defaultLocalidade)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const valor = localidade.trim()
    const params = new URLSearchParams(searchParams.toString())

    if (!valor) {
      params.delete('local')
      params.delete('cep')
    } else {
      params.delete('cep')
      params.set('local', valor)
    }

    const query = params.toString()
    router.push(query ? `${pathname}?${query}` : pathname)
  }

  async function usarMinhaLocalizacao() {
    if (!navigator.geolocation) {
      setGeoStatus('error')
      return
    }

    setGeoStatus('loading')

    try {
      const posicao = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        })
      })

      const lat = posicao.coords.latitude
      const lng = posicao.coords.longitude

      const r = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { 'User-Agent': 'MeusPoliticos/1.0' } }
      )

      if (!r.ok) {
        throw new Error('Falha no reverse geocoding')
      }

      const data = await r.json()
      const cepEncontrado = data.address?.postcode?.replace('-', '')

      if (!cepEncontrado) {
        setGeoStatus('error')
        return
      }

      setLocalidade(cepEncontrado)
      setGeoStatus('idle')
      router.push(`/meu-estado?local=${cepEncontrado}`)
    } catch {
      setGeoStatus('error')
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={localidade}
          onChange={(event) => setLocalidade(event.target.value)}
          type="search"
          placeholder="Digite sua cidade ou CEP"
          className="h-11 border-white/30 bg-white text-slate-900 placeholder:text-slate-500 sm:h-12 sm:text-base"
        />
        <Button type="submit" className="h-11 bg-[#2952cc] text-white hover:bg-[#2347b2] sm:h-12">
          Buscar representantes
        </Button>
      </div>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={usarMinhaLocalizacao}
        disabled={geoStatus === 'loading'}
        className="h-8 w-fit border-slate-300 bg-white text-[#6b7280] hover:bg-slate-50"
      >
        {geoStatus === 'loading' ? (
          <>
            <Loader2 className="animate-spin" size={14} />
            Detectando localização...
          </>
        ) : (
          <>
            <MapPin size={14} />
            Usar minha localização
          </>
        )}
      </Button>
      {geoStatus === 'error' ? (
        <p className="text-sm text-red-300">Não foi possível detectar</p>
      ) : null}
      <p className="text-sm text-white/75">🔒 Sua localidade nao e armazenada</p>
    </form>
  )
}
