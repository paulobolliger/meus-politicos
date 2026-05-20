import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Candidatos 2026 | Meus Políticos',
  description: 'Quem vai concorrer nas eleições de outubro de 2026? Veja os candidatos registrados no TSE.',
}

type CargoCandidato = 'presidente' | 'governador' | 'senador' | 'deputado_federal' | 'deputado_estadual'

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  vice_presidente: 'Vice-Presidente',
  governador: 'Governador',
  vice_governador: 'Vice-Governador',
  senador: 'Senador',
  deputado_federal: 'Dep. Federal',
  deputado_estadual: 'Dep. Estadual',
  prefeito: 'Prefeito',
  vice_prefeito: 'Vice-Prefeito',
  vereador: 'Vereador',
}

// Major cargo filter options shown in UI
const CARGO_FILTROS: { k: string; l: string }[] = [
  { k: 'presidente', l: 'Presidente' },
  { k: 'governador', l: 'Governador' },
  { k: 'senador', l: 'Senador' },
  { k: 'deputado_federal', l: 'Dep. Federal' },
  { k: 'deputado_estadual', l: 'Dep. Estadual' },
]

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG',
  'MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR',
  'RS','SC','SE','SP','TO',
]

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
}

const AVATAR_PALETTE = [
  '#1d3a8a', '#5b21b6', '#065f46', '#92400e',
  '#1e3a5f', '#7c2d12', '#164e63', '#3b0764',
]

function avatarBg(name: string) {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) & 0xffffffff
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length]
}

const SITUACAO_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  deferido:  { bg: 'var(--pos-soft)',  color: 'var(--pos)',  label: '✓ Deferida'  },
  indeferido:{ bg: 'var(--neg-soft)',  color: 'var(--neg)',  label: '✗ Indeferida' },
  pendente:  { bg: 'var(--warn-soft)', color: 'var(--warn)', label: 'Pendente'    },
}

