export function SourceCite({ source }: { source: string }) {
  return (
    <span
      className="mono"
      style={{
        fontSize: 9.5,
        letterSpacing: '0.08em',
        color: 'var(--mute)',
        fontWeight: 500,
      }}
    >
      FONTE: {source.toUpperCase()}
    </span>
  )
}
