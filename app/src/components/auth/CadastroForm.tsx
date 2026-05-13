'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function CadastroForm() {
  const supabase = createClient()
  const router = useRouter()

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [aceite, setAceite] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)

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

  async function cadastrarComEmail(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!aceite) {
      setErrorMessage('Voce precisa concordar com os Termos de uso e Politica de privacidade.')
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

  return (
    <form onSubmit={cadastrarComEmail} className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Criar conta</h1>

      <Button
        type="button"
        variant="outline"
        onClick={cadastrarComGoogle}
        disabled={loadingGoogle}
        className="h-11 w-full border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.2.8 3.9 1.5l2.7-2.6C16.9 3.3 14.6 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5s4.1 9.2 9.2 9.2c5.3 0 8.8-3.7 8.8-8.9 0-.6-.1-1.1-.2-1.6H12z"
          />
        </svg>
        {loadingGoogle ? 'Conectando...' : 'Continuar com Google'}
      </Button>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px flex-1 bg-slate-200" />
        <span>ou com e-mail</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        <Input
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Seu nome"
          className="h-11"
          required
        />

        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Seu e-mail"
          className="h-11"
          required
        />

        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Crie uma senha"
          className="h-11"
          required
          minLength={6}
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={aceite}
          onChange={(event) => setAceite(event.target.checked)}
          className="mt-1 h-4 w-4 rounded border-slate-300"
        />
        <span>
          Concordo com os{' '}
          <Link href="/termos" className="text-[#2952cc] hover:underline">
            Termos de uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="text-[#2952cc] hover:underline">
            Politica de privacidade
          </Link>
        </span>
      </label>

      <Button
        type="submit"
        disabled={loadingEmail}
        className="h-11 w-full bg-[#2952cc] text-white hover:bg-[#2347b2]"
      >
        {loadingEmail ? 'Criando conta...' : 'Criar conta'}
      </Button>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <p className="text-sm text-slate-600">
        Ja tem conta?{' '}
        <Link href="/login" className="font-medium text-[#2952cc] hover:underline">
          Entre
        </Link>
      </p>
    </form>
  )
}
