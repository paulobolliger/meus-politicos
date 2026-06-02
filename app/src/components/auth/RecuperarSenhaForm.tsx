'use client'

import Link from 'next/link'
import { useState } from 'react'

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)

  function enviarLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)

    window.location.href = `/api/auth/logto/reset-password?email=${encodeURIComponent(email)}`
  }

  return (
    <form onSubmit={enviarLink}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 24 }}>Esqueci minha senha</h2>

      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Seu e-mail"
        style={{
          width: '100%',
          padding: '12px 16px',
          border: '1px solid var(--line-strong)',
          background: 'var(--panel)',
          fontSize: 14,
          marginBottom: 16,
          outline: 'none',
          boxSizing: 'border-box',
          borderRadius: 0,
          color: 'var(--ink)',
        }}
        required
      />

      <button
        type="submit"
        disabled={loading}
        style={{
          width: '100%',
          padding: 14,
          background: 'var(--brand)',
          color: 'white',
          border: 'none',
          fontSize: 14,
          fontWeight: 600,
          cursor: 'pointer',
          boxSizing: 'border-box',
          borderRadius: 0,
        }}
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperação →'}
      </button>

      <div style={{ marginTop: 20 }}>
        <Link
          href="/login"
          className="mono"
          style={{ fontSize: 12, color: 'var(--ink-3)', textDecoration: 'none' }}
        >
          ← Voltar para o login
        </Link>
      </div>

      <p className="mono" style={{ marginTop: 24, fontSize: 10.5, color: 'var(--mute)', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.5 }}>
        🔒 SEUS DADOS DE LOCALIZAÇÃO NUNCA SÃO ARMAZENADOS
      </p>
    </form>
  )
}

