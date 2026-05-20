import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projetos de Lei | App Meus Políticos',
}

const TIPO_LABEL: Record<string, string> = {
  PL: 'PL',
  PEC: 'PEC',
  PLP: 'PLP',
  PDL: 'PDL',
  MPV: 'MPV',
}

export default async function ProjetosAppPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; autor?: string; pagina?: string }>
}) {
  const params = await searchParams
  const tipo = params.tipo?.toUpperCase() || null
  const autorId = params.autor || null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const porPagina = 30
  const offset = (pagina - 1) * porPagina

  const supabase = await createClient()

  let query = supabase
    .from('proposicoes')
    .select(
      `id, slug, tipo, numero, ano, ementa, situacao, casa_origem, data_apresentacao, link_camara,
       proposicao_autores(nome, cargo, partido, uf, politico_id)`,
      { count: 'exact' },
    )
    .order('data_apresentacao', { ascending: false })
    .range(offset, offset + porPagina - 1)

  if (tipo) query = query.eq('tipo', tipo)
  if (autorId) {
    query = query.eq('proposicao_autores.politico_id', autorId)
  }

  const { data: projetos, count } = await query

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1100 }}>
      <div style={{ marginBottom: 20 }}>
        <h1 className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink-1)', marginBottom: 4 }}>
          Proposições Legislativas
        </h1>
        <p className="mono" style={{ fontSize: 11, color: 'var(--mute)' }}>
          {count?.toLocaleString('pt-BR') ?? '–'} proposições indexadas · Câmara dos Deputados
        </p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <Link
          href="/projetos"
          className="mono"
          style={{
            padding: '4px 10px',
            fontSize: 10,
            border: `1px solid ${!tipo ? 'var(--brand-2)' : 'var(--line)'}`,
            color: !tipo ? 'var(--brand-2)' : 'var(--ink-3)',
            textDecoration: 'none',
            background: !tipo ? 'var(--brand-soft)' : 'transparent',
            letterSpacing: '0.06em',
          }}
        >
          TODOS
        </Link>
        {Object.keys(TIPO_LABEL).map((t) => (
          <Link
            key={t}
            href={`/projetos?tipo=${t}`}
            className="mono"
            style={{
              padding: '4px 10px',
              fontSize: 10,
              border: `1px solid ${tipo === t ? 'var(--brand-2)' : 'var(--line)'}`,
              color: tipo === t ? 'var(--brand-2)' : 'var(--ink-3)',
              textDecoration: 'none',
              background: tipo === t ? 'var(--brand-soft)' : 'transparent',
              letterSpacing: '0.06em',
            }}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* Tabela */}
      {!projetos || projetos.length === 0 ? (
        <div
          className="mono"
          style={{ color: 'var(--mute)', fontSize: 12, padding: '40px 0', textAlign: 'center' }}
        >
          Sem dados.{' '}
          <span style={{ fontSize: 10 }}>Execute: python etl/camara/collect_proposicoes.py</span>
        </div>
      ) : (
        <div style={{ border: '1px solid var(--line)', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--line)', background: 'var(--panel)' }}>
                {['Tipo', 'Número', 'Ano', 'Ementa', 'Autores', 'Situação', 'Data', 'Link'].map((h) => (
                  <th
                    key={h}
                    className="mono"
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      fontSize: 9,
                      letterSpacing: '0.1em',
                      color: 'var(--mute)',
                      fontWeight: 600,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {projetos.map((p, i) => {
                const autores = Array.isArray(p.proposicao_autores) ? p.proposicao_autores : []
                return (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--line)',
                      background: i % 2 === 0 ? 'var(--bg)' : 'var(--panel)',
                    }}
                  >
                    <td className="mono" style={{ padding: '8px 12px', fontSize: 10, whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>
                      {p.tipo}
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', fontSize: 10, whiteSpace: 'nowrap', color: 'var(--ink-2)' }}>
                      {p.numero}
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', fontSize: 10, whiteSpace: 'nowrap', color: 'var(--mute)' }}>
                      {p.ano}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: 'var(--ink-1)', maxWidth: 340 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.ementa || '–'}
                      </span>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 11, color: 'var(--ink-2)', whiteSpace: 'nowrap' }}>
                      {autores.slice(0, 2).map((a: { politico_id?: string; nome: string; partido?: string; uf?: string }, idx: number) =>
                        a.politico_id ? (
                          <Link key={idx} href={`/politicos/${a.politico_id}`} style={{ color: 'var(--brand-2)', textDecoration: 'none', display: 'block', fontSize: 10 }}>
                            {a.nome} {a.partido ? `(${a.partido})` : ''}
                          </Link>
                        ) : (
                          <span key={idx} style={{ display: 'block', fontSize: 10, color: 'var(--mute)' }}>
                            {a.nome}
                          </span>
                        ),
                      )}
                      {autores.length > 2 && (
                        <span className="mono" style={{ fontSize: 9, color: 'var(--mute)' }}>
                          +{autores.length - 2} autores
                        </span>
                      )}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 10, color: 'var(--mute)', maxWidth: 160 }}>
                      <span style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {p.situacao || '–'}
                      </span>
                    </td>
                    <td className="mono" style={{ padding: '8px 12px', fontSize: 10, whiteSpace: 'nowrap', color: 'var(--mute)' }}>
                      {p.data_apresentacao ? new Date(p.data_apresentacao).toLocaleDateString('pt-BR') : '–'}
                    </td>
                    <td style={{ padding: '8px 12px' }}>
                      {p.link_camara && (
                        <a
                          href={p.link_camara}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mono"
                          style={{ fontSize: 10, color: 'var(--brand-2)', textDecoration: 'none' }}
                        >
                          Câmara ↗
                        </a>
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
        <div style={{ display: 'flex', gap: 6, marginTop: 20, justifyContent: 'flex-end' }}>
          {pagina > 1 && (
            <Link
              href={`/projetos?${tipo ? `tipo=${tipo}&` : ''}pagina=${pagina - 1}`}
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
              href={`/projetos?${tipo ? `tipo=${tipo}&` : ''}pagina=${pagina + 1}`}
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