export default async function Candidatos2026Page({
  searchParams,
}: {
  searchParams: Promise<{ cargo?: string; uf?: string; pagina?: string }>
}) {
  const params = await searchParams
  const cargo = params.cargo || null
  const uf = params.uf?.toUpperCase() || null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const porPagina = 24
  const offset = (pagina - 1) * porPagina

  const supabase = await createClient()

  let query = supabase
    .from('candidatos')
    .select(
      `id, nome, nome_urna, slug, cargo, uf, situacao, genero, cor_raca,
       partidos(sigla, nome),
       politicos(id, slug)`,
      { count: 'exact' },
    )
    .eq('eleicao_ano', 2026)
    .order('nome_urna', { ascending: true })
    .range(offset, offset + porPagina - 1)

  if (cargo) query = query.eq('cargo', cargo as CargoCandidato)
  if (uf) query = query.eq('uf', uf)

  const { data: candidatos, count } = await query

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  const qs = (extra: Record<string, string | null>) => {
    const p: Record<string, string> = {}
    if (cargo) p.cargo = cargo
    if (uf) p.uf = uf
    Object.entries(extra).forEach(([k, v]) => { if (v != null) p[k] = v; else delete p[k] })
    return Object.keys(p).length ? '?' + new URLSearchParams(p).toString() : ''
  }

  const chipBase: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    height: 32,
    padding: '0 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 500,
    textDecoration: 'none',
    whiteSpace: 'nowrap',
    transition: 'all 0.1s ease',
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      {/* ── Hero ── */}
      <section
        style={{
          background: 'linear-gradient(160deg, #1a0a00 0%, #3d1200 50%, #1d3a8a 100%)',
          padding: '56px 24px 40px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse 60% 80% at 80% 20%, rgba(251,191,36,0.12), transparent)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 1200, margin: '0 auto', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 999, background: 'rgba(251,191,36,0.18)', border: '1px solid rgba(251,191,36,0.4)', marginBottom: 16 }}>
            <span style={{ fontSize: 12 }}>⚡</span>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: '#fde68a' }}>ELEIÇÕES 2026 · OUTUBRO</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5.5vw, 58px)', lineHeight: 1.08, letterSpacing: '-0.03em', color: '#fff', fontFamily: 'var(--font-display)' }}>
            Quem vai disputar as eleições de 2026?
          </h1>
          <p style={{ marginTop: 12, fontSize: 15, color: 'rgba(255,255,255,0.7)', maxWidth: 600 }}>
            Candidatos registrados no TSE com situação atualizada.
            {count != null && (
              <> <strong style={{ color: '#fde68a' }}>{count.toLocaleString('pt-BR')} candidatos</strong> encontrados.</>
            )}
          </p>
        </div>
      </section>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        {/* ── Filtros ── */}
        <div style={{ padding: '20px 0 0', borderBottom: '1px solid var(--line-soft)' }}>
          {/* Cargo */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', marginRight: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Cargo</span>
            <Link href={`/candidatos-2026${qs({ cargo: null, pagina: null })}`}
              style={{ ...chipBase, background: !cargo ? 'var(--ink)' : 'var(--panel)', color: !cargo ? 'var(--bg)' : 'var(--ink-2)', border: `1px solid ${!cargo ? 'var(--ink)' : 'var(--line)'}` }}>
              Todos
            </Link>
            {CARGO_FILTROS.map(({ k, l }) => (
              <Link key={k} href={`/candidatos-2026${qs({ cargo: k, pagina: null })}`}
                style={{ ...chipBase, background: cargo === k ? 'var(--ink)' : 'var(--panel)', color: cargo === k ? 'var(--bg)' : 'var(--ink-2)', border: `1px solid ${cargo === k ? 'var(--ink)' : 'var(--line)'}` }}>
                {l}
              </Link>
            ))}
          </div>

          {/* UF */}
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', paddingBottom: 16, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: 'var(--ink-3)', marginRight: 4, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Estado</span>
            <Link href={`/candidatos-2026${qs({ uf: null, pagina: null })}`}
              style={{ ...chipBase, height: 26, padding: '0 10px', fontSize: 11, background: !uf ? 'var(--ink)' : 'var(--panel)', color: !uf ? 'var(--bg)' : 'var(--ink-3)', border: `1px solid ${!uf ? 'var(--ink)' : 'var(--line)'}` }}>
              BR
            </Link>
            {UFS.map((u) => (
              <Link key={u} href={`/candidatos-2026${qs({ uf: u, pagina: null })}`}
                style={{ ...chipBase, height: 26, padding: '0 10px', fontSize: 11, background: uf === u ? 'var(--ink)' : 'var(--panel)', color: uf === u ? 'var(--bg)' : 'var(--ink-3)', border: `1px solid ${uf === u ? 'var(--ink)' : 'var(--line)'}` }}>
                {u}
              </Link>
            ))}
          </div>
        </div>

        {/* ── Nota neutralidade ── */}
        <div style={{ margin: '20px 0', padding: '12px 16px', background: 'var(--warn-soft)', borderLeft: '3px solid var(--warn)', borderRadius: '0 6px 6px 0', display: 'flex', gap: 10 }}>
          <span>⚠️</span>
          <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: 'var(--ink-2)' }}>
            <strong>Nota de neutralidade.</strong> Os dados são da Justiça Eleitoral (TSE).
            A plataforma <strong>não avalia, ranqueia ou recomenda</strong> candidatos.
          </p>
        </div>

        {/* ── Grid ── */}
        {!candidatos || candidatos.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0' }}>
            <div style={{ fontSize: 48, marginBottom: 14 }}>🗳️</div>
            <p style={{ fontSize: 16, color: 'var(--ink-3)', fontWeight: 500 }}>Nenhum candidato encontrado.</p>
            <p style={{ fontSize: 13, color: 'var(--mute)', marginTop: 6 }}>Execute o ETL TSE para importar os dados.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12, paddingTop: 8, paddingBottom: 40 }}>
            {candidatos.map((c) => {
              const partido = c.partidos as { sigla: string; nome: string } | null
              const politico = c.politicos as { id: string; slug: string } | null
              const href = politico ? `/politicos/${politico.slug}` : null
              const nome = c.nome_urna || c.nome
              const sit = SITUACAO_STYLE[c.situacao?.toLowerCase() ?? '']
                ?? { bg: 'var(--bg-2)', color: 'var(--ink-3)', label: c.situacao ?? '—' }

              const card = (
                <div
                  style={{
                    background: 'var(--panel)',
                    borderRadius: 10,
                    padding: 14,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 1px 8px rgba(0,0,0,0.03)',
                    cursor: href ? 'pointer' : 'default',
                    transition: 'box-shadow 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%',
                      background: avatarBg(nome),
                      color: '#fff', fontSize: 15, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                      fontFamily: 'var(--font-display)',
                    }}>
                      {initials(nome)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {nome}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {c.nome}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--brand-soft)', color: 'var(--brand)', fontWeight: 600 }}>
                      {CARGO_LABEL[c.cargo] ?? c.cargo}
                    </span>
                    {partido && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-2)', color: 'var(--ink-2)', fontWeight: 600 }}>
                        {partido.sigla}
                      </span>
                    )}
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: 'var(--bg-2)', color: 'var(--ink-3)' }}>
                      {c.uf}
                    </span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 999, background: sit.bg, color: sit.color, fontWeight: 600 }}>
                      {sit.label}
                    </span>
                    {href && <span style={{ fontSize: 11, color: 'var(--brand-2)', fontWeight: 600 }}>Ver perfil →</span>}
                  </div>
                </div>
              )

              return href ? (
                <Link key={c.id} href={href} style={{ textDecoration: 'none' }}>
                  {card}
                </Link>
              ) : (
                <div key={c.id}>{card}</div>
              )
            })}
          </div>
        )}

        {/* ── Paginação ── */}
        {totalPaginas > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 48, flexWrap: 'wrap' }}>
            {pagina > 1 && (
              <Link href={`/candidatos-2026${qs({ pagina: String(pagina - 1) })}`}
                style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, textDecoration: 'none', color: 'var(--ink-2)', background: 'var(--panel)' }}>
                ← Anterior
              </Link>
            )}
            {Array.from({ length: totalPaginas }, (_, i) => i + 1)
              .slice(Math.max(0, pagina - 3), Math.max(0, pagina - 3) + 5)
              .map((p) => (
                <Link key={p} href={`/candidatos-2026${qs({ pagina: String(p) })}`}
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 34, height: 34, borderRadius: 6, border: `1px solid ${p === pagina ? 'var(--ink)' : 'var(--line)'}`, fontSize: 13, textDecoration: 'none', color: p === pagina ? 'var(--bg)' : 'var(--ink-2)', background: p === pagina ? 'var(--ink)' : 'var(--panel)', fontWeight: p === pagina ? 700 : 400 }}>
                  {p}
                </Link>
              ))}
            {pagina < totalPaginas && (
              <Link href={`/candidatos-2026${qs({ pagina: String(pagina + 1) })}`}
                style={{ display: 'inline-flex', alignItems: 'center', height: 34, padding: '0 14px', borderRadius: 6, border: '1px solid var(--line)', fontSize: 13, textDecoration: 'none', color: 'var(--ink-2)', background: 'var(--panel)' }}>
                Próxima →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
