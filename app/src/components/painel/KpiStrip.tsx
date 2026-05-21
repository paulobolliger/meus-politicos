import { Panel } from '@/components/civic'
import { Sparkline } from '@/components/civic/Sparkline'

type KpiStripProps = {
  politicosSeguidos: number
  depCount: number
  senCount: number
  eventosHoje: number
  alertasAtivos: number
  proximaVotacaoLabel: string | null
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
    <Panel style={{ padding: 14, opacity: isEmpty ? 0.55 : 1 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          color: isEmpty ? 'var(--mute)' : 'var(--ink-2)',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 30,
          lineHeight: 1,
          fontWeight: 700,
          color: isEmpty ? 'var(--mute)' : 'var(--ink)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
      <div style={{ marginTop: 8, fontSize: 12, color: isEmpty ? 'var(--mute)' : 'var(--ink-2)' }}>
        {sublabel}
      </div>
      {!isEmpty && (
        <div style={{ marginTop: 10 }}>
          <Sparkline data={[3, 4, 5, 4, 6, 7, 8]} w={94} h={24} color="var(--accent)" />
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
  alertasAtivos,
  proximaVotacaoLabel,
}: KpiStripProps) {
  return (
    <>
    <div
      className="kpi-strip"
      style={{
        display: 'grid',
        gap: 10,
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
        sublabel="Votações + gastos do dia"
      />
      <KpiCard
        label="Alertas ativos"
        value={alertasAtivos === 0 ? '0' : String(alertasAtivos)}
        sublabel={alertasAtivos === 0 ? 'Tudo tranquilo' : 'Gastos atípicos · presença'}
        empty={alertasAtivos === 0}
      />
      <KpiCard
        label="Próxima votação"
        value={proximaVotacaoLabel ?? '—'}
        sublabel={proximaVotacaoLabel ? 'Votação relevante' : 'Sem previsão'}
        empty={!proximaVotacaoLabel}
      />
    </div>
    <style>{`
      @media (max-width: 640px) {
        .kpi-strip { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
      }
    `}</style>
    </>
  )
}
