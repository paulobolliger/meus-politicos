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

function KpiCard({ label, value, sublabel }: { label: string; value: string; sublabel: string }) {
  return (
    <Panel style={{ padding: 14 }}>
      <div
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10,
          letterSpacing: '0.08em',
          color: 'var(--ink-2)',
          marginBottom: 8,
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 30, lineHeight: 1, fontWeight: 700, color: 'var(--ink)' }}>{value}</div>
      <div style={{ marginTop: 8, fontSize: 12, color: 'var(--ink-2)' }}>{sublabel}</div>
      <div style={{ marginTop: 10 }}>
        <Sparkline data={[3, 4, 5, 4, 6, 7, 8]} w={94} h={24} color="var(--accent)" />
      </div>
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
    <div
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
        value={alertasAtivos > 0 ? String(alertasAtivos) : '–'}
        sublabel="Gastos atípicos · presença"
      />
      <KpiCard
        label="Votação importante"
        value={proximaVotacaoLabel ?? '–'}
        sublabel="Próxima votação relevante"
      />
    </div>
  )
}
