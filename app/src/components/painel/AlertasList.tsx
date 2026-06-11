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
  if (!ativo) return { bg: 'rgba(255, 255, 255, 0.02)', color: 'var(--ink-3)', border: '1px solid var(--line)', label: 'OFF' }
  if (canal.includes('RSS')) return { bg: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.2)', label: canal }
  return { bg: 'rgba(99, 102, 241, 0.1)', color: 'var(--brand-2)', border: '1px solid rgba(99, 102, 241, 0.2)', label: canal }
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
        title={`ALERTAS DE EMAIL · ${ativos} ATIVOS`}
      />

      <div style={{ padding: 14, display: 'grid', gap: 10 }}>
        {alertas.map((alerta) => {
          const badge = badgeCanal(alerta.canal, alerta.ativo)
          return (
            <div key={alerta.id} className="alerta-item-card">
              <div style={{ color: 'var(--ink)', fontSize: 12.5, fontWeight: 500, lineHeight: 1.4, marginBottom: 10 }}>
                {alerta.descricao}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span 
                  style={{ 
                    fontSize: 9, 
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    letterSpacing: '0.06em',
                    padding: '3px 6px', 
                    borderRadius: 4,
                    background: badge.bg, 
                    color: badge.color, 
                    border: badge.border 
                  }}
                >
                  {badge.label}
                </span>
                
                <button
                  type="button"
                  onClick={() => toggle(alerta.id)}
                  aria-label={`toggle-${alerta.id}`}
                  className={`switch-control ${alerta.ativo ? 'switch-control-active' : ''}`}
                >
                  <span className={`switch-thumb ${alerta.ativo ? 'switch-thumb-active' : ''}`} />
                </button>
              </div>
            </div>
          )
        })}
        <div style={{ fontSize: 9.5, color: 'var(--ink-3)', textAlign: 'center', marginTop: 6, fontStyle: 'italic', lineHeight: 1.3 }}>
          * Configurações demonstrativas. A persistência de preferências será ativada em breve.
        </div>
      </div>

      <style>{`
        .alerta-item-card {
          border: 1px solid var(--line);
          background: rgba(30, 41, 59, 0.2);
          padding: 12px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .alerta-item-card:hover {
          background: rgba(30, 41, 59, 0.3);
          border-color: var(--line-strong);
        }
        
        .switch-control {
          width: 36px;
          height: 18px;
          border-radius: 999px;
          border: 1px solid var(--line);
          background: rgba(255, 255, 255, 0.02);
          position: relative;
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .switch-control-active {
          border-color: var(--brand-2);
          background: var(--brand-2);
          box-shadow: 0 0 8px rgba(99, 102, 241, 0.4);
        }
        .switch-thumb {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: var(--ink-3);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .switch-control-active .switch-thumb {
          left: 20px;
          background: #fff;
        }
        .switch-control:hover .switch-thumb {
          background: var(--ink);
        }
      `}</style>
    </Panel>
  )
}
