type Tone = 'pos' | 'neg' | 'warn' | 'info' | 'mute' | 'live'

export function StatusDot({ tone = 'mute' }: { tone?: Tone }) {
  const colors = {
    pos: 'var(--pos)',
    neg: 'var(--neg)',
    warn: 'var(--warn)',
    info: 'var(--info)',
    mute: 'var(--mute)',
    live: 'var(--pos)',
  }

  return (
    <span
      style={{
        display: 'inline-block',
        width: 6,
        height: 6,
        borderRadius: '50%',
        background: colors[tone],
        verticalAlign: 'middle',
        animation: tone === 'live' ? 'pulse 1.8s ease-in-out infinite' : undefined,
      }}
    />
  )
}
