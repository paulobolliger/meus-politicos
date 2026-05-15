'use client'

type StateDot = {
  uf: string
  x: number
  y: number
  n: number
}

const STATES: StateDot[] = [
  { uf: 'AM', x: 22, y: 36, n: 8 },
  { uf: 'RR', x: 26, y: 16, n: 8 },
  { uf: 'AP', x: 48, y: 18, n: 8 },
  { uf: 'PA', x: 45, y: 30, n: 17 },
  { uf: 'AC', x: 10, y: 42, n: 8 },
  { uf: 'RO', x: 22, y: 48, n: 8 },
  { uf: 'TO', x: 53, y: 44, n: 8 },
  { uf: 'MA', x: 60, y: 32, n: 18 },
  { uf: 'PI', x: 65, y: 41, n: 10 },
  { uf: 'CE', x: 73, y: 33, n: 22 },
  { uf: 'RN', x: 81, y: 35, n: 8 },
  { uf: 'PB', x: 84, y: 40, n: 12 },
  { uf: 'PE', x: 79, y: 44, n: 25 },
  { uf: 'AL', x: 82, y: 49, n: 9 },
  { uf: 'SE', x: 78, y: 52, n: 8 },
  { uf: 'BA', x: 70, y: 56, n: 39 },
  { uf: 'MT', x: 42, y: 54, n: 8 },
  { uf: 'GO', x: 53, y: 60, n: 17 },
  { uf: 'DF', x: 58, y: 58, n: 8 },
  { uf: 'MG', x: 63, y: 65, n: 53 },
  { uf: 'ES', x: 73, y: 66, n: 10 },
  { uf: 'RJ', x: 67, y: 71, n: 46 },
  { uf: 'SP', x: 58, y: 72, n: 70 },
  { uf: 'PR', x: 51, y: 78, n: 30 },
  { uf: 'SC', x: 53, y: 84, n: 16 },
  { uf: 'RS', x: 46, y: 92, n: 31 },
  { uf: 'MS', x: 45, y: 68, n: 8 },
]

type BrazilDotsProps = {
  active: string
  onPick: (uf: string) => void
  dark?: boolean
  height?: number
}

export function BrazilDots({ active, onPick, dark = false, height = 420 }: BrazilDotsProps) {
  const maxN = Math.max(...STATES.map((s) => s.n))

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <svg viewBox="0 0 100 100" style={{ width: '100%', height: '100%' }} preserveAspectRatio="xMidYMid meet">
        {STATES.map((s) => {
          const r = 1.2 + (s.n / maxN) * 2.6
          const isActive = s.uf === active
          return (
            <g key={s.uf} style={{ cursor: 'pointer' }} onClick={() => onPick(s.uf)}>
              <circle cx={s.x} cy={s.y} r={r + 1.6} fill={dark ? 'var(--brand)' : 'var(--brand-2)'} opacity={isActive ? 0.2 : 0} />
              <circle
                cx={s.x}
                cy={s.y}
                r={r}
                fill={isActive ? 'var(--accent)' : dark ? 'var(--brand)' : 'var(--brand-2)'}
                opacity={isActive ? 1 : dark ? 0.72 : 0.78}
              />
              <text
                x={s.x}
                y={s.y - r - 1.2}
                fontFamily="IBM Plex Mono, monospace"
                fontSize="2.2"
                textAnchor="middle"
                fill={isActive ? 'var(--ink)' : dark ? 'var(--ink-2)' : 'var(--ink-3)'}
                fontWeight={isActive ? 700 : 500}
              >
                {s.uf}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}
