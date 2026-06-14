import Link from 'next/link'
import Image from 'next/image'

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
  tipo?: 'voto' | 'seguir'
  gastos30d?: number
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
  if (valor === null) return 'var(--ink-3)'
  if (valor > 85) return 'var(--pos)'
  if (valor >= 70) return 'var(--warn)'
  return 'var(--neg)'
}

export function SeguindoList({ seguindo }: { seguindo: SeguidoPolitico[] }) {
  const meusVotos = seguindo.filter((p) => p.tipo === 'voto')
  const monitorados = seguindo.filter((p) => p.tipo === 'seguir' || !p.tipo)

  const renderPoliticoItem = (p: SeguidoPolitico, isVoto: boolean) => (
    <Link
      key={p.id}
      href={`/painel/politicos/${p.slug}`}
      className="politico-seguido-item"
      style={{
        padding: '10px 12px',
        textDecoration: 'none',
        display: 'grid',
        gridTemplateColumns: '34px 1fr auto',
        gap: 10,
        alignItems: 'center',
        position: 'relative',
      }}
    >
      {p.fotoUrl ? (
        <Image
          src={p.fotoUrl}
          alt={p.nomeEleitoral}
          width={34}
          height={34}
          unoptimized
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
        <div style={{ color: 'var(--ink)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
          {p.nomeEleitoral}
          {isVoto && <span title="Meu Voto" style={{ color: '#F59E0B', fontSize: 12 }}>⭐️</span>}
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2 }}>
          <span style={{ color: 'var(--ink-3)', fontSize: 10.5 }}>
            {p.partido}-{p.uf}
          </span>
          {p.gastos30d !== undefined && (
            <>
              <span style={{ color: 'var(--line-strong)', fontSize: 10.5 }}>·</span>
              <span style={{ color: 'var(--brand-2)', fontSize: 10.5, fontWeight: 600 }} title="Gastos nos últimos 30 dias">
                {p.gastos30d.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}
              </span>
            </>
          )}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ color: corPresenca(p.presencaPctAtual), fontSize: 11, fontWeight: 700 }}>
          {p.presencaPctAtual === null ? '--' : `${Math.round(p.presencaPctAtual)}%`}
        </div>
        <div style={{ fontSize: 8.5, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginTop: 1, letterSpacing: '0.04em' }}>
          PRESENÇA
        </div>
      </div>
    </Link>
  )

  return (
    <Panel>
      <PanelHeader
        title={`PAINEL DE ACOMPANHAMENTO`}
        action={
          <Link href="/painel/meus-politicos" style={{ color: 'var(--brand)', textDecoration: 'none', fontSize: 11 }}>
            GERENCIAR {'>'}
          </Link>
        }
      />

      <div style={{ padding: 12, display: 'grid', gap: 14 }}>
        {/* Seção Meu Voto */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#F59E0B', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            <span>⭐️</span> Meu Voto ({meusVotos.length})
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {meusVotos.length === 0 ? (
              <div
                style={{
                  border: '1px dashed var(--border)',
                  background: 'rgba(30, 41, 59, 0.3)',
                  padding: '12px 14px',
                  color: 'var(--ink-2)',
                  fontSize: 11.5,
                  lineHeight: 1.5,
                }}
              >
                Marque a estrela <strong style={{ color: '#F59E0B' }}>⭐️ &quot;Meu Voto&quot;</strong> na ficha de um político para monitorá-lo com destaque.
              </div>
            ) : (
              meusVotos.map((p) => renderPoliticoItem(p, true))
            )}
          </div>
        </div>

        {/* Seção Monitorados */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--ink-2)', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            <span>👁️</span> Monitorando ({monitorados.length})
          </div>

          <div style={{ display: 'grid', gap: 6 }}>
            {monitorados.length === 0 ? (
              <Link
                href="/busca"
                style={{
                  border: '1px dashed var(--border)',
                  background: 'var(--surface)',
                  padding: 14,
                  color: 'var(--brand)',
                  fontSize: 12,
                  textDecoration: 'none',
                  textAlign: 'center',
                  fontWeight: 600,
                }}
              >
                Acompanhar político geral +
              </Link>
            ) : (
              monitorados.map((p) => renderPoliticoItem(p, false))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .politico-seguido-item {
          border: 1px solid var(--line);
          background: rgba(30, 41, 59, 0.2);
          border-radius: 8px;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .politico-seguido-item:hover {
          background: rgba(30, 41, 59, 0.35);
          border-color: var(--line-strong);
          transform: translateX(3px);
        }
      `}</style>
    </Panel>
  )
}
