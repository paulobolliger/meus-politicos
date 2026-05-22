'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

import { BotaoAcompanhar } from '@/components/politico/BotaoAcompanhar'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'

export type PoliticoCard = {
  id: string
  slug: string
  nome: string
  nome_eleitoral: string | null
  foto_url: string | null
  cargo: string
  uf: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  mandato_inicio: string | null
  partidos: { sigla: string | null } | null
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Deputado Federal',
  senador: 'Senador',
  governador: 'Governador',
  prefeito: 'Prefeito',
  deputado_estadual: 'Dep. Estadual',
  vereador: 'Vereador',
}

const CARGO_BADGE_BG: Record<string, string> = {
  deputado_federal: 'var(--brand-2)',
  senador: 'var(--pos)',
  governador: 'var(--accent)',
  prefeito: '#7c3aed',
  deputado_estadual: 'var(--accent-gold)',
  vereador: '#b01264',
}

const AVATAR_BG: Record<string, string> = {
  deputado_federal: 'var(--brand)',
  senador: 'var(--pos)',
  governador: 'var(--accent)',
  prefeito: '#7c3aed',
  deputado_estadual: 'var(--accent-gold)',
  vereador: '#b01264',
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('')
}

function corPresenca(valor: number | null): string {
  if (valor == null) return 'var(--ink-3)'
  if (valor >= 80) return 'var(--pos)'
  if (valor >= 60) return 'var(--warn)'
  return 'var(--neg)'
}

function moeda(valor: number | null) {
  if (valor == null) return null
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(valor)
}

export function CardPolitico({ politico }: { politico: PoliticoCard }) {
  const [hovered, setHovered] = useState(false)
  const nomeExibicao = politico.nome_eleitoral || politico.nome
  const cargoLabel = CARGO_LABEL[politico.cargo] ?? politico.cargo.replace(/_/g, ' ')
  const badgeBg = CARGO_BADGE_BG[politico.cargo] ?? 'var(--brand)'
  const avatarBg = AVATAR_BG[politico.cargo] ?? 'var(--brand)'
  const presencaCor = corPresenca(politico.presenca_pct_atual)
  const presencaPct = politico.presenca_pct_atual ?? 0
  const gastoFormatado = moeda(politico.gasto_total_ano)

  return (
    <div
      style={{
        background: 'var(--panel)',
        border: '1px solid var(--line)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        boxShadow: hovered ? '0 12px 28px -4px rgba(0,81,213,0.1), 0 4px 8px -2px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Link href={`/politicos/${politico.slug}`} style={{ textDecoration: 'none', flex: 1, display: 'flex', flexDirection: 'column' }}>

        {/* ── Área da foto ── */}
        <div style={{ height: 192, position: 'relative', background: 'white', overflow: 'hidden', flexShrink: 0, borderRadius: '16px 16px 0 0', clipPath: 'inset(0 0 0 0 round 16px 16px 0 0)' }}>
          {politico.foto_url ? (
            <Image
              src={politico.foto_url}
              alt={`Foto de ${nomeExibicao}`}
              fill
              style={{ objectFit: 'contain', objectPosition: 'center top', background: 'white' }}
              unoptimized
            />
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <div style={{
                width: 88, height: 88, borderRadius: '50%',
                background: avatarBg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                border: '4px solid rgba(255,255,255,0.9)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
              }}>
                <span style={{ fontSize: 30, fontWeight: 700, color: 'white', letterSpacing: '-0.02em' }}>
                  {iniciais(nomeExibicao)}
                </span>
              </div>
            </div>
          )}

          {/* Badge cargo */}
          <span style={{
            position: 'absolute', top: 10, right: 10,
            background: badgeBg, color: 'white',
            fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
            padding: '3px 8px', borderRadius: 4,
            fontFamily: 'var(--font-mono)',
            textTransform: 'uppercase',
          }}>
            {cargoLabel}
          </span>
        </div>

        {/* ── Corpo do card ── */}
        <div style={{ padding: '16px 16px 12px', flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Nome */}
          <h3 style={{
            margin: '0 0 4px', fontSize: 16, fontWeight: 700, lineHeight: 1.25,
            color: hovered ? 'var(--brand-2)' : 'var(--ink)',
            transition: 'color 0.15s ease',
          }}>
            {nomeExibicao}
          </h3>

          {/* Partido · UF */}
          <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontWeight: 700, color: 'var(--brand-2)' }}>{politico.partidos?.sigla ?? '—'}</span>
            <span style={{ opacity: 0.4 }}>·</span>
            {politico.uf ?? '—'}
          </p>

          {/* Presença */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span className="label">PRESENÇA</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: presencaCor }}>
                {politico.presenca_pct_atual == null ? '–' : `${politico.presenca_pct_atual}%`}
              </span>
            </div>
            <div style={{ height: 5, background: 'var(--bg-2)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${presencaPct}%`, background: presencaCor, borderRadius: 3 }} />
            </div>
          </div>

          {/* Gasto */}
          {gastoFormatado && (
            <p style={{ margin: '0', fontSize: 11, color: 'var(--ink-3)' }}>
              Cota usada:{' '}
              <span style={{ fontWeight: 600, color: 'var(--ink-2)', fontVariantNumeric: 'tabular-nums' }}>
                {gastoFormatado}
              </span>
            </p>
          )}
        </div>
      </Link>

      {/* Seguir */}
      <div style={{ padding: '0 16px 16px' }}>
        <BotaoAcompanhar politicoId={politico.id} politicoSlug={politico.slug} variant="card" />
      </div>
    </div>
  )
}
