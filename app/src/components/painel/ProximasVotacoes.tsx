'use client'

import { useEffect, useState } from 'react'

import { Panel, PanelHeader } from '@/components/civic'

type ItemVotacao = {
  id: string
  titulo: string
  casa: string
  quando: Date
  rotuloData: string
}

const BASE: ItemVotacao[] = [
  { id: '1', titulo: 'PL 6.299/02', casa: 'Plenário Câmara', quando: new Date(new Date().setHours(14, 0, 0, 0)), rotuloData: 'Hoje 14h' },
  {
    id: '2',
    titulo: 'PEC 22/25',
    casa: 'Plenário Câmara',
    quando: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 1, 10, 0, 0),
    rotuloData: '16.MAI 10h',
  },
  {
    id: '3',
    titulo: 'PLP 134/24',
    casa: 'Plenário Senado',
    quando: new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate() + 2, 14, 0, 0),
    rotuloData: '17.MAI 14h',
  },
]

function countdownLabel(alvo: Date, agora: Date) {
  const diff = alvo.getTime() - agora.getTime()
  if (diff <= 0) return 'EM 0h'
  const horas = Math.floor(diff / (1000 * 60 * 60))
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  return `EM ${horas}h ${String(minutos).padStart(2, '0')}m`
}

export function ProximasVotacoes() {
  const [agora, setAgora] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => setAgora(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Panel>
      <PanelHeader title="PRÓX. VOTAÇÕES IMPORTANTES" sub="afetam pelo menos 1 seguido" />
      <div style={{ padding: 12, display: 'grid', gap: 8 }}>
        {BASE.map((item) => (
          <div key={item.id} style={{ border: '1px solid var(--border)', background: 'var(--surface)', padding: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
              <div style={{ color: 'var(--ink-2)', fontSize: 11 }}>{item.rotuloData}</div>
              <div style={{ color: 'var(--accent)', fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.08em' }}>
                {countdownLabel(item.quando, agora)}
              </div>
            </div>
            <div style={{ marginTop: 6, color: 'var(--ink)', fontSize: 14, fontWeight: 600 }}>{item.titulo}</div>
            <div style={{ marginTop: 3, color: 'var(--ink-2)', fontSize: 12 }}>{item.casa}</div>
          </div>
        ))}
      </div>
    </Panel>
  )
}
