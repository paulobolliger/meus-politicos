import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Candidatos 2026 | App Meus Políticos',
}

const CARGO_LABEL: Record<string, string> = {
  presidente: 'Presidente',
  governador: 'Governador',
  senador: 'Senador',
  deputado_federal: 'Dep. Federal',
  deputado_estadual: 'Dep. Estadual',
}

const SITUACAO_COR: Record<string, string> = {
  deferido: '#16a34a',
  indeferido: '#dc2626',
  cassado: '#dc2626',
  pendente: '#d97706',
}

export default async function Candidatos2026AppPage({
  searchParams,
}: {
  searchParams: Promise<{ cargo?: string; uf?: string; partido?: string; pagina?: string }>
}) {
  const params = await searchParams
  const cargo = params.cargo || null
  const uf = params.uf?.toUpperCase() || null
  const partido = params.partido?.toUpperCase() || null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const porPagina = 50
  const offset = (pagina - 1) * porPagina

  const supabase = await createClient()

  let query = supabase
    .from('candidatos')
    .select(
      `id, nome, nome_urna, cargo, uf, situacao, genero, cor_raca, bens_declarados,
       partidos(sigla),
       politicos(id, slug, presenca_pct_atual, gasto_total_ano)`,
      { count: 'exact' },
    )
    .eq('eleicao_ano', 2026)
    .order('nome_urna', { ascending: true })
    .range(offset, offset + porPagina - 1)

  if (cargo) query = query.eq('cargo', cargo)
  if (uf) query = query.eq('uf', uf)

  const { data: candidatos, count } = await query

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1200 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 4 }}>
          Candidatos 2026
        </h1>
        <p className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>
          {count?.toLocaleString('pt-BR') ?? '–'} candidatos · eleições outubro/2026
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        {Object.entries(CARGO_LABEL).map(([c, label]) => (
          <Link
            key={c}
            href={`/candidatos-2026?${cargo !== c ? `cargo=${c}` : ''}${uf ? `&uf=${uf}` : ''}`}
            className="mono"
            style={{
              padding: '4px 10px',
              fontSize: 10,
              border: `1px solid ${cargo === c ? 'var(--brand-2)' : 'var(--line)'}`,
              color: cargo === c ? 'var(--brand-2)' : 'var(--ink-3)',
              textDecoration: 'none',
              background: cargo === c ? 'var(--brand-soft)' : 'transparent',
              letterSpacing: '0.06em',
            }}
          >
            {label.toUpperCase()}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      {!candidatos || candidatos.length === 0 ? (
        <div className="mono" style={{ color: 'var(--mute)', fontSize: 12, padding: '40px 0', textAlign: 'center' }}>
          Sem dados. Execute: python etl/tse/collect_candidatos_2026.py
        </div>
      ) : (
        <div style={{ border: '1px solid var(--line)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
                {['Nome urna', 'Cargo', 'UF', 'Partido', 'Situação', 'Gênero', 'Cor/Raça', 'Bens (R$)', 'Presença%', 'Perfil'].map((h) => (
                  <th
                    key={h}
                    className="mono"
                    style={{ padding: '8px 10px', textAlign: 'left', fontSize: 9, letterSpacing: '0.1em', color: 'var(--mute)', fontWeight: 600, whiteSpace: 'nowrap' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {candidatos.map((c, i) => {
                const siglaPartido = (c.partidos as { sigla: string } | null)?.sigla ?? '–'
                const politico = c.politicos as { id: string; slug: string; presenca_pct_atual: number | null; gasto_total_ano: number | null } | null
                return (
                  <tr
                    key={c.id}
                    style={{ borderBottom: '1px solid var(--line)', background: i % 2 === 0 ? 'var(--bg)' : 'var(--panel)' }}
                  >
                    <td style={{ padding: '7px 10px', fontSize: 12, color: 'var(--ink-1)', fontWeight: 500 }}>
                      {c.nome_urna || c.nome}
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {CARGO_LABEL[c.cargo] || c.cargo}
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--mute)' }}>
                      {c.uf}
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--brand-2)', fontWeight: 700 }}>
                      {siglaPartido}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      <span
                        className="mono"
                        style={{
                          fontSize: 9,
                          color: SITUACAO_COR[c.situacao || 'pendente'] || '#6b7280',
                          letterSpacing: '0.06em',
                        }}
                      >
                        {c.situacao || 'pendente'}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--mute)' }}>
                      {c.genero?.slice(0, 4) ?? '–'}
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--mute)' }}>
                      {c.cor_raca ?? '–'}
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--ink-2)', textAlign: 'right' }}>
                      {c.bens_declarados != null
                        ? c.bens_declarados.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
                        : '–'}
                    </td>
                    <td className="mono" style={{ padding: '7px 10px', fontSize: 10, color: 'var(--ink-2)', textAlign: 'right' }}>
                      {politico?.presenca_pct_atual != null ? `${politico.presenca_pct_atual.toFixed(0)}%` : '–'}
                    </td>
                    <td style={{ padding: '7px 10px' }}>
                      {politico ? (
                        <Link
                          href={`/politicos/${politico.id}`}
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--brand-2)', textDecoration: 'none' }}
                        >
                          ver →
                        </Link>
                      ) : (
                        <span className="mono" style={{ fontSize: 9, color: 'var(--mute)' }}>–</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 16, justifyContent: 'flex-end' }}>
          {pagina > 1 && (
            <Link
              href={`/candidatos-2026?${cargo ? `cargo=${cargo}&` : ''}${uf ? `uf=${uf}&` : ''}pagina=${pagina - 1}`}
              className="mono"
              style={{ padding: '5px 12px', border: '1px solid var(--line)', fontSize: 10, textDecoration: 'none', color: 'var(--ink-3)' }}
            >
              ← ANTERIOR
            </Link>
          )}
          <span className="mono" style={{ padding: '5px 12px', fontSize: 10, color: 'var(--mute)' }}>
            {pagina} / {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Link
              href={`/candidatos-2026?${cargo ? `cargo=${cargo}&` : ''}${uf ? `uf=${uf}&` : ''}pagina=${pagina + 1}`}
              className="mono"
              style={{ padding: '5px 12px', border: '1px solid var(--line)', fontSize: 10, textDecoration: 'none', color: 'var(--ink-3)' }}
            >
              PRÓXIMA →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
