import Link from 'next/link'

import { Panel, PanelHeader } from '@/components/civic'

export type SeguidoPolitico = {
  id: string
  slug: string
  nome: string
  nomeEleitoral: string
  partido: string
  uf: string
  cargo: string
  fotoUrl: string | null
  presencaPctAtual: number | null
}

function iniciais(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean)
  const a = partes[0]?.[0] ?? 'P'
  const b = partes[1]?.[0] ?? partes[0]?.[1] ?? 'L'
  return `${a}${b}`.toUpperCase()
}

function corPorCargo(cargo: string) {
  const c = cargo.toLowerCase()
  if (c.includes('sen')) return 'var(--info)'
  if (c.includes('deput')) return 'var(--brand)'
  return 'var(--accent)'
}

function corPresenca(valor: number | null) {
  if (valor === null) return 'var(--ink-2)'
  if (valor > 85) return 'var(--pos)'
  if (valor >= 70) return 'var(--warn)'
  return 'var(--neg)'
}

export function SeguindoList({ seguindo }: { seguindo: SeguidoPolitico[] }) {
  return (
    <Panel>
      <PanelHeader
        title={`SEGUINDO · ${seguindo.length}`}
        action={
          <Link href="/busca" style={{ color: 'var(--brand)', textDecoration: 'none', fontSize: 11 }}>
            GERENCIAR {'>'}
          </Link>
        }
      />

      <div style={{ padding: 12, display: 'grid', gap: 8 }}>
        {seguindo.length === 0 ? (
          <Link
            href="/busca"
            style={{
              border: '1px dashed var(--border)',
              background: 'var(--surface)',
              padding: 14,
              color: 'var(--ink)',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Acompanhar seu primeiro político {'>'}
          </Link>
        ) : (
          seguindo.map((p) => (
            <Link
              key={p.id}
              href={`/politicos/${p.slug}`}
              style={{
                border: '1px solid var(--border)',
                background: 'var(--surface)',
                padding: 10,
                textDecoration: 'none',
                display: 'grid',
                gridTemplateColumns: '34px 1fr auto',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {p.fotoUrl ? (
                <img
                  src={p.fotoUrl}
                  alt={p.nomeEleitoral}
                  width={34}
                  height={34}
                  style={{ width: 34, height: 34, borderRadius: 999, objectFit: 'cover', border: '1px solid var(--border)' }}
                />
              ) : (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 999,
                    background: corPorCargo(p.cargo),
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {iniciais(p.nomeEleitoral)}
                </div>
              )}

              <div>
                <div style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600 }}>{p.nomeEleitoral}</div>
                <div style={{ color: 'var(--ink-2)', fontSize: 11 }}>
                  {p.partido}-{p.uf}
                </div>
              </div>

              <div style={{ color: corPresenca(p.presencaPctAtual), fontSize: 11, fontWeight: 700 }}>
                {p.presencaPctAtual === null ? '--' : `${Math.round(p.presencaPctAtual)}%`}
              </div>
            </Link>
          ))
        )}
      </div>
    </Panel>
  )
}
