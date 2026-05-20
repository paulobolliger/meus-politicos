import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Candidatos 2026 | Meus Políticos',
  description: 'Quem vai concorrer nas eleições de 2026? Veja os candidatos a presidente, governadores, senadores e deputados.',
}

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  governador: 'Governador',
  senador: 'Senador',
  deputado_federal: 'Deputado Federal',
  deputado_estadual: 'Deputado Estadual',
}

const UFS = [
  'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG',
  'MS','MT','PA','PB','PE','PI','PR','RJ','RN','RO','RR',
  'RS','SC','SE','SP','TO',
]

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
    .eq('situacao', 'deferido')
    .order('nome_urna', { ascending: true })
    .range(offset, offset + porPagina - 1)

  if (cargo) query = query.eq('cargo', cargo)
  if (uf) query = query.eq('uf', uf)

  const { data: candidatos, count } = await query

  const totalPaginas = Math.ceil((count || 0) / porPagina)
  const qs = (extra: Record<string, string | null>) => {
    const p: Record<string, string> = {}
    if (cargo) p.cargo = cargo
    if (uf) p.uf = uf
    Object.entries(extra).forEach(([k, v]) => { if (v) p[k] = v; else delete p[k] })
    return Object.keys(p).length ? '?' + new URLSearchParams(p).toString() : ''
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '40px 20px' }}>
      <h1 className="mono" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#0a0e1a' }}>
        Candidatos 2026
      </h1>
      <p style={{ fontSize: 14, color: '#5a6478', marginBottom: 28, lineHeight: 1.6 }}>
        Eleições em outubro de 2026.{' '}
        {count != null && (
          <strong style={{ color: '#0a0e1a' }}>{count.toLocaleString('pt-BR')} candidatos deferidos</strong>
        )}
        {' '}registrados na Justiça Eleitoral.
      </p>

      {/* Filtro cargo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <Link href={`/candidatos-2026${qs({ cargo: null, pagina: null })}`} className="mono"
          style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${!cargo ? '#0a0e1a' : '#d1d5db'}`,
            color: !cargo ? '#0a0e1a' : '#6b7280', textDecoration: 'none', background: !cargo ? '#f1f5f9' : 'transparent' }}>
          Todos
        </Link>
        {Object.entries(CARGO_LABEL).map(([c, label]) => (
          <Link key={c} href={`/candidatos-2026${qs({ cargo: c, pagina: null })}`} className="mono"
            style={{ padding: '5px 12px', fontSize: 11, border: `1px solid ${cargo === c ? '#0a0e1a' : '#d1d5db'}`,
              color: cargo === c ? '#0a0e1a' : '#6b7280', textDecoration: 'none', background: cargo === c ? '#f1f5f9' : 'transparent' }}>
            {label}
          </Link>
        ))}
      </div>

      {/* Filtro UF */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 28 }}>
        <Link href={`/candidatos-2026${qs({ uf: null, pagina: null })}`} className="mono"
          style={{ padding: '3px 8px', fontSize: 10, border: `1px solid ${!uf ? '#2563eb' : '#e5e7eb'}`,
            color: !uf ? '#2563eb' : '#9ca3af', textDecoration: 'none' }}>
          BR
        </Link>
        {UFS.map((u) => (
          <Link key={u} href={`/candidatos-2026${qs({ uf: u, pagina: null })}`} className="mono"
            style={{ padding: '3px 8px', fontSize: 10, border: `1px solid ${uf === u ? '#2563eb' : '#e5e7eb'}`,
              color: uf === u ? '#2563eb' : '#9ca3af', textDecoration: 'none' }}>
            {u}
          </Link>
        ))}
      </div>

      {/* Grid de cards */}
      {!candidatos || candidatos.length === 0 ? (
        <div className="mono" style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 13 }}>
          Nenhum candidato encontrado para esta seleção.
          <br />
          <span style={{ fontSize: 11 }}>Execute o ETL para importar dados do TSE.</span>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          {candidatos.map((c) => {
            const partido = c.partidos as { sigla: string; nome: string } | null
            const politico = c.politicos as { id: string; slug: string } | null
            const href = politico ? `/politico/${politico.slug}` : null

            const card = (
              <div
                style={{
                  padding: '16px',
                  border: '1px solid #e5e7eb',
                  background: '#fff',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  cursor: href ? 'pointer' : 'default',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    className="mono"
                    style={{ fontSize: 9, color: '#6b7280', letterSpacing: '0.08em', textTransform: 'uppercase' }}
                  >
                    {CARGO_LABEL[c.cargo] || c.cargo} · {c.uf}
                  </span>
                  {partido && (
                    <span className="mono" style={{ fontSize: 9, color: '#2563eb', fontWeight: 700 }}>
                      {partido.sigla}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#0a0e1a', lineHeight: 1.3 }}>
                  {c.nome_urna || c.nome}
                </div>
                {politico && (
                  <div className="mono" style={{ fontSize: 9, color: '#16a34a', marginTop: 2 }}>
                    ✓ perfil no sistema
                  </div>
                )}
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

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {pagina > 1 && (
            <Link href={`/candidatos-2026${qs({ pagina: String(pagina - 1) })}`} className="mono"
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', fontSize: 12, textDecoration: 'none', color: '#374151' }}>
              ← Anterior
            </Link>
          )}
          <span className="mono" style={{ padding: '6px 14px', fontSize: 12, color: '#6b7280' }}>
            {pagina} / {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Link href={`/candidatos-2026${qs({ pagina: String(pagina + 1) })}`} className="mono"
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', fontSize: 12, textDecoration: 'none', color: '#374151' }}>
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
