import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Activity, ArrowUpRight, Bell, Mail, Settings, Users } from 'lucide-react'

import { BotaoSair } from '@/components/meus-politicos/BotaoSair'
import { CardAcompanhamento, type PoliticoAcompanhado } from '@/components/meus-politicos/CardAcompanhamento'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'Meus politicos',
  description: 'Painel do usuario logado no Meus Politicos.',
}

type PerfilUsuario = {
  nome: string | null
}

type AcompanhamentoRow = {
  politico_id: string
  politicos: PoliticoAcompanhado | PoliticoAcompanhado[] | null
}

function normalizarPolitico(valor: AcompanhamentoRow['politicos']) {
  if (Array.isArray(valor)) return valor[0] ?? null
  return valor
}

function EmptyPanel({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof Users
  title: string
  description: string
  action?: { href: string; label: string }
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto flex size-12 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="mt-5 text-lg font-bold tracking-tight text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">{description}</p>
      {action ? (
        <Link
          href={action.href}
          className="mt-6 inline-flex h-10 items-center justify-center rounded-lg bg-[#2952cc] px-4 text-sm font-semibold text-white shadow-[0_16px_32px_-22px_rgba(41,82,204,0.95)] transition hover:bg-[#2349bb]"
        >
          {action.label}
        </Link>
      ) : null}
    </div>
  )
}

export default async function MeusPoliticosPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: perfil } = await supabase.from('perfis').select('*').eq('id', user.id).single()

  const { data: acompanhamentos } = await supabase
    .from('acompanhamentos')
    .select('politico_id, politicos(id, slug, nome_eleitoral, foto_url, cargo, uf, partidos(sigla))')
    .eq('usuario_id', user.id)
    .limit(20)

  const perfilUsuario = perfil as PerfilUsuario | null
  const politicosAcompanhados = ((acompanhamentos ?? []) as unknown as AcompanhamentoRow[])
    .map((acompanhamento) => normalizarPolitico(acompanhamento.politicos))
    .filter((politico): politico is PoliticoAcompanhado => Boolean(politico?.slug))

  const saudacao = perfilUsuario?.nome || user.email || 'usuario'

  return (
    <main className="min-h-screen bg-[#f5f6fa]">
      <section className="border-b border-slate-200 bg-linear-to-b from-white to-slate-50">
        <div className="container-shell py-8 sm:py-10">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1 shadow-sm">
                <span className="inline-block size-2 rounded-full bg-emerald-400" />
                <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Painel do usuario
                </span>
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Ola, {saudacao}</h1>
                <p className="mt-2 text-base leading-7 text-slate-600">
                  Acompanhe seus politicos e fique por dentro das ultimas atividades.
                </p>
              </div>
            </div>

            <BotaoSair />
          </div>
        </div>
      </section>

      <div className="container-shell grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:py-8">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm sm:p-6">
            <div className="flex flex-col gap-3 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-slate-950">Politicos que voce acompanha</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">
                  Atalhos para os perfis salvos na sua conta.
                </p>
              </div>
              <Link
                href="/busca"
                className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-[#dbe4ff] bg-[#eef3ff] px-4 text-sm font-semibold text-[#2952cc] transition hover:bg-[#e3ebff]"
              >
                + Explorar mais
              </Link>
            </div>

            <div className="mt-5">
              {politicosAcompanhados.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  {politicosAcompanhados.map((politico) => (
                    <CardAcompanhamento key={politico.id} politico={politico} />
                  ))}
                </div>
              ) : (
                <EmptyPanel
                  icon={Users}
                  title="Voce ainda nao acompanha nenhum politico"
                  description="Explore a base publica e acompanhe representantes para criar seu painel pessoal."
                  action={{ href: '/busca', label: 'Explorar politicos' }}
                />
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm sm:p-6">
            <div className="border-b border-slate-200 pb-5">
              <h2 className="text-xl font-bold tracking-tight text-slate-950">Feed de atividades</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">Atualizacoes relevantes aparecerao aqui.</p>
            </div>
            <div className="mt-5">
              <EmptyPanel
                icon={Activity}
                title="Nenhuma atividade ainda"
                description="Quando os politicos que voce acompanha tiverem novidades, elas aparecerao aqui."
              />
            </div>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-[#dbe4ff] bg-[#f4f7ff] text-[#2952cc]">
                <Settings className="size-5" aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-lg font-bold tracking-tight text-slate-950">Configuracoes rapidas</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">Preferencias essenciais da sua conta.</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-slate-500">
                  <Mail className="size-4" aria-hidden="true" />
                  Email
                </div>
                <p className="mt-2 break-words text-sm font-medium text-slate-900">{user.email}</p>
              </div>

              <div className="grid gap-2">
                <Link
                  href="/conta"
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  Gerenciar conta
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/conta/notificacoes"
                  className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 hover:text-slate-950"
                >
                  <span className="inline-flex items-center gap-2">
                    <Bell className="size-4" aria-hidden="true" />
                    Notificacoes
                  </span>
                  <ArrowUpRight className="size-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </main>
  )
}

