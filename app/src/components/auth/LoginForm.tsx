'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function LoginForm() {
  const supabase = createClient()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [loadingEmail, setLoadingEmail] = useState(false)
  const [loadingGoogle, setLoadingGoogle] = useState(false)
  const [loadingTwitter, setLoadingTwitter] = useState(false)

  async function entrarComGoogle() {
    setErrorMessage('')
    setLoadingGoogle(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
        redirectTo: `${window.location.origin}/auth/callback`,
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

    router.push('/meus-politicos')
    router.refresh()
  }

  return (
    <form onSubmit={entrarComEmail} className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">Entrar</h1>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={entrarComGoogle}
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

        <Button
          type="button"
          variant="outline"
          onClick={entrarComX}
          disabled={loadingTwitter}
          className="h-11 w-full border-slate-300 bg-black text-white shadow-sm hover:bg-slate-900"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="size-4 fill-white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.6l-5.1-6.72-5.85 6.72h-3.31l7.73-8.835L2.42 2.25h6.76l4.6 6.088 5.313-6.088zM17.15 18.738h1.828L6.8 3.897H4.881l12.269 14.841z" />
          </svg>
          {loadingTwitter ? 'Conectando...' : 'Continuar com X'}
        </Button>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <div className="h-px flex-1 bg-slate-200" />
        <span>ou com e-mail</span>
        <div className="h-px flex-1 bg-slate-200" />
      </div>

      <div className="space-y-3">
        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Seu e-mail"
          className="h-11"
          required
        />

        <div className="relative">
          <Input
            type={mostrarSenha ? 'text' : 'password'}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Sua senha"
            className="h-11 pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setMostrarSenha((current) => !current)}
            className="absolute inset-y-0 right-3 text-slate-500"
            aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
          >
            {mostrarSenha ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="text-right">
        <Link href="/recuperar-senha" className="text-sm text-[#2952cc] hover:underline">
          Esqueci minha senha
        </Link>
      </div>

      <Button
        type="submit"
        disabled={loadingEmail}
        className="h-11 w-full bg-[#2952cc] text-white hover:bg-[#2347b2]"
      >
        {loadingEmail ? 'Entrando...' : 'Entrar'}
      </Button>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <p className="text-sm text-slate-600">
        Nao tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-[#2952cc] hover:underline">
          Cadastre-se
        </Link>
      </p>

      <p className="text-xs text-slate-500">Seus dados de localizacao nunca sao armazenados</p>
    </form>
  )
}
