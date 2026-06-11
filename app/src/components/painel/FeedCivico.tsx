'use client'

import { useEffect, useMemo, useState } from 'react'

import { Panel } from '@/components/civic'
import { BotaoAcompanhar } from '@/components/politico/BotaoAcompanhar'
import { FeedItem } from './FeedItem'
import type { SeguidoPolitico } from './SeguindoList'

export type SeguidoMini = {
  id: string
  slug: string
  nomeEleitoral: string
  partido: string
  uf: string
}

export type FeedEvento = {
  id: string
  tipo: 'VOTAÇÃO' | 'GASTOS' | 'PRESENÇA' | 'EMENDA' | 'DISCURSO'
  badgeTipo: 'VOTAÇÃO_POS' | 'VOTAÇÃO_NEG' | 'VOTAÇÃO_NEUTRA' | 'ALERTA_GASTOS' | 'PRESENÇA' | 'EMENDA' | 'DISCURSO'
  voto: 'SIM' | 'NÃO' | 'ABS' | 'AUS' | 'OBS' | null
  timestamp: string
  hora: string
  politico: SeguidoMini
  titulo: string
  descricao: string
  contexto: string
  source: string
  isVoto?: boolean
}

type FiltroId = 'TUDO' | 'VOTAÇÕES' | 'GASTOS' | 'PRESENÇA'

const PAGE_SIZE = 10

export function FeedCivico({
  feedEventos,
  totalSeguidos,
  sugestoes = [],
}: {
  feedEventos: FeedEvento[]
  totalSeguidos: number
  sugestoes?: SeguidoPolitico[]
}) {
  const [filtro, setFiltro] = useState<FiltroId>('TUDO')
  const [pagina, setPagina] = useState(1)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 280)
    return () => clearTimeout(timer)
  }, [])

  function mudarFiltro(novo: FiltroId) {
    setFiltro(novo)
    setPagina(1)
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 180)
    return () => clearTimeout(timer)
  }

  const feedFiltrado = useMemo(() => {
    if (filtro === 'TUDO') return feedEventos
    if (filtro === 'VOTAÇÕES') return feedEventos.filter((e) => e.tipo === 'VOTAÇÃO')
    if (filtro === 'GASTOS') return feedEventos.filter((e) => e.tipo === 'GASTOS')
    return feedEventos.filter((e) => e.tipo === 'PRESENÇA')
  }, [feedEventos, filtro])

  const eventosPaginados = feedFiltrado.slice(0, pagina * PAGE_SIZE)
  const temMais = eventosPaginados.length < feedFiltrado.length

  const filtros: FiltroId[] = ['TUDO', 'VOTAÇÕES', 'GASTOS', 'PRESENÇA']

  return (
    <Panel>
      <div style={{ padding: '16px 16px 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          FEED CÍVICO PERSONALIZADO · ÚLT. 7 DIAS
        </div>
        {totalSeguidos > 0 && (
          <div className="filter-segmented-control">
            {filtros.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => mudarFiltro(item)}
                className={`filter-pill ${item === filtro ? 'filter-pill-active' : ''}`}
              >
                {item}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '0 16px 16px', display: 'grid', gap: 14 }}>
        {loading ? (
          <>
            <div className="pulse-shimmer" style={{ height: 100, borderRadius: 8, background: 'var(--surface)', opacity: 0.65 }} />
            <div className="pulse-shimmer" style={{ height: 100, borderRadius: 8, background: 'var(--surface)', opacity: 0.45 }} />
          </>
        ) : totalSeguidos === 0 ? (
          <div
            style={{
              border: '1px dashed var(--line)',
              background: 'rgba(30, 41, 59, 0.15)',
              borderRadius: 8,
              padding: '32px 24px',
              color: 'var(--ink)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 12 }}>👁️</div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginBottom: 6 }}>
              Seu painel está vazio
            </div>
            <div style={{ fontSize: 13, color: 'var(--ink-3)', marginBottom: 24, maxWidth: 460, marginInline: 'auto', lineHeight: 1.5 }}>
              Você ainda não está acompanhando nenhum político. Comece seguindo alguns parlamentares sugeridos abaixo para ativar seu feed cívico de gastos e votações:
            </div>

            {sugestoes.length > 0 && (
              <div 
                style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', 
                  gap: 12, 
                  marginTop: 16,
                  textAlign: 'left',
                }}
              >
                {sugestoes.map((p) => (
                  <div 
                    key={p.id} 
                    style={{ 
                      background: 'rgba(30, 41, 59, 0.3)', 
                      border: '1px solid var(--line)', 
                      borderRadius: 10, 
                      padding: 12, 
                      display: 'flex', 
                      flexDirection: 'column', 
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      {p.fotoUrl ? (
                        <img 
                          src={p.fotoUrl} 
                          alt={p.nomeEleitoral} 
                          style={{ width: 40, height: 40, borderRadius: 999, objectFit: 'cover', border: '1px solid var(--line)' }}
                        />
                      ) : (
                        <div style={{ width: 40, height: 40, borderRadius: 999, background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: 12 }}>
                          {p.nomeEleitoral.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)' }}>{p.nomeEleitoral}</div>
                        <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>{p.partido}-{p.uf} · {p.cargo}</div>
                      </div>
                    </div>
                    <BotaoAcompanhar politicoId={p.id} politicoSlug={p.slug} variant="card" />
                  </div>
                ))}
              </div>
            )}
            
            <div style={{ marginTop: 24 }}>
              <a 
                href="/busca" 
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  height: 36, 
                  padding: '0 16px', 
                  borderRadius: 8, 
                  background: 'var(--brand-2)', 
                  color: 'white', 
                  fontSize: 12.5, 
                  fontWeight: 600, 
                  textDecoration: 'none' 
                }}
              >
                Ir para busca completa de políticos →
              </a>
            </div>
          </div>
        ) : eventosPaginados.length > 0 ? (
          eventosPaginados.map((evento) => <FeedItem key={evento.id} evento={evento} />)
        ) : (
          <div
            style={{
              border: '1px dashed var(--line)',
              background: 'rgba(30, 41, 59, 0.15)',
              borderRadius: 8,
              padding: 24,
              color: 'var(--ink-3)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Sem eventos para o filtro selecionado.
          </div>
        )}

        {temMais && !loading && totalSeguidos > 0 ? (
          <button
            type="button"
            onClick={() => setPagina((p) => p + 1)}
            className="btn-load-more"
          >
            Carregar mais eventos ↓
          </button>
        ) : null}
      </div>

      <style>{`
        .filter-segmented-control {
          display: inline-flex;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--line);
          padding: 3px;
          border-radius: 20px;
          gap: 2px;
        }
        .filter-pill {
          background: transparent;
          border: none;
          color: var(--ink-3);
          font-size: 10px;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.04em;
          padding: 4px 12px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-pill:hover {
          color: var(--ink);
        }
        .filter-pill-active {
          background: var(--brand-2) !important;
          color: #fff !important;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.2);
        }
        
        .btn-load-more {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--ink-2);
          padding: 10px 16px;
          font-size: 11px;
          font-family: var(--font-mono);
          font-weight: 700;
          letter-spacing: 0.06em;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
          margin-top: 8px;
        }
        .btn-load-more:hover {
          background: var(--surface);
          border-color: var(--line-strong);
          color: var(--ink);
          transform: translateY(-1px);
        }
        
        .pulse-shimmer {
          animation: pulse-animation 1.5s ease-in-out infinite;
        }
        @keyframes pulse-animation {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </Panel>
  )
}
