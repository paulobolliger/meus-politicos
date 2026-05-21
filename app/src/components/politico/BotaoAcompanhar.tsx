'use client'

import { useEffect, useState } from 'react'

type Props = {
  politicoId: string
  politicoSlug: string
  /** Estado inicial vindo do servidor. undefined = não sabemos (cards da busca). */
  initialIsSeguindo?: boolean
  /** Se true, dispara o follow automaticamente ao montar (vindo de ?follow=1 pós-login). */
  followIntent?: boolean
  /** Variante visual: 'hero' = botão grande branco no topo do perfil; 'card' = botão pequeno nos cards da busca */
  variant?: 'hero' | 'card'
}

function buildLoginUrl(slug: string): string {
  const redirectTo = encodeURIComponent(`/politicos/${slug}?follow=1`)

  if (typeof window === 'undefined') return `/login?redirectTo=${redirectTo}`

  const { hostname, port } = window.location
  const isDev = hostname.includes('localhost') || hostname === '127.0.0.1'
  const isApp = hostname.startsWith('app.')

  if (isDev && isApp) {
    return `http://painel.localhost:${port}/login?redirectTo=${redirectTo}`
  }
  if (isApp) {
    const painelUrl = process.env.NEXT_PUBLIC_PAINEL_URL ?? 'https://painel.meuspoliticos.com.br'
    return `${painelUrl}/login?redirectTo=${redirectTo}`
  }
  return `/login?redirectTo=${redirectTo}`
}

export function BotaoAcompanhar({
  politicoId,
  politicoSlug,
  initialIsSeguindo,
  followIntent = false,
  variant = 'hero',
}: Props) {
  const [seguindo, setSeguindo] = useState<boolean>(initialIsSeguindo ?? false)
  const [loading, setLoading] = useState(false)
  const [fired, setFired] = useState(false)

  // Auto-follow após retorno do login (?follow=1)
  useEffect(() => {
    if (!followIntent || fired || seguindo) return
    setFired(true)
    follow()
    // Limpa o ?follow=1 da URL sem recarregar
    const url = new URL(window.location.href)
    url.searchParams.delete('follow')
    window.history.replaceState({}, '', url.toString())
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [followIntent])

  async function follow() {
    setLoading(true)
    try {
      const res = await fetch('/api/acompanhamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ politico_id: politicoId }),
        credentials: 'same-origin',
      })

      // 401 = não autenticado direto da API
      // res.redirected = middleware redirecionou para /login (302 seguido pelo fetch)
      if (res.status === 401 || res.redirected) {
        window.location.href = buildLoginUrl(politicoSlug)
        return
      }

      if (res.ok) {
        setSeguindo(true)
        return
      }

      const payload = await res.json().catch(() => null)
      const mensagem =
        (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
          ? payload.error
          : null) ?? 'Não foi possível acompanhar este político agora.'

      window.alert(mensagem)
    } catch {
      // Erro de rede — tenta redirecionar para login de qualquer forma
      window.location.href = buildLoginUrl(politicoSlug)
    } finally {
      setLoading(false)
    }
  }

  async function unfollow() {
    setLoading(true)
    try {
      const res = await fetch(`/api/acompanhamentos/${politicoId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        setSeguindo(false)
      }
    } finally {
      setLoading(false)
    }
  }

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    if (loading) return
    seguindo ? unfollow() : follow()
  }

  if (variant === 'card') {
    return (
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '0 0 12px 12px',
          border: seguindo ? '1px solid #d1fae5' : '1px solid #e2e8f0',
          borderTop: 'none',
          background: seguindo ? '#f0fdf4' : '#f8fafc',
          color: seguindo ? '#065f46' : '#334155',
          fontSize: 12,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'background 0.15s, color 0.15s',
        }}
      >
        {loading ? '...' : seguindo ? '✓ Acompanhando' : '+ Acompanhar'}
      </button>
    )
  }

  // variant === 'hero'
  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        height: 38,
        padding: '0 16px',
        borderRadius: 8,
        border: seguindo ? '1.5px solid rgba(255,255,255,0.6)' : 'none',
        background: seguindo ? 'transparent' : '#fff',
        color: seguindo ? '#fff' : 'var(--ink)',
        fontSize: 13,
        fontWeight: 600,
        cursor: loading ? 'wait' : 'pointer',
        whiteSpace: 'nowrap',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {loading ? '...' : seguindo ? '✓ Acompanhando' : '♥ Acompanhar'}
    </button>
  )
}
