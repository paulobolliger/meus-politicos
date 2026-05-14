'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CheckCircle2, Circle } from 'lucide-react'
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
    <form onSubmit={cadastrarComEmail} className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Criar conta</h2>
        <p className="text-sm leading-6 text-slate-600">
          Comece com login social ou cadastre seus dados básicos de acesso.
        </p>
      </div>

      <div className="space-y-2">
        <Button
          type="button"
          variant="outline"
          onClick={cadastrarComGoogle}
          disabled={loadingGoogle}
          className="h-11 w-full border-slate-300 bg-white text-slate-700 shadow-sm hover:border-slate-400 hover:bg-slate-50 hover:text-slate-950"
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
          onClick={cadastrarComX}
          disabled={loadingTwitter}
          className="h-11 w-full border-black bg-black text-white shadow-sm hover:bg-slate-900 hover:text-white disabled:text-white [&_svg]:text-white"
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
          type="text"
          value={nome}
          onChange={(event) => setNome(event.target.value)}
          placeholder="Seu nome"
          className="h-11 border-slate-300 bg-white"
          required
        />

        <Input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="Seu e-mail"
          className="h-11 border-slate-300 bg-white"
          required
        />

        <Input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Crie uma senha"
          className="h-11 border-slate-300 bg-white"
          required
          minLength={8}
          aria-describedby="password-requirements"
        />

        <div id="password-requirements" className="rounded-xl border border-slate-200 bg-slate-50 p-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Requisitos da senha</p>
          <ul className="mt-2 grid gap-2 text-sm text-slate-600 sm:grid-cols-2">
            {requisitosSenha.map((requisito) => {
              const Icon = requisito.valido ? CheckCircle2 : Circle

              return (
                <li
                  key={requisito.label}
                  className={requisito.valido ? 'flex items-center gap-2 text-emerald-700' : 'flex items-center gap-2'}
                >
                  <Icon className="size-4" aria-hidden="true" />
                  <span>{requisito.label}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <Input
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Repita a senha"
          className="h-11 border-slate-300 bg-white"
          required
          minLength={8}
          aria-invalid={confirmPassword.length > 0 && password !== confirmPassword}
        />
        {confirmPassword.length > 0 ? (
          <p className={senhasConferem ? 'text-sm text-emerald-700' : 'text-sm text-red-600'}>
            {senhasConferem ? 'As senhas conferem.' : 'As senhas ainda nao conferem.'}
          </p>
        ) : null}
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
        className="h-11 w-full bg-[#2952cc] text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] hover:bg-[#2347b2]"
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
