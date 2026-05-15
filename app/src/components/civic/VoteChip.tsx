type Vote = 'SIM' | 'NÃO' | 'ABS' | 'AUS' | 'OBS'

export function VoteChip({ vote }: { vote: Vote | string }) {
  const map: Record<string, { c: string; bg: string }> = {
    SIM: { c: 'var(--pos)', bg: 'var(--pos-soft)' },
    NÃO: { c: 'var(--neg)', bg: 'var(--neg-soft)' },
    ABS: { c: 'var(--warn)', bg: 'var(--warn-soft)' },
    AUS: { c: 'var(--mute)', bg: 'var(--bg-2)' },
    OBS: { c: 'var(--info)', bg: 'var(--info-soft)' },
  }

  const s = map[vote] ?? map.AUS

  return (
    <span
      className="mono"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 38,
        padding: '3px 6px',
        fontSize: 10.5,
        fontWeight: 600,
        letterSpacing: '0.06em',
        color: s.c,
        background: s.bg,
        border: `1px solid ${s.c}`,
      }}
    >
      {vote}
    </span>
  )
}
