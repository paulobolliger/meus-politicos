'use client'

import Link from 'next/link'
import { CheckCircle2 } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createClient } from '@/lib/supabase/client'

export function RecuperarSenhaForm() {
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [loading, setLoading] = useState(false)

  async function enviarLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setErrorMessage('')
    setSentEmail('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/conta/nova-senha`,
    })

    setLoading(false)

    if (error) {
      setErrorMessage('Nao foi possivel enviar o link de recuperacao. Verifique o e-mail e tente novamente.')
      return
    }

    setSentEmail(email)
  }

  return (
    <form onSubmit={enviarLink} className="space-y-5">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950">Esqueci minha senha</h2>
        <p className="text-sm leading-6 text-slate-600">
          Informe o e-mail da sua conta para receber um link seguro de redefinicao.
        </p>
      </div>

      <Input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Seu e-mail"
        className="h-11 border-slate-300 bg-white"
        required
      />

      <Button
        type="submit"
        disabled={loading}
        className="h-11 w-full bg-[#2952cc] text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] hover:bg-[#2347b2]"
      >
        {loading ? 'Enviando...' : 'Enviar link de recuperação'}
      </Button>

      {sentEmail ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-800">
          <div className="flex gap-2">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            <p>
              <span className="font-semibold">Link enviado!</span> Verifique sua caixa de entrada em{' '}
              <span className="font-semibold">{sentEmail}</span>. O link expira em 1 hora.
            </p>
          </div>
        </div>
      ) : null}

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <Link href="/login" className="inline-flex text-sm font-medium text-[#2952cc] transition hover:underline">
        ← Voltar para o login
      </Link>
    </form>
  )
}

