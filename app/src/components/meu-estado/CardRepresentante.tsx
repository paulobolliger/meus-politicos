import Image from 'next/image'
import Link from 'next/link'

const CARGO_BADGE: Record<string, { bg: string; label: string }> = {
  deputado_federal:  { bg: 'var(--brand-2)',     label: 'Dep. Federal'  },
  senador:           { bg: 'var(--pos)',          label: 'Senador'       },
  governador:        { bg: 'var(--accent)',       label: 'Governador'    },
  prefeito:          { bg: '#7c3aed',             label: 'Prefeito'      },
  deputado_estadual: { bg: 'var(--accent-gold)',  label: 'Dep. Estadual' },
  vereador:          { bg: '#b01264',             label: 'Vereador'      },
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

function corPresenca(v: number | null | undefined): string {
  if (v == null) return 'var(--ink-3)'
  if (v >= 80)   return 'var(--pos)'
  if (v >= 60)   return 'var(--warn)'
  return 'var(--neg)'
}

type CardRepresentanteProps = {
  nome: string
  partido?: string | null
  uf?: string | null
  cidade?: string | null
  cargoKey?: string
  presencaPct?: number | null
  gastoTotalAno?: number | null
  foto_url?: string | null
  href?: string
  legenda?: string
  /** 'federal' = foto 192px + gradient overlay partido/UF. 'local' = foto 160px + badges abaixo do nome */
  variant?: 'federal' | 'local'
}

export function CardRepresentante({
  nome,
  partido,
  uf,
  cidade,
  cargoKey,
  presencaPct,
  gastoTotalAno,
  foto_url,
  href,
  legenda,
  variant = 'local',
}: CardRepresentanteProps) {
  const cargo  = CARGO_BADGE[cargoKey ?? '']
  const badgeBg = cargo?.bg ?? 'var(--brand)'
  const label   = cargo?.label ?? (cargoKey?.replace(/_/g, ' ') ?? '')
  const presencaCor = corPresenca(presencaPct)
  const fotoH = variant === 'federal' ? 192 : 160

  const card = (
    <div style={{
      background: 'var(--panel)',
      border: '1px solid var(--line)',
      borderRadius: 16,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      height: '100%',
    }}>

      {/* ── Área da foto ── */}
      <div style={{
        height: fotoH,
        position: 'relative',
        background: 'white',
        overflow: 'hidden',
        flexShrink: 0,
        borderRadius: '16px 16px 0 0',
        clipPath: 'inset(0 0 0 0 round 16px 16px 0 0)',
      }}>
        {foto_url ? (
          <Image
            src={foto_url}
            alt={`Foto de ${nome}`}
            fill
            style={{ objectFit: 'contain', objectPosition: 'center top' }}
            unoptimized
          />
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: badgeBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid rgba(255,255,255,0.9)',
              boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
            }}>
              <span style={{ fontSize: 24, fontWeight: 700, color: 'white', fontFamily: 'var(--font-mono)' }}>
                {iniciais(nome)}
              </span>
            </div>
          </div>
        )}

        {/* Badge cargo */}
        <span style={{
          position: 'absolute', top: 10, right: 10,
          background: badgeBg, color: 'white',
          fontSize: 9, fontWeight: 700, letterSpacing: '0.07em',
          padding: '3px 8px', borderRadius: 4,
          fontFamily: 'var(--font-mono)',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>

        {/* Federal: gradient overlay com partido + UF */}
        {variant === 'federal' && partido && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 100%)',
            padding: '28px 12px 10px',
          }}>
            <span style={{
              color: 'rgba(255,255,255,0.93)',
              fontSize: 11, fontWeight: 700,
              fontFamily: 'var(--font-mono)',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}>
              {partido}{uf ? ` · ${uf}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Corpo ── */}
      <div style={{ padding: '14px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Nome */}
        <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, lineHeight: 1.25, color: 'var(--ink)' }}>
          {nome}
        </h3>

        {/* Local variant: partido + cidade */}
        {variant === 'local' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {partido && (
              <span style={{
                background: 'var(--bg-2)', color: 'var(--ink-2)',
                fontSize: 11, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
              }}>
                {partido}
              </span>
            )}
            {(cidade || uf) && (
              <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>· {cidade ?? uf}</span>
            )}
          </div>
        )}

        {/* Presença — sempre visível */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
              PRESENÇA
            </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: presencaCor, fontFamily: 'var(--font-mono)' }}>
              {presencaPct != null ? `${presencaPct}%` : '–'}
            </span>
          </div>
          <div style={{ height: 4, background: 'var(--bg-2)', borderRadius: 2 }}>
            <div style={{ height: '100%', width: presencaPct != null ? `${presencaPct}%` : '0%', background: presencaCor, borderRadius: 2 }} />
          </div>
          {legenda && (
            <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--ink-3)', fontStyle: 'italic' }}>{legenda}</p>
          )}
        </div>

        {/* Gasto anual (federal) */}
        {variant === 'federal' && gastoTotalAno != null && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--ink-3)' }}>
            <span>Cota usada (ano)</span>
            <span style={{ fontWeight: 600, color: 'var(--ink-2)', fontFamily: 'var(--font-mono)' }}>
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(gastoTotalAno)}
            </span>
          </div>
        )}

        {/* Ver Perfil */}
        {href && (
          <div style={{ marginTop: 'auto', paddingTop: 4 }}>
            <span style={{
              display: 'block', textAlign: 'center',
              border: '1px solid var(--brand-2)', color: 'var(--brand-2)',
              padding: '7px 0', borderRadius: 8,
              fontSize: 13, fontWeight: 600,
            }}>
              Ver Perfil Completo
            </span>
          </div>
        )}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column' }}>
        {card}
      </Link>
    )
  }
  return card
}
