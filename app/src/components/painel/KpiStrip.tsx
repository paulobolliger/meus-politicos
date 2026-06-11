import { Panel } from '@/components/civic'
import { Sparkline } from '@/components/civic/Sparkline'

type KpiStripProps = {
  politicosSeguidos: number
  depCount: number
  senCount: number
  eventosHoje: number
  totalGastos30d: number
  mediaPresenca: number | null
}

function KpiCard({
  label,
  value,
  sublabel,
  empty = false,
}: {
  label: string
  value: string
  sublabel: string
  empty?: boolean
}) {
  const isEmpty = empty || value === '0' || value === '—'
  return (
    <Panel className={`kpi-card ${isEmpty ? 'kpi-card-empty' : ''}`} style={{ padding: '18px 20px' }}>
      <div className="kpi-card-label">
        {label}
      </div>
      <div className="kpi-card-value">
        {value}
      </div>
      <div className="kpi-card-sublabel">
        {sublabel}
      </div>
      {!isEmpty && (
        <div className="kpi-card-sparkline">
          <Sparkline data={[3, 4, 5, 4, 6, 7, 8]} w={94} h={24} color="var(--brand-2)" />
        </div>
      )}
    </Panel>
  )
}

export function KpiStrip({
  politicosSeguidos,
  depCount,
  senCount,
  eventosHoje,
  totalGastos30d,
  mediaPresenca,
}: KpiStripProps) {
  const formattedGastos = totalGastos30d.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  })

  return (
    <>
      <div
        className="kpi-strip"
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
        }}
      >
        <KpiCard
          label="Políticos seguidos"
          value={String(politicosSeguidos)}
          sublabel={`${depCount} dep · ${senCount} sen`}
        />
        <KpiCard
          label="Eventos hoje"
          value={String(eventosHoje)}
          sublabel="Votações + gastos"
        />
        <KpiCard
          label="Gastos (Últ. 30 dias)"
          value={formattedGastos}
          sublabel="Soma dos monitorados"
          empty={totalGastos30d === 0}
        />
        <KpiCard
          label="Presença média"
          value={mediaPresenca !== null ? `${Math.round(mediaPresenca)}%` : '—'}
          sublabel="Presença em sessões"
          empty={mediaPresenca === null}
        />
      </div>

      <style>{`
        .kpi-card {
          transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border: 1px solid var(--line) !important;
          background: rgba(30, 41, 59, 0.3) !important;
          position: relative;
        }
        .kpi-card:hover {
          transform: translateY(-2.5px);
          background: rgba(30, 41, 59, 0.45) !important;
          border-color: rgba(99, 102, 241, 0.3) !important;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.25), 0 0 15px rgba(99, 102, 241, 0.08) !important;
        }
        .kpi-card-empty {
          opacity: 0.5;
        }
        .kpi-card-empty:hover {
          transform: none;
          opacity: 0.5;
          border-color: var(--line) !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.15) !important;
        }
        .kpi-card-label {
          font-family: var(--font-mono);
          font-size: 9.5px;
          font-weight: 700;
          letter-spacing: 0.08em;
          color: var(--ink-3);
          margin-bottom: 8px;
          text-transform: uppercase;
          transition: color 0.2s;
        }
        .kpi-card:hover .kpi-card-label {
          color: var(--brand-2);
        }
        .kpi-card-value {
          font-family: var(--font-display);
          font-size: 34px;
          line-height: 1;
          font-weight: 800;
          color: var(--ink);
          font-variant-numeric: tabular-nums;
          letter-spacing: -0.02em;
        }
        .kpi-card-sublabel {
          margin-top: 8px;
          font-size: 11.5px;
          color: var(--ink-3);
        }
        .kpi-card-sparkline {
          margin-top: 12px;
          opacity: 0.8;
        }
        .kpi-card:hover .kpi-card-sparkline {
          opacity: 1;
        }
        @media (max-width: 768px) {
          .kpi-strip {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }
      `}</style>
    </>
  )
}
