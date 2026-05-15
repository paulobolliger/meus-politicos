import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'

import { BotaoSair } from '@/components/meus-politicos/BotaoSair'
import { CardAcompanhamento, type PoliticoAcompanhado } from '@/components/meus-politicos/CardAcompanhamento'
import { Panel, PanelHeader, StatusDot } from '@/components/civic'
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
    <main className="min-h-screen bg-[var(--bg)]">
      <div className="container-shell py-8 sm:py-10">

        {/* Page header */}
        <div style={{ borderBottom: '1px solid var(--line)', paddingBottom: 24, marginBottom: 32 }}>
          <div className="label" style={{ marginBottom: 8 }}>PAINEL DO USUÁRIO</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <h1 style={{ fontSize: 32, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
              Olá, {saudacao}
            </h1>
            <BotaoSair />
          </div>
          <p style={{ color: 'var(--ink-3)', fontSize: 14, marginTop: 6 }}>
            Acompanhe seus políticos e fique por dentro das últimas atividades.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">

            {/* Políticos acompanhados */}
            <Panel>
              <PanelHeader
                title={`POLÍTICOS QUE VOCÊ ACOMPANHA${politicosAcompanhados.length > 0 ? ` · ${politicosAcompanhados.length}` : ''}`}
                action={
                  <Link
                    href="/busca"
                    style={{
                      padding: '6px 12px',
                      border: '1px solid var(--line)',
                      background: 'var(--bg)',
                      color: 'var(--brand-2)',
                      fontSize: 11,
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 600,
                      textDecoration: 'none',
                      letterSpacing: '0.08em',
                    }}
                  >
                    + EXPLORAR
                  </Link>
                }
              />
              <div style={{ padding: 20 }}>
                {politicosAcompanhados.length > 0 ? (
                  <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                    {politicosAcompanhados.map((politico) => (
                      <CardAcompanhamento key={politico.id} politico={politico} />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      padding: '48px 24px',
                      textAlign: 'center',
                      border: '2px dashed var(--line)',
                      color: 'var(--ink-3)',
                    }}
                  >
                    <div className="mono" style={{ fontSize: 32, marginBottom: 12 }}>[ ]</div>
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>Você ainda não acompanha nenhum político</div>
                    <div style={{ fontSize: 13, marginBottom: 20 }}>Explore a base e acompanhe representantes</div>
                    <Link
                      href="/busca"
                      style={{
                        padding: '10px 20px',
                        background: 'var(--brand)',
                        color: 'white',
                        textDecoration: 'none',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      Explorar políticos →
                    </Link>
                  </div>
                )}
              </div>
            </Panel>

            {/* Feed de atividades */}
            <Panel>
              <PanelHeader
                title="ATIVIDADES RECENTES"
                action={<StatusDot tone="live" />}
              />
              <div style={{ padding: 20 }}>
                <div
                  style={{
                    padding: '32px 24px',
                    background: 'var(--bg-2)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div className="mono" style={{ fontSize: 11, color: 'var(--mute)', letterSpacing: '0.1em' }}>
                    AGUARDANDO DADOS
                  </div>
                  <div style={{ marginTop: 8, color: 'var(--ink-3)', fontSize: 13 }}>
                    Quando os políticos que você acompanha tiverem novidades, elas aparecerão aqui.
                  </div>
                </div>
              </div>
            </Panel>
          </div>

          {/* Conta */}
          <aside>
            <Panel>
              <PanelHeader title="CONTA" />
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div
                  style={{
                    padding: 12,
                    background: 'var(--bg)',
                    border: '1px solid var(--line)',
                  }}
                >
                  <div
                    className="mono"
                    style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.12em', marginBottom: 6 }}
                  >
                    EMAIL
                  </div>
                  <div
                    className="mono"
                    style={{ fontSize: 12, color: 'var(--ink-2)', wordBreak: 'break-all' }}
                  >
                    {user.email}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <Link
                    href="/conta"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-3)',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      background: 'var(--panel)',
                    }}
                  >
                    Gerenciar conta
                    <span style={{ color: 'var(--mute)' }}>→</span>
                  </Link>
                  <Link
                    href="/conta/notificacoes"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '10px 12px',
                      border: '1px solid var(--line)',
                      color: 'var(--ink-3)',
                      fontSize: 13,
                      fontWeight: 600,
                      textDecoration: 'none',
                      background: 'var(--panel)',
                    }}
                  >
                    Notificações
                    <span style={{ color: 'var(--mute)' }}>→</span>
                  </Link>
                </div>

                <div
                  className="mono"
                  style={{ fontSize: 10, color: 'var(--mute)', letterSpacing: '0.08em', lineHeight: 1.5 }}
                >
                  Seus dados de localização não são armazenados.
                </div>
              </div>
            </Panel>
          </aside>
        </div>
      </div>
    </main>
  )
}

