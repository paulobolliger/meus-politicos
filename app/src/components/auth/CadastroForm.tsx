'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

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

export function CadastroForm() {
  const supabase = createClient()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [aceite, setAceite] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingTwitter, setLoadingTwitter] = useState(false)

  async function cadastrarComGoogle() {
    setErrorMessage('')
    setLoadingGoogle(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMessage('Nao foi possivel iniciar o cadastro com Google.')
      setLoadingGoogle(false)
    }
  }

  async function cadastrarComX() {
    setErrorMessage('')
    setLoadingTwitter(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      setErrorMessage('Nao foi possivel iniciar o cadastro com X.')
      setLoadingTwitter(false)
    }
  }

  async function cadastrarComEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!aceite) {
      setErrorMessage('Voce precisa concordar com os Termos de uso e Politica de privacidade.')
      return
    }

    if (!senhaValida) {
      setErrorMessage('A senha ainda nao atende aos requisitos minimos.')
      return
    }

    if (password !== confirmPassword) {
      setErrorMessage('As senhas informadas nao conferem.')
      return
    }

    setErrorMessage('')
    setLoadingEmail(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome } },
    })

    if (error) {
      const mensagem = error.message.toLowerCase()
      if (mensagem.includes('already') || mensagem.includes('registered') || mensagem.includes('exists')) {
        setErrorMessage('Este e-mail ja esta em uso. Entre ou recupere sua senha.')
      } else {
        setErrorMessage('Nao foi possivel criar sua conta agora.')
      }
      setLoadingEmail(false)
      return
    }

    router.push('/meus-politicos')
    router.refresh()
  }

  const requisitosSenha = [
    { label: 'Pelo menos 8 caracteres', valido: password.length >= 8 },
    { label: 'Uma letra maiuscula', valido: /[A-Z]/.test(password) },
    { label: 'Uma letra minuscula', valido: /[a-z]/.test(password) },
    { label: 'Um numero', valido: /\d/.test(password) },
  ]
  const senhaValida = requisitosSenha.every((requisito) => requisito.valido)
  const senhasConferem = confirmPassword.length > 0 && password === confirmPassword

  return (
    <form onSubmit={cadastrarComEmail}>
      <h2 style={{ fontSize: 24, fontWeight: 700, color: 'var(--ink)', marginBottom: 24 }}>Criar conta</h2>

      {/* Google */}
      <button
        type="button"
        onClick={cadastrarComGoogle}
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
        onClick={cadastrarComX}
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
        type="text"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder="Seu nome"
        style={inputStyle}
        required
      />
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
        placeholder="Crie uma senha"
        style={inputStyle}
        required
        minLength={8}
        aria-describedby="password-requirements"
      />

      {/* Requisitos da senha */}
      <div
        id="password-requirements"
        style={{
          padding: 12,
          border: '1px solid var(--line)',
          background: 'var(--bg)',
          marginBottom: 12,
        }}
      >
        <div className="mono" style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.12em', marginBottom: 8 }}>
          REQUISITOS DA SENHA
        </div>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {requisitosSenha.map((req) => (
            <li
              key={req.label}
              className="mono"
              style={{ fontSize: 11, color: req.valido ? 'var(--pos)' : 'var(--mute)', display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <span>{req.valido ? '✓' : '○'}</span> {req.label}
            </li>
          ))}
        </ul>
      </div>

      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder="Repita a senha"
        style={inputStyle}
        required
        minLength={8}
        aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
      />
      {confirmPassword.length > 0 ? (
        <p
          className="mono"
          style={{ fontSize: 12, color: senhasConferem ? 'var(--pos)' : 'var(--neg)', marginBottom: 12, marginTop: -8 }}
        >
          {senhasConferem ? '✓ As senhas conferem.' : '✗ As senhas ainda não conferem.'}
        </p>
      ) : null}

      {/* Aceite */}
      <label
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          gap: 8,
          fontSize: 13,
          color: 'var(--ink-3)',
          marginBottom: 16,
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={aceite}
          onChange={(e) => setAceite(e.target.checked)}
          style={{ marginTop: 2, flexShrink: 0 }}
        />
        <span>
          Concordo com os{' '}
          <Link href="/termos" style={{ color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}>
            Termos de uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" style={{ color: 'var(--brand-2)', textDecoration: 'none', fontWeight: 600 }}>
            Política de privacidade
          </Link>
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={loadingEmail}
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
        {loadingEmail ? 'Criando conta...' : 'Criar conta →'}
      </button>

      {errorMessage ? (
        <p style={{ marginTop: 12, fontSize: 13, color: 'var(--neg)' }}>{errorMessage}</p>
      ) : null}

      <div className="mono" style={{ marginTop: 16, fontSize: 12, color: 'var(--ink-3)' }}>
        Já tem conta?{' '}
        <Link href="/login" style={{ color: 'var(--brand-2)', fontWeight: 600, textDecoration: 'none' }}>
          Entre
        </Link>
      </div>

      <p className="mono" style={{ marginTop: 24, fontSize: 10.5, color: 'var(--mute)', letterSpacing: '0.06em', textAlign: 'center', lineHeight: 1.5 }}>
        🔒 SEUS DADOS DE LOCALIZAÇÃO NUNCA SÃO ARMAZENADOS
      </p>
    </form>
  )
}
