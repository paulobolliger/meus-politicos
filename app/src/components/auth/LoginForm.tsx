'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  border: '1px solid var(--line-strong)',
  background: 'var(--panel)',
  fontSize: 14,
  marginBottom: 12,
  outline: 'none',
  boxSizing: 'border-box',
  borderRadius: 0,
  color: 'var(--ink)',
}

const oauthBtnBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 20px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  fontSize: 14,
  fontWeight: 500,
  cursor: 'pointer',
  boxSizing: 'border-box',
  borderRadius: 0,
}

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingTwitter, setLoadingTwitter] = useState(false)

  const redirectTo = searchParams.get('redirectTo') || '/painel'

  async function entrarComGoogle() {
    setErrorMessage('')
    setLoadingGoogle(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setErrorMessage('Nao foi possivel iniciar o login com Google.')
      setLoadingGoogle(false)
    }
  }

  async function entrarComX() {
    setErrorMessage('')
    setLoadingTwitter(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    })

    if (error) {
      setErrorMessage('Nao foi possivel iniciar o login com X.')
      setLoadingTwitter(false)
    }
  }

  async function entrarComEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setLoadingEmail(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setErrorMessage('Email ou senha incorretos.')
      setLoadingEmail(false)
      return
    }

    router.push(redirectTo)
    router.refresh()
  }

  return (
    <form onSubmit={entrarComEmail}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 24 }}>Entrar</h2>

      {/* Google */}
      <button
        type="button"
        onClick={entrarComGoogle}
        disabled={loadingGoogle}
        style={{ ...oauthBtnBase, background: 'var(--panel)', border: '1px solid var(--line-strong)', marginBottom: 8, color: 'var(--ink)' }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, flexShrink: 0 }}>
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z" />
        </svg>
        {loadingGoogle ? 'Conectando...' : 'Continuar com Google'}
      </button>

      {/* X */}
      <button
        type="button"
        onClick={entrarComX}
        disabled={loadingTwitter}
        style={{ ...oauthBtnBase, background: 'var(--ink)', color: 'white', border: 'none', marginBottom: 20 }}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 16, height: 16, fill: 'white', flexShrink: 0 }}>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.1-6.72-5.85 6.72h-3.31l7.73-8.835L2.42 2.25h6.76l4.6 6.088 5.313-6.088zM17.15 18.738h1.828L6.8 3.897H4.881l12.269 14.841z" />
        </svg>
        {loadingTwitter ? 'Conectando...' : 'Continuar com X'}
      </button>

      {/* Divisor */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        <span className="mono" style={{ fontSize: 10.5, color: 'var(--mute)', letterSpacing: '0.1em' }}>OU</span>
        <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
      </div>

      {/* Campos */}
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        style={inputStyle}
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Sua senha"
        style={inputStyle}
        required
      />

      {/* Esqueci */}
      <div style={{ textAlign: 'right', marginBottom: 16 }}>
        <Link
          href="/recuperar-senha"
          className="mono"
          style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
        >
          Esqueci minha senha →
        </Link>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={loadingEmail}
        style={{ width: '100%', padding: 14, background: 'var(--brand)', color: 'white', border: 'none', fontSize: 14, fontWeight: 600, cursor: 'pointer', marginTop: 4, boxSizing: 'border-box', borderRadius: 0 }}
      >
        {loadingEmail ? 'Entrando...' : 'Entrar →'}
      </button>

      {errorMessage ? (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--neg)' }}>{errorMessage}</p>
      ) : null}

      <div className="mono" style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-3)' }}>
        Não tem conta?{' '}
        <Link href="/cadastro" style={{ color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none' }}>
          Cadastre-se
        </Link>
      </div>

      <p className="mono" style={{ marginTop: 24, fontSize: 10.5, color: 'var(--mute)', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.5 }}>
        🔒 SEUS DADOS DE LOCALIZAÇÃO NUNCA SÃO ARMAZENADOS
      </p>
    </form>
  )
}
