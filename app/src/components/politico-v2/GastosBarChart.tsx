import { Receipt } from 'lucide-react'

import { EmptyState } from './EmptyState'

type GastoMensal = {
  mes: string
  valor: number
}

type GastosBarChartProps = {
  data?: GastoMensal[] | null
}

export function GastosBarChart({ data }: GastosBarChartProps) {
  if (!data || data.length === 0) {
    return <EmptyState icon={Receipt} title="Gastos sendo coletados" />
  }

  const maxValor = Math.max(...data.map((d) => d.valor))

  const formatValor = (v: number) =>
    v >= 1000 ? `R$ ${(v / 1000).toFixed(0)} mil` : `R$ ${v.toLocaleString('pt-BR')}`

  return (
    <div style={{ borderRadius: 10, border: '1px solid var(--line)', background: 'var(--panel)', padding: 16 }}>
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink)', margin: 0 }}>Gastos mensais</p>
      <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {data.map((item) => (
          <div key={item.mes} style={{ display: 'grid', gridTemplateColumns: '64px 1fr auto', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>{item.mes}</span>
            <div style={{ height: 6, overflow: 'hidden', borderRadius: 999, background: 'var(--bg-2)' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: 999,
                  background: 'var(--brand-2)',
                  width: `${maxValor > 0 ? (item.valor / maxValor) * 100 : 0}%`,
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
              {formatValor(item.valor)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
