export function Sparkline({
  data,
  w = 96,
  h = 28,
  color = 'var(--brand-2)',
  fill = true,
}: {
  data: number[]
  w?: number
  h?: number
  color?: string
  fill?: boolean
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - ((v - min) / span) * (h - 4) - 2
    return [x, y] as [number, number]
  })
  const d = points.map((p, i) => (i === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ')
  const dFill = `${d} L ${w} ${h} L 0 ${h} Z`

  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      {fill && <path d={dFill} fill={color} opacity="0.08" />}
      <path d={d} fill="none" stroke={color} strokeWidth="1.5" />
      {points.map(([x, y], i) =>
        i === points.length - 1 ? <circle key={i} cx={x} cy={y} r="2.5" fill={color} /> : null
      )}
    </svg>
  )
}
