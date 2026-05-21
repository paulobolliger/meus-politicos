import Link from 'next/link'

import { SourceCite, StatusDot, VoteChip } from '@/components/civic'
import type { FeedEvento } from './FeedCivico'

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? 'P'
  const b = partes[1]?.[0] ?? partes[0]?.[1] ?? 'L'
  return `${a}${b}`.toUpperCase()
}

function formatarQuando(timestamp: string, hora: string) {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return 'DATA INDISPONÍVEL'

  const agora = new Date()
  const hoje =
    d.getDate() === agora.getDate() && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()

  if (hoje) return `HOJE · ${hora}`

  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

function badgeStyle(tipo: FeedEvento['badgeTipo']) {
  if (tipo === 'ALERTA_GASTOS') {
    return { color: 'var(--accent)', border: '1px solid var(--accent)', label: 'ALERTA · GASTOS' }
  }
  if (tipo === 'PRESENÇA') {
    return { color: 'var(--neg)', border: '1px solid var(--neg)', label: 'PRESENÇA' }
  }
  if (tipo === 'EMENDA') {
    return { color: 'var(--info)', border: '1px solid var(--info)', label: 'EMENDA' }
  }
  if (tipo === 'DISCURSO') {
    return { color: 'var(--info)', border: '1px solid var(--info)', label: 'DISCURSO' }
  }
  if (tipo === 'VOTAÇÃO_POS') {
    return { color: 'var(--pos)', border: '1px solid var(--pos)', label: 'VOTAÇÃO' }
  }
  if (tipo === 'VOTAÇÃO_NEG') {
    return { color: 'var(--neg)', border: '1px solid var(--neg)', label: 'VOTAÇÃO' }
  }
  return { color: 'var(--mute)', border: '1px solid var(--border)', label: 'VOTAÇÃO' }
}

export function FeedItem({ evento }: { evento: FeedEvento }) {
  const badge = badgeStyle(evento.badgeTipo)

  return (
    <div
      className="feed-item-grid"
      style={{
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        padding: 12,
        display: 'grid',
        gridTemplateColumns: '110px 1fr',
        gap: 10,
      }}
    >
      <div
        style={{
          color: 'var(--ink-2)',
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        {formatarQuando(evento.timestamp, evento.hora)}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, flexWrap: 'wrap' }}>
          <span
            style={{
              color: badge.color,
              border: badge.border,
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.08em',
              padding: '3px 6px',
            }}
          >
            {badge.label}
          </span>
          {evento.voto ? <VoteChip vote={evento.voto} /> : null}
          <StatusDot tone={evento.badgeTipo === 'VOTAÇÃO_POS' ? 'pos' : evento.badgeTipo === 'VOTAÇÃO_NEG' ? 'neg' : 'warn'} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'var(--bg)',
              color: 'var(--ink)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 700,
            }}
          >
            {iniciais(evento.politico.nomeEleitoral)}
          </div>
          <div style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
            {evento.politico.nomeEleitoral}
            <span style={{ color: 'var(--ink-2)', fontWeight: 500 }}> · {evento.politico.partido}-{evento.politico.uf}</span>
          </div>
        </div>

        <div style={{ color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>{evento.titulo}</div>
        <div style={{ color: 'var(--ink)', fontSize: 13, marginTop: 4 }}>{evento.descricao}</div>
        <div style={{ color: 'var(--ink-2)', fontSize: 12, marginTop: 6 }}>{evento.contexto}</div>

        <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <SourceCite source={evento.source} />
          <Link href={`/politicos/${evento.politico.slug}`} style={{ color: 'var(--brand)', textDecoration: 'none', fontSize: 12 }}>
            VER DETALHE {'>'}
          </Link>
        </div>
      </div>
    </div>
  )
}
