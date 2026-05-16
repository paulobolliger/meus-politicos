import type { Metadata } from 'next'
import Link from 'next/link'
import { MailCheck } from 'lucide-react'

export const metadata: Metadata = {
  title: 'E-mail enviado',
  description: 'Confirmacao de envio do link de recuperacao de senha.',
}

export default function RecuperarSenhaConfirmarPage() {
  return (
    <main className="min-h-screen bg-linear-to-b from-slate-50 to-white">
      <section className="container-shell flex min-h-[calc(100vh-5rem)] items-center justify-center py-12">
        <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-[0_24px_60px_-44px_rgba(15,23,42,0.42)] sm:p-10">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
            <MailCheck className="size-9" aria-hidden="true" />
          </div>

          <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">E-mail enviado!</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-slate-600">
            Verifique sua caixa de entrada. O link expira em 1 hora.
          </p>

          <Link
            href="/login"
            className="mt-8 inline-flex h-11 items-center justify-center rounded-lg bg-[#2952cc] px-5 text-sm font-semibold text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] transition hover:bg-[#2347b2]"
          >
            Voltar para o login
          </Link>
        </div>
      </section>
    </main>
  )
}
