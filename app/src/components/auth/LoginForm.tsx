'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

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

export function LoginForm() {
  const searchParams = useSearchParams()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingOAuth, setLoadingOAuth] = useState<'google' | 'x' | 'linkedin' | null>(null)

  const redirectTo = searchParams.get('redirectTo') || '/painel'

  function signInUrl() {
    return `/api/auth/logto/sign-in?redirectTo=${encodeURIComponent(redirectTo)}`
  }

  function entrarComOAuth(key: 'google' | 'x' | 'linkedin') {
    setLoadingOAuth(key)
    window.location.href = signInUrl()
  }

  async function entrarComEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoadingEmail(true)
    window.location.href = signInUrl()
  }

  return (
    <form onSubmit={entrarComEmail}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 24 }}>Entrar</h2>

      {/* OAuth — 3 botões lado a lado */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>

        {/* Google */}
        <button
          type="button"
          onClick={() => entrarComOAuth('google')}
          disabled={loadingOAuth !== null}
          title="Continuar com Google"
          style={{
            flex: 1,
            padding: '10px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: loadingOAuth ? 'wait' : 'pointer',
            boxSizing: 'border-box',
            borderRadius: 0,
            background: 'var(--panel)',
            border: '1px solid var(--line-strong)',
            color: 'var(--ink)',
            whiteSpace: 'nowrap',
            opacity: loadingOAuth && loadingOAuth !== 'google' ? 0.5 : 1,
          }}
        >
          {loadingOAuth === 'google' ? (
            <span style={{ fontSize: 11 }}>...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 15, height: 15, flexShrink: 0 }}>
                <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z" />
              </svg>
              <span>Google</span>
            </>
          )}
        </button>

        {/* X */}
        <button
          type="button"
          onClick={() => entrarComOAuth('x')}
          disabled={loadingOAuth !== null}
          title="Continuar com X"
          style={{
            flex: 1,
            padding: '10px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: loadingOAuth ? 'wait' : 'pointer',
            boxSizing: 'border-box',
            borderRadius: 0,
            background: 'var(--ink)',
            border: 'none',
            color: 'white',
            whiteSpace: 'nowrap',
            opacity: loadingOAuth && loadingOAuth !== 'x' ? 0.5 : 1,
          }}
        >
          {loadingOAuth === 'x' ? (
            <span style={{ fontSize: 11 }}>...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 13, height: 13, fill: 'white', flexShrink: 0 }}>
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.1-6.72-5.85 6.72h-3.31l7.73-8.835L2.42 2.25h6.76l4.6 6.088 5.313-6.088zM17.15 18.738h1.828L6.8 3.897H4.881l12.269 14.841z" />
              </svg>
              <span>X</span>
            </>
          )}
        </button>

        {/* LinkedIn */}
        <button
          type="button"
          onClick={() => entrarComOAuth('linkedin')}
          disabled={loadingOAuth !== null}
          title="Continuar com LinkedIn"
          style={{
            flex: 1,
            padding: '10px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 500,
            cursor: loadingOAuth ? 'wait' : 'pointer',
            boxSizing: 'border-box',
            borderRadius: 0,
            background: '#0A66C2',
            border: 'none',
            color: 'white',
            whiteSpace: 'nowrap',
            opacity: loadingOAuth && loadingOAuth !== 'linkedin' ? 0.5 : 1,
          }}
        >
          {loadingOAuth === 'linkedin' ? (
            <span style={{ fontSize: 11 }}>...</span>
          ) : (
            <>
              <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 14, height: 14, fill: 'white', flexShrink: 0 }}>
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
              </svg>
              <span>LinkedIn</span>
            </>
          )}
        </button>
      </div>

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
