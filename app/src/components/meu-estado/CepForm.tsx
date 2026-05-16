'use client'

import { useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

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
    <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10 }}>
      <div
        style={{
          border: '1px solid var(--ink)',
          background: 'var(--panel)',
          padding: 10,
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: 10,
        }}
      >
        <div
          style={{
            border: '1px solid var(--line-strong)',
            background: 'var(--panel-2)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '0 12px',
            minHeight: 52,
          }}
        >
          <span className="mono" style={{ color: 'var(--ink-3)', fontWeight: 700, fontSize: 14 }}>
            ›
          </span>
          <input
            value={localidade}
            onChange={(event) => setLocalidade(event.target.value)}
            type="search"
            placeholder="Digite seu CEP (ou cidade)"
            style={{
              border: 'none',
              outline: 'none',
              background: 'transparent',
              width: '100%',
              height: 48,
              fontSize: 15,
              color: 'var(--ink)',
              fontFamily: 'var(--font-mono)',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            minHeight: 52,
            border: '1px solid var(--ink)',
            background: 'var(--ink)',
            color: 'var(--bg)',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            padding: '0 16px',
            whiteSpace: 'nowrap',
          }}
        >
          Descobrir →
        </button>
      </div>

      <button
        type="button"
        onClick={usarMinhaLocalizacao}
        disabled={geoStatus === 'loading'}
        style={{
          justifySelf: 'start',
          minHeight: 32,
          border: '1px solid var(--line-strong)',
          background: 'var(--panel)',
          color: 'var(--ink-2)',
          padding: '0 12px',
          fontSize: 12,
          fontWeight: 600,
          cursor: geoStatus === 'loading' ? 'not-allowed' : 'pointer',
          opacity: geoStatus === 'loading' ? 0.72 : 1,
        }}
      >
        {geoStatus === 'loading' ? 'Localizando...' : '📍 Usar minha localização'}
      </button>

      {geoStatus === 'error' ? (
        <p style={{ margin: 0, fontSize: 12, color: 'var(--neg)' }}>Não foi possível detectar sua localização.</p>
      ) : null}

      <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.74)' }}>🔒 Sua localidade não é armazenada</p>

      <style dangerouslySetInnerHTML={{ __html: `
        @media (max-width: 720px) { form > div:first-child { grid-template-columns: 1fr; } }
      ` }} />
    </form>
  )
}
