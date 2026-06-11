import Link from 'next/link'

import { SourceCite, StatusDot, VoteChip } from '@/components/civic'
import type { FeedEvento } from './FeedCivico'

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? 'P'
  const b = partes[1]?.[0] ?? partes[0]?.[1] ?? 'L'
  return `${a}${b}`.toUpperCase()
}

function formatarDataTimeline(timestamp: string) {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return { dia: '--/--', rel: '' }

  const agora = new Date()
  const hoje =
    d.getDate() === agora.getDate() && d.getMonth() === agora.getMonth() && d.getFullYear() === agora.getFullYear()

  if (hoje) return { dia: 'Hoje', rel: 'HOJE' }

  const dia = d.getDate().toString().padStart(2, '0')
  const mes = (d.getMonth() + 1).toString().padStart(2, '0')
  return { dia: `${dia}/${mes}`, rel: '' }
}

function badgeStyle(tipo: FeedEvento['badgeTipo']) {
  if (tipo === 'ALERTA_GASTOS') {
    return { 
      color: '#f43f5e', 
      border: '1px solid rgba(244, 63, 94, 0.2)', 
      bg: 'rgba(244, 63, 94, 0.08)',
      label: 'ALERTA · GASTOS' 
    }
  }
  if (tipo === 'PRESENÇA') {
    return { 
      color: '#f59e0b', 
      border: '1px solid rgba(245, 158, 11, 0.2)', 
      bg: 'rgba(245, 158, 11, 0.08)',
      label: 'PRESENÇA' 
    }
  }
  if (tipo === 'EMENDA') {
    return { 
      color: 'var(--brand-2)', 
      border: '1px solid rgba(99, 102, 241, 0.2)', 
      bg: 'rgba(99, 102, 241, 0.08)',
      label: 'EMENDA' 
    }
  }
  if (tipo === 'DISCURSO') {
    return { 
      color: '#38bdf8', 
      border: '1px solid rgba(56, 189, 248, 0.2)', 
      bg: 'rgba(56, 189, 248, 0.08)',
      label: 'DISCURSO' 
    }
  }
  if (tipo === 'VOTAÇÃO_POS') {
    return { 
      color: 'var(--pos)', 
      border: '1px solid rgba(16, 185, 129, 0.2)', 
      bg: 'rgba(16, 185, 129, 0.08)',
      label: 'VOTAÇÃO' 
    }
  }
  if (tipo === 'VOTAÇÃO_NEG') {
    return { 
      color: 'var(--neg)', 
      border: '1px solid rgba(239, 68, 68, 0.2)', 
      bg: 'rgba(239, 68, 68, 0.08)',
      label: 'VOTAÇÃO' 
    }
  }
  return { 
    color: 'var(--ink-3)', 
    border: '1px solid var(--line)', 
    bg: 'var(--surface)',
    label: 'VOTAÇÃO' 
  }
}

