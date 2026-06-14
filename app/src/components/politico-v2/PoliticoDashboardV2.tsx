'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Bell, Calendar, Info, Share2, UserRound } from 'lucide-react'
import { useState } from 'react'

import { ModoAnalista } from '@/components/politico-v2/ModoAnalista'
import { ModoCidadao } from '@/components/politico-v2/ModoCidadao'
import {
  CARGO_BADGE_CLASS,
  CARGO_LABEL,
  NA,
  PoliticoDashboardV2Data,
  formatDate,
  formatOptionalNumber,
  initials,
  yearsInOffice,
} from '@/components/politico-v2/shared'
import { Button } from '@/components/ui/button'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'

type Props = {
  politico: PoliticoDashboardV2Data
}

export function PoliticoDashboardV2({ politico }: Props) {
  const [mode, setMode] = useState<'cidadao' | 'analista'>('cidadao')

  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const classeFoto = classeFotoEnquadramento({ cargo: politico.cargo, slug: politico.slug })
  const cargoNome = CARGO_LABEL[politico.cargo] ?? politico.cargo.replaceAll('_', ' ')
  const badgeCargo = CARGO_BADGE_CLASS[politico.cargo] ?? 'bg-[var(--bg-2)] text-[var(--ink-2)] border-[var(--line)]'

  const partidoSigla = politico.partidos?.sigla?.toUpperCase() ?? NA
  const mandatoInfo = yearsInOffice(politico.mandato_inicio)
  const ultimaAtualizacao = politico.collected_at ? formatDate(politico.collected_at) : NA
  const atualizadoEmTopo = politico.collected_at ? new Date(politico.collected_at).toLocaleDateString('pt-BR') : NA

  return (
    <>
      <div className="min-h-screen bg-[var(--bg)] text-[var(--ink)]">
        <section className="relative overflow-hidden bg-[#1a2b5e] text-white">
          <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-[#2952cc]/25 blur-3xl" />
          <div className="pointer-events-none absolute -right-12 top-0 h-72 w-72 rounded-full bg-[#6f8fff]/20 blur-3xl" />

          <div className="container-shell relative py-6 sm:py-8">
            <div className="grid gap-5 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
              <div className="space-y-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20 bg-[#2952cc] shadow-[0_0_0_8px_rgba(255,255,255,0.06)]">
                    {politico.foto_url ? (
                      <Image
                        src={politico.foto_url}
                        alt={`Foto de ${nomeExibicao}`}
                        fill
                        className={`object-cover ${classeFoto}`}
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-bold">{initials(nomeExibicao)}</div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">{nomeExibicao}</h1>
                    <p className="mt-1 text-sm text-white/75 sm:text-base">{politico.nome_civil ?? NA}</p>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                      <span className={`rounded-full border px-3 py-1 ${badgeCargo}`}>{cargoNome}</span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{partidoSigla}</span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">{politico.uf ?? NA}</span>
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1">
                        {mandatoInfo.year === NA ? 'Mandato não informado' : `Mandato desde ${mandatoInfo.year}`}
                      </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-white/85">
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3.5" aria-hidden="true" />
                        {mandatoInfo.label === NA ? 'Em exercício: Não informado' : `Em exercício há ${mandatoInfo.label}`}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Info className="size-3.5" aria-hidden="true" /> Última atualização: {ultimaAtualizacao}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      <Button className="h-10 bg-[#2952cc] px-4 text-white hover:bg-[#3662e0]">
                        <Bell className="size-4" />
                        Acompanhar
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 border-white/25 bg-white/10 px-4 text-white hover:bg-white/20"
                      >
                        <UserRound className="size-4" />
                        Comparar
                      </Button>
                      <Button
                        variant="ghost"
                        className="h-10 px-3 text-white/85 hover:bg-white/10 hover:text-white"
                      >
                        <Share2 className="size-4" />
                        Compartilhar
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <article className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Resumo rápido</p>
                  <Link href="/metodologia" className="text-xs font-semibold text-white hover:underline">
                    Metodologia
                  </Link>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/70">Presença</p>
                    <p className="mt-1 text-xl font-bold text-white">{formatOptionalNumber(politico.presenca_pct_atual, '%')}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/70">Cota no ano</p>
                    <p className="mt-1 text-xl font-bold text-white">{politico.gasto_total_ano == null ? NA : `R$ ${(politico.gasto_total_ano / 1000).toFixed(0)} mil`}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/70">Votações</p>
                    <p className="mt-1 text-xl font-bold text-white">{formatOptionalNumber(politico.total_votacoes)}</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                    <p className="text-[11px] uppercase tracking-wide text-white/70">Em exercício</p>
                    <p className="mt-1 text-xl font-bold text-white">{mandatoInfo.label}</p>
                  </div>
                </div>

                <p className="mt-3 text-xs text-white/70">
                  Dados oficiais com rastreabilidade pública. Veja também{' '}
                  <Link href="/fontes" className="font-semibold text-white hover:underline">
                    fontes
                  </Link>
                  .
                </p>
              </article>
            </div>
          </div>
        </section>

        <div style={{ background: 'var(--bg-2)', borderBottom: '1px solid var(--line)', borderTop: '1px solid var(--line)' }}>
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '12px 32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', color: 'var(--ink-3)', fontWeight: 600 }}>
                VISUALIZAR COMO
              </span>
              <div style={{ display: 'inline-flex', background: 'var(--panel)', border: '1px solid var(--line-strong)', borderRadius: 999, padding: 3 }}>
                {([
                  ['cidadao', '🙂 Cidadão', 'linguagem direta'],
                  ['analista', '⚙ Analista', 'dados completos'],
                ] as const).map(([id, label, sub]) => (
                  <button
                    key={id}
                    onClick={() => setMode(id)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: 999,
                      border: 'none',
                      background: mode === id ? 'var(--ink)' : 'transparent',
                      color: mode === id ? 'var(--bg)' : 'var(--ink-2)',
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {label}
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        opacity: mode === id ? 0.7 : 0.5,
                        letterSpacing: '0.04em',
                        fontWeight: 500,
                      }}
                    >
                      · {sub}
                    </span>
                  </button>
                ))}
              </div>
            </div>
            <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)', letterSpacing: '0.06em' }}>
              DADOS · ATUALIZADO {atualizadoEmTopo} ·{' '}
              <a href="/metodologia" style={{ color: 'var(--brand-2)', cursor: 'pointer' }}>
                METODOLOGIA ↗
              </a>
            </div>
          </div>
        </div>

        {mode === 'cidadao' ? <ModoCidadao politico={politico} /> : <ModoAnalista politico={politico} />}
      </div>
    </>
  )
}
