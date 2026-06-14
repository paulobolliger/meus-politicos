import { getEstado } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPgPool } from '@/lib/db/pool'

export const revalidate = 86400

// ─── Static params ──────────────────────────────────────────────────────────
export function generateStaticParams() {
  return []
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string; slug_cidade: string }> }
): Promise<Metadata> {
  const { sigla, slug_cidade } = await params
  const siglaUp = sigla.toUpperCase()
  const pool = getPgPool()
  const res = await pool.query<{ nome: string; uf: string }>(
    `SELECT nome, uf FROM municipios WHERE slug = $1 AND UPPER(uf) = $2 LIMIT 1`,
    [slug_cidade, siglaUp]
  )
  const city = res.rows[0]
  if (!city) return { title: 'Cidade não encontrada' }
  return {
    title: `${city.nome} (${city.uf}) — Executivo Municipal | Meus Políticos`,
    description: `Prefeito(a), saúde fiscal (SICONFI), demografia e dados de transparência de ${city.nome} (${city.uf}).`,
    other: {
      'geo.region': `BR-${siglaUp}`,
      'geo.placename': `${city.nome}, ${city.uf}`,
    },
    openGraph: {
      title: `${city.nome} (${city.uf}) — Gestão Municipal`,
      description: `Balanço contábil, população e dados de transparência de ${city.nome} (${city.uf}).`,
      type: 'website',
    },
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmtBrl(v: number | null | undefined): string {
  if (v == null) return '—'
  if (Math.abs(v) >= 1_000_000_000) return `R$ ${(v / 1_000_000_000).toFixed(2).replace('.', ',')}bi`
  if (Math.abs(v) >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1).replace('.', ',')}mi`
  return `R$ ${v.toLocaleString('pt-BR')}`
}

function fmtNum(v: number | null | undefined): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR')
}

function calcIdade(dataNasc: string | null): number | null {
  if (!dataNasc) return null
  const nasc = new Date(dataNasc)
  const hoje = new Date()
  let idade = hoje.getFullYear() - nasc.getFullYear()
  const mesPassou = hoje.getMonth() > nasc.getMonth() ||
    (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate())
  if (!mesPassou) idade--
  return idade
}

const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#f59e0b', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', PSOL: '#ec4899', REDE: '#10b981',
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function CidadePage(
  { params }: { params: Promise<{ sigla: string; slug_cidade: string }> }
) {
  const { sigla, slug_cidade } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPgPool()

  // Fetch city info
  const cityRes = await pool.query<{
    id: string
    nome: string
    uf: string
    populacao: number | null
    area_km2: number | null
    densidade_demografica: number | null
    pib: number | null
    pib_per_capita: number | null
    codigo_ibge: number
  }>(
    `SELECT id, nome, uf, populacao, area_km2::float8 as area_km2, densidade_demografica::float8 as densidade_demografica, pib::float8 as pib, pib_per_capita::float8 as pib_per_capita, codigo_ibge 
     FROM municipios 
     WHERE slug = $1 AND UPPER(uf) = $2 
     LIMIT 1`,
    [slug_cidade, siglaUp]
  )

  const city = cityRes.rows[0]
  if (!city) notFound()

  // Fetch SICONFI finances
  const finRes = await pool.query<{
    receitas_realizadas: number | null
    despesas_liquidadas: number | null
    resultado_orcamentario: number | null
    situacao: string | null
    ano: number
  }>(
    `SELECT receitas_realizadas::float8 as receitas_realizadas, despesas_liquidadas::float8 as despesas_liquidadas, resultado_orcamentario::float8 as resultado_orcamentario, situacao, ano 
     FROM municipios_financas 
     WHERE municipio_ibge = $1 
     ORDER BY ano DESC 
     LIMIT 1`,
    [city.codigo_ibge]
  )
  const finances = finRes.rows[0]

  // Fetch Prefeito
  const prefRes = await pool.query<{
    id: string
    nome: string
    nome_civil: string | null
    slug: string
    foto_url: string | null
    sexo: string | null
    data_nascimento: Date | null
    naturalidade: string | null
    escolaridade: string | null
    ocupacao: string | null
    email: string | null
    gabinete_nome: string | null
    gabinete_telefone: string | null
    gabinete_email: string | null
    mandato_inicio: Date | null
    mandato_fim: Date | null
    numero_mandato: number | null
    partido: string | null
    partido_nome: string | null
  }>(
    `SELECT p.id, p.nome, p.nome_civil, p.slug, p.foto_url, p.sexo, p.data_nascimento,
            p.naturalidade, p.escolaridade, p.ocupacao, p.email, p.gabinete_nome,
            p.gabinete_telefone, p.gabinete_email, p.mandato_inicio, p.mandato_fim, p.numero_mandato,
            pt.sigla AS partido, pt.nome AS partido_nome
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.municipio_id = $1 AND p.cargo = 'prefeito' AND p.removido_em IS NULL
     LIMIT 1`,
    [city.id]
  )
  const prefeito = prefRes.rows[0]

  const cor = cfg.cor
  const pCor = prefeito && prefeito.partido ? (PARTIDO_COR[prefeito.partido] ?? '#64748b') : '#64748b'
  const inicial = prefeito ? prefeito.nome.charAt(0) : ''
  const idade = prefeito && prefeito.data_nascimento ? calcIdade(prefeito.data_nascimento.toISOString()) : null

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'City',
    'name': city.nome,
    'description': `Executivo municipal, dados de população, PIB e informações de transparência fiscal de ${city.nome} (${city.uf}).`,
    'containedInPlace': {
      '@type': 'AdministrativeArea',
      'name': cfg.nome,
      'alternateName': siglaUp
    },
    'address': {
      '@type': 'PostalAddress',
      'addressLocality': city.nome,
      'addressRegion': city.uf,
      'addressCountry': 'BR'
    }
  }

  return (
    <div className="cidade-detail-page" style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '32px 32px 72px', boxSizing: 'border-box', overflowX: 'clip' }}>
      <style>{`
        .cidade-detail-page,
        .cidade-detail-page * {
          box-sizing: border-box;
        }
      `}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Breadcrumb */}
      <nav style={{
        display: 'flex', alignItems: 'center', gap: 6,
        fontSize: 13, color: 'var(--ink-3)', marginBottom: 28, flexWrap: 'wrap',
      }}>
        {[
          { label: 'Início', href: '/' },
          { label: 'Estados', href: '/estado' },
          { label: cfg.nome, href: `/estado/${sigla}` },
        ].map(b => (
          <span key={b.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Link href={b.href} style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.15s' }} className="hover-link">{b.label}</Link>
            <span>/</span>
          </span>
        ))}
        <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{city.nome}</span>
      </nav>

      {/* Header/Title Banner */}
      <div style={{
        background: 'var(--panel)', border: '1px solid var(--line)',
        borderRadius: 16, padding: '32px 36px', marginBottom: 32,
        position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: 6, background: cor }} />
        <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: 'var(--ink-3)', textTransform: 'uppercase' }}>
          Município de {city.nome} · {siglaUp}
        </span>
        <h1 style={{
          fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, margin: '8px 0 16px',
          color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)'
        }}>
          Poder Executivo Municipal
        </h1>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href={`/estado/${sigla}/${slug_cidade}/camara`} style={{
            background: 'var(--bg)', border: '1px solid var(--line)',
            color: 'var(--ink-2)', padding: '8px 16px', borderRadius: 8,
            fontSize: 13, fontWeight: 600, textDecoration: 'none',
            display: 'inline-flex', alignItems: 'center', gap: 6,
            transition: 'border-color 0.15s, transform 0.15s'
          }} className="btn-action">
            🏛️ Ver Câmara Municipal (Vereadores)
          </Link>
        </div>
      </div>

      {/* Grid: Bento Cards of City Metrics */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
        {/* População */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>POPULAÇÃO (CENSO 2022)</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', margin: '6px 0 4px' }}>
            {fmtNum(city.populacao)}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>habitantes no município</p>
        </div>

        {/* PIB */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>PIB DO MUNICÍPIO</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', margin: '6px 0 4px' }}>
            {city.pib ? `R$ ${fmtNum(city.pib)}mi` : '—'}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>PIB per capita: {city.pib_per_capita ? `R$ ${fmtNum(city.pib_per_capita)}` : '—'}</p>
        </div>

        {/* Densidade */}
        <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>DENSIDADE DEMOGRÁFICA</span>
          <h3 style={{ fontSize: 28, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)', margin: '6px 0 4px' }}>
            {city.densidade_demografica ? `${fmtNum(city.densidade_demografica)} hab/km²` : '—'}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--ink-3)' }}>Área territorial: {city.area_km2 ? `${fmtNum(city.area_km2)} km²` : '—'}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 32, alignItems: 'start', flexWrap: 'wrap' }}>
        
        {/* Left Side: Prefeito Hero Card */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>
            Chefe do Executivo Municipal
          </h2>

          {prefeito ? (
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, overflow: 'hidden'
            }}>
              <div style={{ height: 6, background: `linear-gradient(90deg, ${pCor}, ${pCor}66)` }} />
              
              <div style={{ padding: '32px 36px', display: 'flex', gap: 28, flexWrap: 'wrap' }}>
                {/* Photo avatar */}
                <div style={{
                  width: 120, height: 120, borderRadius: 12, overflow: 'hidden',
                  background: `linear-gradient(145deg, ${pCor} 0%, ${pCor}99 100%)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 54, fontWeight: 900, color: 'white', flexShrink: 0,
                  boxShadow: `0 8px 24px ${pCor}33`, position: 'relative',
                }}>
                  {prefeito.foto_url ? (
                    <Image src={prefeito.foto_url} alt={prefeito.nome} fill sizes="120px" unoptimized style={{ objectFit: 'cover' }} />
                  ) : inicial}
                </div>

                {/* Prefeito text details */}
                <div style={{ flex: 1, minWidth: 240 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.1em' }}>
                      PREFEITO(A) ELEITO(A) · MANDATO 2025–2028
                    </span>
                    {prefeito.partido && (
                      <span style={{
                        fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 999,
                        background: `${pCor}18`, color: pCor, border: `1px solid ${pCor}44`
                      }}>
                        {prefeito.partido}
                      </span>
                    )}
                  </div>

                  <h3 style={{ fontSize: 24, fontWeight: 800, color: 'var(--ink)', margin: '0 0 6px', letterSpacing: '-0.01em' }}>
                    {prefeito.nome}
                  </h3>
                  {prefeito.nome_civil && prefeito.nome_civil !== prefeito.nome && (
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: 'var(--ink-3)' }}>Nome civil: {prefeito.nome_civil}</p>
                  )}

                  {/* Prefeito stats */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px', borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', textTransform: 'uppercase' }}>Idade</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{idade ? `${idade} anos` : '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', textTransform: 'uppercase' }}>Ocupação</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{prefeito.ocupacao ?? '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', textTransform: 'uppercase' }}>Escolaridade</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{prefeito.escolaridade ?? '—'}</span>
                    </div>
                    <div>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', textTransform: 'uppercase' }}>Naturalidade</span>
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{prefeito.naturalidade ?? '—'}</span>
                    </div>
                  </div>

                  {/* Contacts */}
                  {(prefeito.email || prefeito.gabinete_telefone) && (
                    <div style={{ borderTop: '1px solid var(--line)', marginTop: 16, paddingTop: 16 }}>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', display: 'block', textTransform: 'uppercase', marginBottom: 6 }}>Contato Oficial</span>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                        {prefeito.email && (
                          <span style={{ color: 'var(--ink-2)' }}>📧 <a href={`mailto:${prefeito.email}`} style={{ color: 'inherit', textDecoration: 'none' }}>{prefeito.email}</a></span>
                        )}
                        {prefeito.gabinete_telefone && (
                          <span style={{ color: 'var(--ink-2)' }}>📞 {prefeito.gabinete_telefone}</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '40px 32px', textAlign: 'center', color: 'var(--ink-3)'
            }}>
              🔍 Dados do Prefeito de {city.nome} ainda não cadastrados no portal.
            </div>
          )}
        </div>

        {/* Right Side: SICONFI Fiscal Health Card */}
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', margin: '0 0 16px', fontFamily: 'var(--font-display)' }}>
            Saúde Fiscal (SICONFI)
          </h2>

          {finances ? (
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '24px 28px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', letterSpacing: '0.08em' }}>
                  BALANÇO ANUAL CONTÁBIL ({finances.ano})
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                  background: finances.situacao === 'superavitario' ? 'var(--pos-soft)' : 'var(--neg-soft)',
                  color: finances.situacao === 'superavitario' ? 'var(--pos)' : 'var(--neg)'
                }}>
                  {finances.situacao === 'superavitario' ? 'SUPERAVITÁRIO' : 'DEFICITÁRIO'}
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block' }}>Receitas Realizadas</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{fmtBrl(finances.receitas_realizadas)}</span>
                </div>
                <div>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block' }}>Despesas Liquidadas</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--ink)' }}>{fmtBrl(finances.despesas_liquidadas)}</span>
                </div>
                <div style={{ borderTop: '1px solid var(--line)', paddingTop: 12 }}>
                  <span style={{ fontSize: 11, color: 'var(--ink-3)', display: 'block' }}>Resultado Orçamentário</span>
                  <span style={{
                    fontSize: 20, fontWeight: 800,
                    color: (finances.resultado_orcamentario ?? 0) >= 0 ? 'var(--pos)' : 'var(--neg)'
                  }}>
                    {fmtBrl(finances.resultado_orcamentario)}
                  </span>
                </div>
              </div>

              <div style={{
                background: 'var(--bg)', padding: '12px 16px', borderRadius: 8,
                fontSize: 12, color: 'var(--ink-3)', lineHeight: 1.5
              }}>
                ℹ️ Dados consolidados obtidos diretamente do DCA (Declaração de Contas Anuais) fornecidos pelas prefeituras municipais ao Tesouro Nacional via SICONFI.
              </div>
            </div>
          ) : (
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '32px 24px', textAlign: 'center', color: 'var(--ink-3)'
            }}>
              📊 Dados de saúde fiscal SICONFI de 2024 indisponíveis para este município.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
