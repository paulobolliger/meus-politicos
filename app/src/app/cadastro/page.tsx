import Image from 'next/image'

import { CadastroForm } from '@/components/auth/CadastroForm'

export default function CadastroPage() {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto grid min-h-screen max-w-7xl lg:grid-cols-2">
        <section className="hidden bg-[#1a2b5e] p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <Image
            src="/logos_meus-politicos_colorido_semfundo.png"
            alt="Meus Politicos"
            width={220}
            height={40}
            className="h-10 w-auto brightness-0 invert"
            priority
          />

          <div className="max-w-md space-y-4">
            <h2 className="text-4xl font-bold leading-tight">Transparencia para decidir melhor</h2>
            <p className="text-lg text-white/80">
              Acompanhe politicos, receba alertas e saiba quem representa voce.
            </p>
          </div>

          <div />
        </section>

        <section className="flex items-center justify-center p-5 sm:p-8">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
            <Image
              src="/logos_meus-politicos_colorido_semfundo.png"
              alt="Meus Politicos"
              width={220}
              height={40}
              className="mb-6 h-10 w-auto lg:hidden"
              priority
            />
            <CadastroForm />
          </div>
        </section>
      </div>
    </main>
  )
}