export function FeedItem({ evento }: { evento: FeedEvento }) {
  const badge = badgeStyle(evento.badgeTipo)
  const dataTimeline = formatarDataTimeline(evento.timestamp)

  return (
    <>
      <div className="feed-item-row">
        {/* Left: Timestamp */}
        <div className="feed-item-time-col">
          <span className="feed-item-date">{dataTimeline.dia}</span>
          <span className="feed-item-hour">{evento.hora}</span>
        </div>

        {/* Center: Timeline line & dot */}
        <div className="feed-item-line-col">
          <div className="feed-item-line" />
          <div 
            className="feed-item-dot" 
            style={{ 
              borderColor: badge.color, 
              boxShadow: `0 0 8px ${badge.color}40` 
            }} 
          />
        </div>

        {/* Right: The actual card */}
        <div className="feed-item-card-wrap">
          {/* Top row of card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
            <span
              className="badge-premium"
              style={{
                color: badge.color,
                border: badge.border,
                background: badge.bg,
              }}
            >
              {badge.label}
            </span>
            {evento.isVoto && (
              <span
                className="badge-premium"
                style={{
                  color: '#F59E0B',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                  background: 'rgba(245, 158, 11, 0.1)',
                  fontWeight: 700,
                }}
              >
                ⭐️ MEU VOTO
              </span>
            )}
            {evento.voto ? <VoteChip vote={evento.voto} /> : null}
            <StatusDot tone={evento.badgeTipo === 'VOTAÇÃO_POS' ? 'pos' : evento.badgeTipo === 'VOTAÇÃO_NEG' ? 'neg' : 'warn'} />
          </div>

          {/* Politician info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <div className="avatar-initials">
              {iniciais(evento.politico.nomeEleitoral)}
            </div>
            <div style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>
              {evento.politico.nomeEleitoral}
              {evento.isVoto && <span style={{ color: '#F59E0B', marginLeft: 4 }} title="Meu Voto">⭐️</span>}
              <span style={{ color: 'var(--ink-3)', fontWeight: 500 }}> · {evento.politico.partido}-{evento.politico.uf}</span>
            </div>
          </div>

          {/* Title & Description */}
          <div style={{ color: 'var(--ink)', fontSize: 14.5, fontWeight: 700, lineHeight: 1.35, marginBottom: 4 }}>
            {evento.titulo}
          </div>
          <div style={{ color: 'var(--ink-2)', fontSize: 13.5, lineHeight: 1.45, marginBottom: 6 }}>
            {evento.descricao}
          </div>
          {evento.contexto && (
            <div style={{ color: 'var(--ink-3)', fontSize: 12, fontStyle: 'italic', marginBottom: 12 }}>
              {evento.contexto}
            </div>
          )}

          {/* Footer of card */}
          <div style={{ borderTop: '1px solid var(--line)', paddingTop: 10, marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <SourceCite source={evento.source} />
            <Link href={`/painel/politicos/${evento.politico.slug}`} className="feed-card-link">
              Ficha completa <span className="arrow">→</span>
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .feed-item-row {
          display: flex;
          gap: 12px;
          position: relative;
        }
        .feed-item-time-col {
          width: 54px;
          min-width: 54px;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          padding-top: 18px;
          font-family: var(--font-mono);
        }
        .feed-item-date {
          font-size: 11px;
          font-weight: 700;
          color: var(--ink);
        }
        .feed-item-hour {
          font-size: 9px;
          color: var(--ink-3);
          margin-top: 2px;
        }
        
        .feed-item-line-col {
          width: 16px;
          position: relative;
          display: flex;
          justify-content: center;
        }
        .feed-item-line {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 1px;
          background: var(--line);
          z-index: 1;
        }
        .feed-item-dot {
          position: absolute;
          top: 22px;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--bg);
          border: 2px solid var(--line);
          z-index: 2;
        }
        
        .feed-item-card-wrap {
          flex: 1;
          background: rgba(30, 41, 59, 0.2);
          border: 1px solid var(--line);
          border-radius: 12px;
          padding: 16px;
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          min-width: 0;
        }
        .feed-item-card-wrap:hover {
          background: rgba(30, 41, 59, 0.35);
          border-color: var(--line-strong);
          transform: translateX(4px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.15);
        }
        
        .badge-premium {
          font-family: var(--font-mono);
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 0.08em;
          padding: 2.5px 7px;
          border-radius: 4px;
        }
        
        .avatar-initials {
          width: 26px;
          height: 26px;
          border-radius: 50%;
          border: 1px solid var(--line);
          background: var(--surface);
          color: var(--ink-2);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 9.5px;
          font-weight: 700;
          font-family: var(--font-mono);
        }
        
        .feed-card-link {
          color: var(--brand-2);
          text-decoration: none;
          font-size: 11px;
          font-family: var(--font-mono);
          font-weight: 700;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          transition: all 0.2s;
        }
        .feed-card-link .arrow {
          transition: transform 0.2s;
        }
        .feed-card-link:hover {
          color: var(--brand-active);
        }
        .feed-card-link:hover .arrow {
          transform: translateX(3px);
        }
        
        @media (max-width: 640px) {
          .feed-item-time-col {
            display: none;
          }
          .feed-item-line-col {
            display: none;
          }
        }
      `}</style>
    </>
  )
}
