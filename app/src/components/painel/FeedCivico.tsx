'use client'

import { useEffect, useMemo, useState } from 'react'

import { Panel, PanelHeader } from '@/components/civic'
import { FeedItem } from './FeedItem'

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
}

type TabId = 'feed' | 'meus' | 'alertas' | 'agenda' | 'rss'
type FiltroId = 'TUDO' | 'VOTAÇÕES' | 'GASTOS' | 'PRESENÇA'

const PAGE_SIZE = 10

export function FeedCivico({ feedEventos, totalSeguidos }: { feedEventos: FeedEvento[]; totalSeguidos: number }) {
  const [tabAtiva, setTabAtiva] = useState<TabId>('feed')
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

  const tabs = [
    { id: 'feed' as const, label: `Feed cívico (${feedEventos.length})` },
    { id: 'meus' as const, label: `Meus políticos (${totalSeguidos})` },
    { id: 'alertas' as const, label: 'Alertas (3)' },
    { id: 'agenda' as const, label: 'Agenda' },
    { id: 'rss' as const, label: 'RSS / Export' },
  ]

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
      <PanelHeader title="NAVEGAÇÃO DO PAINEL" />
      <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 12px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setTabAtiva(tab.id)}
            style={{
              border: tab.id === tabAtiva ? '1px solid var(--brand)' : '1px solid var(--border)',
              background: tab.id === tabAtiva ? 'var(--brand)' : 'transparent',
              color: tab.id === tabAtiva ? '#fff' : 'var(--ink)',
              padding: '6px 10px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {tabAtiva !== 'feed' ? (
        <div style={{ padding: 16 }}>
          <div
            style={{
              border: '1px dashed var(--border)',
              background: 'var(--surface)',
              padding: 20,
              color: 'var(--ink-2)',
              fontSize: 13,
            }}
          >
            Esta área está em breve.
          </div>
        </div>
      ) : (
        <>
          <div style={{ padding: '12px 12px 8px', display: 'flex', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-2)', letterSpacing: '0.08em' }}>
              FEED CÍVICO · ÚLT. 7 DIAS
            </div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {filtros.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    const cleanup = mudarFiltro(item)
                    if (cleanup) cleanup
                  }}
                  style={{
                    border: item === filtro ? '1px solid var(--brand)' : '1px solid var(--border)',
                    background: item === filtro ? 'var(--brand)' : 'var(--surface)',
                    color: item === filtro ? '#fff' : 'var(--ink)',
                    fontSize: 11,
                    padding: '4px 8px',
                    cursor: 'pointer',
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div style={{ padding: '0 12px 12px', display: 'grid', gap: 10 }}>
            {loading ? (
              <>
                <div style={{ height: 92, background: 'var(--surface)', opacity: 0.65, animation: 'pulse 1.6s ease-in-out infinite' }} />
                <div style={{ height: 92, background: 'var(--surface)', opacity: 0.45, animation: 'pulse 1.6s ease-in-out infinite' }} />
              </>
            ) : eventosPaginados.length > 0 ? (
              eventosPaginados.map((evento) => <FeedItem key={evento.id} evento={evento} />)
            ) : (
              <div
                style={{
                  border: '1px dashed var(--border)',
                  background: 'var(--surface)',
                  padding: 20,
                  color: 'var(--ink-2)',
                  fontSize: 13,
                }}
              >
                Sem eventos para o filtro selecionado.
              </div>
            )}

            {temMais && !loading ? (
              <button
                type="button"
                onClick={() => setPagina((p) => p + 1)}
                style={{
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--ink)',
                  padding: '10px 12px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Carregar mais eventos ↓
              </button>
            ) : null}
          </div>
        </>
      )}
    </Panel>
  )
}
