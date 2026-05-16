'use client'

import { useState } from 'react'

import { Panel, PanelHeader } from '@/components/civic'

type Alerta = {
  id: string
  descricao: string
  canal: string
  ativo: boolean
}

const INICIAIS: Alerta[] = [
  { id: 'gasto', descricao: 'Gasto atípico > 150% mediana', canal: 'EMAIL', ativo: true },
  { id: 'votacao', descricao: 'Votação importante PEC/MPV', canal: 'EMAIL + RSS', ativo: true },
  { id: 'faltas', descricao: 'Faltas consecutivas ≥ 3', canal: 'EMAIL', ativo: true },
  { id: 'discurso', descricao: 'Discursos > 10min', canal: 'OFF', ativo: false },
]

function badgeCanal(canal: string, ativo: boolean) {
  if (!ativo) return { bg: 'var(--surface)', color: 'var(--ink-2)', border: '1px solid var(--border)', label: 'OFF' }
  if (canal.includes('RSS')) return { bg: 'var(--info)', color: '#fff', border: '1px solid var(--info)', label: canal }
  return { bg: 'var(--brand)', color: '#fff', border: '1px solid var(--brand)', label: canal }
}

export function AlertasList() {
  const [alertas, setAlertas] = useState<Alerta[]>(INICIAIS)

  function toggle(id: string) {
    setAlertas((lista) =>
      lista.map((a) => {
        if (a.id !== id) return a
        return { ...a, ativo: !a.ativo }
      })
    )
  }

  const ativos = alertas.filter((a) => a.ativo).length

  return (
    <Panel>
      <PanelHeader
        title={`ALERTAS · ${ativos} ATIVOS`}
        action={
          <button
            type="button"
            style={{ border: '1px solid var(--brand)', background: 'transparent', color: 'var(--brand)', fontSize: 11, padding: '4px 8px' }}
          >
            + NOVO
          </button>
        }
      />

      <div style={{ padding: 12, display: 'grid', gap: 8 }}>
        {alertas.map((alerta) => {
          const badge = badgeCanal(alerta.canal, alerta.ativo)
          return (
            <div key={alerta.id} style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: 10 }}>
              <div style={{ color: 'var(--ink)', fontSize: 12, marginBottom: 8 }}>{alerta.descricao}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 10, padding: '3px 6px', background: badge.bg, color: badge.color, border: badge.border }}>
                  {badge.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggle(alerta.id)}
                  aria-label={`toggle-${alerta.id}`}
                  style={{
                    width: 38,
                    height: 20,
                    borderRadius: 999,
                    border: `1px solid ${alerta.ativo ? 'var(--brand)' : 'var(--border)'}`,
                    background: alerta.ativo ? 'var(--brand)' : 'var(--surface)',
                    position: 'relative',
                    cursor: 'pointer',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      top: 1,
                      left: alerta.ativo ? 19 : 1,
                      width: 16,
                      height: 16,
                      borderRadius: 999,
                      background: '#fff',
                      transition: 'left 180ms ease',
                    }}
                  />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
