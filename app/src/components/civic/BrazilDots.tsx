'use client'

import { useState } from 'react'

type StateDot = {
  uf: string
  name: string
  x: number
  y: number
  labelX: number
  labelY: number
  n: number
}

export const BRAZIL_STATES: StateDot[] = [
  { uf: 'AC', name: 'Acre', x: 12.49, y: 38.48, labelX: 9.3, labelY: 36.8, n: 8 },
  { uf: 'AL', name: 'Alagoas', x: 92.59, y: 39.78, labelX: 95.5, labelY: 42.2, n: 9 },
  { uf: 'AM', name: 'Amazonas', x: 25.01, y: 25.82, labelX: 24.2, labelY: 22.2, n: 8 },
  { uf: 'AP', name: 'Amapá', x: 55.36, y: 12.92, labelX: 55.36, labelY: 9.5, n: 8 },
  { uf: 'BA', name: 'Bahia', x: 79.97, y: 48.7, labelX: 79.97, labelY: 44.5, n: 39 },
  { uf: 'CE', name: 'Ceará', x: 86.26, y: 29.45, labelX: 84.8, labelY: 25.7, n: 22 },
  { uf: 'DF', name: 'Distrito Federal', x: 66.16, y: 54.31, labelX: 63.1, labelY: 52, n: 8 },
  { uf: 'ES', name: 'Espírito Santo', x: 82.85, y: 63.39, labelX: 86.6, labelY: 64.4, n: 10 },
  { uf: 'GO', name: 'Goiás', x: 61.94, y: 54.82, labelX: 58.3, labelY: 57.2, n: 17 },
  { uf: 'MA', name: 'Maranhão', x: 72.12, y: 30.31, labelX: 70.5, labelY: 26.5, n: 18 },
  { uf: 'MG', name: 'Minas Gerais', x: 71.79, y: 60.99, labelX: 71, labelY: 57.1, n: 53 },
  { uf: 'MS', name: 'Mato Grosso do Sul', x: 50.1, y: 65.86, labelX: 46.3, labelY: 67, n: 8 },
  { uf: 'MT', name: 'Mato Grosso', x: 46.81, y: 46.97, labelX: 45.5, labelY: 43.3, n: 8 },
  { uf: 'PA', name: 'Pará', x: 54.88, y: 25.44, labelX: 55.2, labelY: 21.5, n: 17 },
  { uf: 'PB', name: 'Paraíba', x: 92.41, y: 33.79, labelX: 96, labelY: 33.3, n: 12 },
  { uf: 'PE', name: 'Pernambuco', x: 89.25, y: 36.71, labelX: 85.4, labelY: 37.3, n: 25 },
  { uf: 'PI', name: 'Piauí', x: 77.13, y: 33.03, labelX: 77, labelY: 29.4, n: 10 },
  { uf: 'PR', name: 'Paraná', x: 57.68, y: 75.39, labelX: 53.7, labelY: 76.5, n: 30 },
  { uf: 'RJ', name: 'Rio de Janeiro', x: 77.77, y: 69.3, labelX: 81.5, labelY: 71.1, n: 46 },
  { uf: 'RN', name: 'Rio Grande do Norte', x: 92.36, y: 30.84, labelX: 94.7, labelY: 27.7, n: 8 },
  { uf: 'RO', name: 'Rondônia', x: 29.15, y: 42.58, labelX: 25.5, labelY: 44.3, n: 8 },
  { uf: 'RR', name: 'Roraima', x: 32.72, y: 12.18, labelX: 32.72, labelY: 8.8, n: 8 },
  { uf: 'RS', name: 'Rio Grande do Sul', x: 52.21, y: 89.17, labelX: 48.2, labelY: 91.2, n: 31 },
  { uf: 'SC', name: 'Santa Catarina', x: 58.28, y: 82.64, labelX: 62.1, labelY: 84.2, n: 16 },
  { uf: 'SE', name: 'Sergipe', x: 91.09, y: 41.89, labelX: 94.1, labelY: 44.6, n: 8 },
  { uf: 'SP', name: 'São Paulo', x: 64.11, y: 70.49, labelX: 61.1, labelY: 68.1, n: 70 },
  { uf: 'TO', name: 'Tocantins', x: 65.07, y: 38.76, labelX: 64.4, labelY: 35.2, n: 8 },
]

type BrazilDotsProps = {
  active: string
  onPick: (uf: string) => void
  dark?: boolean
  height?: number
}

export function BrazilDots({ active, onPick, dark = false, height = 420 }: BrazilDotsProps) {
  const [hovered, setHovered] = useState('')
  const maxN = Math.max(...BRAZIL_STATES.map((s) => s.n))
  const minN = Math.min(...BRAZIL_STATES.map((s) => s.n))

  return (
    <div style={{ position: 'relative', height, width: '100%' }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: '100%', height: '100%' }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Mapa base do Brasil */}
        <image
          href="/brazil-map.svg"
          x="-3"
          y="0"
          width="105"
          height="100"
          preserveAspectRatio="xMidYMid meet"
          style={{
            opacity: dark ? 0.72 : 0.78,
            filter: dark
              ? 'brightness(0.78) saturate(0.75) contrast(1.12)'
              : 'brightness(0.84) saturate(0.65) contrast(1.12)',
          }}
        />

        {/* Pontos interativos dos estados */}
        {BRAZIL_STATES.map((s) => {
          const normalized = (s.n - minN) / (maxN - minN)
          const r = 1.35 + Math.sqrt(normalized) * 1.15
          const isActive = s.uf === active
          const isHovered = s.uf === hovered
          return (
            <g
              key={s.uf}
              role="button"
              tabIndex={0}
              aria-label={`${s.name} (${s.uf}): ${s.n} representantes federais`}
              style={{ cursor: 'pointer', outline: 'none' }}
              onClick={() => onPick(s.uf)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') onPick(s.uf)
              }}
              onMouseEnter={() => setHovered(s.uf)}
              onMouseLeave={() => setHovered('')}
              onFocus={() => setHovered(s.uf)}
              onBlur={() => setHovered('')}
            >
              <title>{`${s.name} (${s.uf}) · ${s.n} representantes federais`}</title>
              <circle
                cx={s.x}
                cy={s.y}
                r={r + 1.15}
                fill="var(--brand)"
                opacity={isActive ? 0.2 : isHovered ? 0.14 : 0}
              />
              <circle
                cx={s.x}
                cy={s.y}
                r={isHovered ? r + 0.25 : r}
                fill={isActive ? 'var(--accent)' : 'var(--brand)'}
                stroke={isActive || isHovered ? '#ffffff' : 'rgba(255,255,255,0.72)'}
                strokeWidth={isActive || isHovered ? 0.65 : 0.35}
                opacity={isActive ? 1 : isHovered ? 0.96 : 0.82}
                style={{ transition: 'r 140ms ease, opacity 140ms ease, stroke-width 140ms ease' }}
              />
              <text
                x={s.labelX}
                y={s.labelY}
                fontFamily="var(--font-mono)"
                fontSize="2.15"
                textAnchor="middle"
                fill={isActive || isHovered ? 'var(--brand-2)' : 'var(--ink-2)'}
                fontWeight={isActive || isHovered ? 800 : 650}
                paintOrder="stroke"
                stroke="var(--panel)"
                strokeWidth="0.7"
                strokeLinejoin="round"
                style={{ pointerEvents: 'none' }}
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
