'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

type Sugestao = { label: string; valor: string }

function formatarCep(raw: string): string {
  const d = raw.replace(/\D/g, '').slice(0, 8)
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function ehCep(texto: string) {
  return /^\d/.test(texto)
}

export function CepForm({ defaultLocalidade = '' }: { defaultLocalidade?: string }) {
  const router       = useRouter()
  const pathname     = usePathname()
  const searchParams = useSearchParams()

  const [valor,      setValor]      = useState(defaultLocalidade)
  const [sugestoes,  setSugestoes]  = useState<Sugestao[]>([])
  const [aberto,     setAberto]     = useState(false)
  const [geoStatus,  setGeoStatus]  = useState<'idle' | 'loading' | 'error'>('idle')

  const inputRef    = useRef<HTMLInputElement>(null)
  const wrapperRef  = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setValor(defaultLocalidade) }, [defaultLocalidade])

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    let raw = e.target.value
    if (ehCep(raw)) raw = formatarCep(raw)
    setValor(raw)
    setAberto(true)

    if (!ehCep(raw) && raw.trim().length >= 3) {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchSugestoes(raw.trim()), 350)
    } else {
      setSugestoes([])
    }
  }

  async function fetchSugestoes(query: string) {
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&countrycodes=br&format=jsonv2&addressdetails=1&limit=6`,
        { headers: { Accept: 'application/json' } }
      )
      if (!res.ok) return
      const data = (await res.json()) as Array<{
        address?: { city?: string; town?: string; village?: string; municipality?: string; county?: string; state_code?: string }
      }>
      const vistos = new Set<string>()
      const lista: Sugestao[] = []
      for (const item of data) {
        if (!item.address?.state_code) continue
        const cidade = item.address.city ?? item.address.town ?? item.address.village ?? item.address.municipality ?? item.address.county ?? query
        const uf     = item.address.state_code.toUpperCase()
        const key    = `${cidade}-${uf}`
        if (vistos.has(key)) continue
        vistos.add(key)
        lista.push({ label: `${cidade} · ${uf}`, valor: cidade })
      }
      setSugestoes(lista)
    } catch { /* silencioso */ }
  }

  function navegar(v: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (!v.trim()) { params.delete('local'); params.delete('cep') }
    else           { params.delete('cep'); params.set('local', v.trim()) }
    const q = params.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setAberto(false)
    navegar(valor)
  }

  function selecionar(v: string) {
    setValor(v)
    setSugestoes([])
    setAberto(false)
    navegar(v)
  }

  async function usarLocalizacao() {
    if (!navigator.geolocation) { setGeoStatus('error'); return }
    setGeoStatus('loading')
    setAberto(false)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 12000 })
      )
      const r    = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`,
        { headers: { 'User-Agent': 'MeusPoliticos/1.0' } }
      )
      const data = await r.json()
      const cep  = data.address?.postcode?.replace(/\D/g, '')
      if (cep) {
        const fmt = formatarCep(cep)
        setValor(fmt)
        setGeoStatus('idle')
        router.push(`/meu-estado?local=${cep}`)
      } else {
        setGeoStatus('error')
      }
    } catch {
      setGeoStatus('error')
    }
  }

  const mostrarDropdown = aberto

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', maxWidth: 520, margin: '0 auto' }}>
      <form onSubmit={onSubmit}>
        {/* Barra de busca */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'white',
          border: '1px solid var(--line-strong)',
          borderRadius: mostrarDropdown ? '12px 12px 0 0' : 12,
          boxShadow: '0 4px 18px rgba(0,0,0,0.09)',
          overflow: 'hidden',
          transition: 'border-radius 0.1s',
        }}>
          {/* Ícone pin */}
          <div style={{ paddingLeft: 16, paddingRight: 8, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brand-2)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
              <circle cx="12" cy="9" r="2.5"/>
            </svg>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            value={valor}
            onChange={onChange}
            onFocus={() => setAberto(true)}
            type="text"
            placeholder="Cidade ou CEP (ex: 01001-000)"
            autoComplete="off"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              height: 52, fontSize: 15, color: 'var(--ink)', fontFamily: 'var(--font-sans)',
            }}
          />

          {/* Limpar */}
          {valor && (
            <button
              type="button"
              onClick={() => { setValor(''); setSugestoes([]); inputRef.current?.focus() }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 8px', color: 'var(--ink-3)', fontSize: 18, lineHeight: 1, flexShrink: 0 }}
              aria-label="Limpar"
            >
              ×
            </button>
          )}

          {/* Botão buscar */}
          <button
            type="submit"
            style={{
              background: 'var(--brand-2)', color: 'white', border: 'none',
              height: 52, padding: '0 26px', fontSize: 15, fontWeight: 700,
              cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'var(--font-sans)', flexShrink: 0,
            }}
          >
            {geoStatus === 'loading' ? 'Localizando...' : 'Buscar'}
          </button>
        </div>

        {/* Dropdown */}
        {mostrarDropdown && (
          <div style={{
            position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 60,
            background: 'white',
            border: '1px solid var(--line-strong)', borderTop: 'none',
            borderRadius: '0 0 12px 12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}>
            {/* Usar minha localização */}
            <button
              type="button"
              onMouseDown={(e) => { e.preventDefault(); usarLocalizacao() }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '13px 16px', background: 'none', border: 'none',
                borderBottom: sugestoes.length > 0 ? '1px solid var(--line)' : 'none',
                cursor: 'pointer', textAlign: 'left', fontSize: 14,
                color: 'var(--brand-2)', fontWeight: 600, fontFamily: 'var(--font-sans)',
              }}
            >
              <span>📍</span>
              {geoStatus === 'loading' ? 'Detectando localização...' : 'Usar minha localização atual'}
            </button>

            {/* Sugestões de cidades */}
            {sugestoes.map((s, i) => (
              <button
                key={i}
                type="button"
                onMouseDown={(e) => { e.preventDefault(); selecionar(s.valor) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                  padding: '11px 16px', background: 'none', border: 'none',
                  borderTop: '1px solid var(--line)',
                  cursor: 'pointer', textAlign: 'left', fontSize: 14, color: 'var(--ink)',
                  fontFamily: 'var(--font-sans)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-3)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                {s.label}
              </button>
            ))}
          </div>
        )}
      </form>

      {geoStatus === 'error' && (
        <p style={{ margin: '8px 0 0', fontSize: 12, color: 'var(--neg)', textAlign: 'center' }}>
          Não foi possível detectar sua localização.
        </p>
      )}
    </div>
  )
}
