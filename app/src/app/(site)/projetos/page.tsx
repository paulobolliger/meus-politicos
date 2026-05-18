import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Projetos de Lei | Meus Políticos',
  description: 'Acompanhe os projetos de lei em tramitação no Congresso Nacional em linguagem simples.',
}

const TIPO_LABEL: Record<string, string> = {
  PL: 'Projeto de Lei',
  PEC: 'Emenda Constitucional',
  PLP: 'Lei Complementar',
  PDL: 'Decreto Legislativo',
  MPV: 'Medida Provisória',
}

const SITUACAO_COR: Record<string, string> = {
  'Em tramitação': '#2563eb',
  'Aprovada': '#16a34a',
  'Arquivada': '#6b7280',
  'Vetada': '#dc2626',
}

function PillSituacao({ situacao }: { situacao: string | null }) {
  if (!situacao) return null
  const texto = situacao.length > 40 ? situacao.slice(0, 40) + '…' : situacao
  const cor = Object.entries(SITUACAO_COR).find(([k]) => situacao.toLowerCase().includes(k.toLowerCase()))?.[1] ?? '#6b7280'
  return (
    <span
      className="mono"
      style={{
        fontSize: 10,
        padding: '2px 7px',
        border: `1px solid ${cor}`,
        color: cor,
        letterSpacing: '0.06em',
        flexShrink: 0,
      }}
    >
      {texto}
    </span>
  )
}

export default async function ProjetosSitePage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string; pagina?: string }>
}) {
  const params = await searchParams
  const tipo = params.tipo?.toUpperCase() || null
  const pagina = Math.max(1, parseInt(params.pagina || '1', 10))
  const porPagina = 20
  const offset = (pagina - 1) * porPagina

  const supabase = await createClient()

  let query = supabase
    .from('proposicoes')
    .select('id, slug, tipo, numero, ano, ementa, ementa_simples, situacao, data_apresentacao', { count: 'exact' })
    .order('data_apresentacao', { ascending: false })
    .range(offset, offset + porPagina - 1)

  if (tipo) query = query.eq('tipo', tipo)

  const { data: projetos, count } = await query

  const totalPaginas = Math.ceil((count || 0) / porPagina)

  return (
    <div style={{ maxWidth: 780, margin: '0 auto', padding: '40px 20px' }}>
      <h1 className="mono" style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, color: '#0a0e1a' }}>
        Projetos de Lei
      </h1>
      <p style={{ fontSize: 14, color: '#5a6478', marginBottom: 28, lineHeight: 1.6 }}>
        Propostas em tramitação no Congresso Nacional.{' '}
        <Link href="/glossario/projeto-de-lei" style={{ color: '#2563eb', textDecoration: 'none' }}>
          O que é um PL?
        </Link>
      </p>

      {/* Filtros por tipo */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        <Link
          href="/projetos"
          className="mono"
          style={{
            padding: '5px 12px',
            fontSize: 11,
            border: `1px solid ${!tipo ? '#2563eb' : '#d1d5db'}`,
            color: !tipo ? '#2563eb' : '#6b7280',
            textDecoration: 'none',
            background: !tipo ? '#eff6ff' : 'transparent',
          }}
        >
          Todos
        </Link>
        {Object.entries(TIPO_LABEL).map(([t, label]) => (
          <Link
            key={t}
            href={`/projetos?tipo=${t}`}
            className="mono"
            style={{
              padding: '5px 12px',
              fontSize: 11,
              border: `1px solid ${tipo === t ? '#2563eb' : '#d1d5db'}`,
              color: tipo === t ? '#2563eb' : '#6b7280',
              textDecoration: 'none',
              background: tipo === t ? '#eff6ff' : 'transparent',
            }}
          >
            {t}
          </Link>
        ))}
      </div>

      {/* Lista */}
      {!projetos || projetos.length === 0 ? (
        <div
          className="mono"
          style={{ textAlign: 'center', color: '#9ca3af', padding: '60px 0', fontSize: 13 }}
        >
          Nenhum projeto encontrado.
          <br />
          <span style={{ fontSize: 11 }}>Execute o ETL para importar dados da Câmara.</span>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {projetos.map((p) => (
            <div
              key={p.id}
              style={{
                padding: '16px 18px',
                border: '1px solid #e5e7eb',
                background: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 6 }}>
                <span
                  className="mono"
                  style={{
                    fontSize: 10,
                    padding: '2px 7px',
                    background: '#f1f5f9',
                    color: '#475569',
                    flexShrink: 0,
                  }}
                >
                  {p.tipo} {p.numero}/{p.ano}
                </span>
                <PillSituacao situacao={p.situacao} />
              </div>
              <p style={{ fontSize: 14, color: '#1e293b', lineHeight: 1.5, margin: '0 0 4px' }}>
                {p.ementa_simples || p.ementa || 'Sem descrição disponível.'}
              </p>
              {p.data_apresentacao && (
                <span className="mono" style={{ fontSize: 10, color: '#9ca3af' }}>
                  Apresentado em {new Date(p.data_apresentacao).toLocaleDateString('pt-BR')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginação */}
      {totalPaginas > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
          {pagina > 1 && (
            <Link
              href={`/projetos?${tipo ? `tipo=${tipo}&` : ''}pagina=${pagina - 1}`}
              className="mono"
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', fontSize: 12, textDecoration: 'none', color: '#374151' }}
            >
              ← Anterior
            </Link>
          )}
          <span className="mono" style={{ padding: '6px 14px', fontSize: 12, color: '#6b7280' }}>
            {pagina} / {totalPaginas}
          </span>
          {pagina < totalPaginas && (
            <Link
              href={`/projetos?${tipo ? `tipo=${tipo}&` : ''}pagina=${pagina + 1}`}
              className="mono"
              style={{ padding: '6px 14px', border: '1px solid #d1d5db', fontSize: 12, textDecoration: 'none', color: '#374151' }}
            >
              Próxima →
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
