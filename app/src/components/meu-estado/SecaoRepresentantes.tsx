import { Panel, PanelHeader } from '@/components/civic'

type SecaoRepresentantesProps = {
  titulo: string
  badge: string
  quantidade: number
  sub?: string
  children: React.ReactNode
}

export function SecaoRepresentantes({ titulo, badge, quantidade, sub, children }: SecaoRepresentantesProps) {
  return (
    <Panel>
      <PanelHeader
        title={`${badge} ${titulo}`}
        sub={sub}
        action={
          <span
            className="mono"
            style={{
              border: '1px solid var(--line-strong)',
              background: 'var(--bg-2)',
              color: 'var(--ink-2)',
              fontSize: 10.5,
              letterSpacing: '0.08em',
              padding: '4px 8px',
            }}
          >
            {quantidade}
          </span>
        }
      />

      <div style={{ padding: 14 }}>{children}</div>
    </Panel>
  )
}
