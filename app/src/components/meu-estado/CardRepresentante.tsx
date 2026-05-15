import Link from 'next/link'

type CardRepresentanteProps = {
  nome: string
  partido?: string | null
  uf?: string | null
  cargo?: string | null
  presencaPct?: number | null
  gastoTotalAno?: number | null
  href?: string
  legenda?: string
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

function avatarColor(seed: string) {
  let hash = 0
  for (let i = 0; i < seed.length; i += 1) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash)
  }

  const palette = ['#1d3a8a', '#2952cc', '#0a7d58', '#c2410c', '#7c3aed', '#1f2937', '#be185d']
  return palette[Math.abs(hash) % palette.length]
}

function presenceColor(value: number | null | undefined) {
  if (value == null) return 'var(--ink-3)'
  if (value >= 90) return 'var(--pos)'
  if (value >= 80) return 'var(--ink)'
  return 'var(--warn)'
}

function moneyPerMonth(gastoTotalAno: number | null | undefined) {
  if (gastoTotalAno == null) return '–'
  return `R$ ${(gastoTotalAno / 12 / 1000).toFixed(1)}k`
}

export function CardRepresentante({
  nome,
  partido,
  uf,
  cargo,
  presencaPct,
  gastoTotalAno,
  href,
  legenda,
}: CardRepresentanteProps) {
  const content = (
    <article
      style={{
        border: '1px solid var(--line)',
        background: 'var(--panel)',
        padding: 12,
        display: 'grid',
        gap: 10,
      }}
    >
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div
          className="mono"
          style={{
            width: 44,
            height: 44,
            background: avatarColor(nome),
            color: '#fff',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {initials(nome)}
        </div>

        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {nome}
          </div>
          <div className="mono" style={{ marginTop: 3, fontSize: 11.5, color: 'var(--brand-2)', display: 'flex', gap: 6 }}>
            <span>{partido || legenda || '—'}</span>
            {uf ? <span style={{ color: 'var(--ink-3)' }}>· {uf}</span> : null}
          </div>
          {cargo ? (
            <div className="mono" style={{ marginTop: 4, fontSize: 10.5, color: 'var(--ink-3)' }}>
              {cargo}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
            PRESENÇA
          </div>
          <div className="mono tnum" style={{ marginTop: 3, fontSize: 12.5, color: presenceColor(presencaPct), fontWeight: 700 }}>
            {presencaPct == null ? '–' : `${Math.round(presencaPct)}%`}
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <div className="mono" style={{ fontSize: 10.5, color: 'var(--ink-3)' }}>
            GASTO/MÊS
          </div>
          <div className="mono tnum" style={{ marginTop: 3, fontSize: 12.5, color: 'var(--ink-2)', fontWeight: 700 }}>
            {moneyPerMonth(gastoTotalAno)}
          </div>
        </div>
      </div>

      {href ? (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span
            style={{
              border: '1px solid var(--line-strong)',
              background: 'transparent',
              color: 'var(--ink)',
              height: 28,
              padding: '0 10px',
              fontSize: 11,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            Ver perfil →
          </span>
        </div>
      ) : null}
    </article>
  )

  if (href) {
    return <Link href={href}>{content}</Link>
  }

  return content
}
