import { getPgPool } from '@/lib/db/pool'
import { getEstado } from '@/lib/estados-config'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { VereadorTabs } from '@/components/site/VereadorTabs'
import type { VerTabData } from '@/components/site/VereadorTabs'
import { isFeatureActive } from '@/lib/flags'

export const revalidate = 86400

// ─── Static params ──────────────────────────────────────────────────────────
export function generateStaticParams() {
  return [
    { sigla: 'sp', slug_cidade: 'sao-paulo-sp', slug_vereador: 'lucas-pavanato-sp' },
    { sigla: 'sp', slug_cidade: 'sao-paulo-sp', slug_vereador: 'amanda-paschoal-sp' },
    { sigla: 'rj', slug_cidade: 'rio-de-janeiro-rj', slug_vereador: 'carlos-bolsonaro-rj' },
    { sigla: 'rj', slug_cidade: 'rio-de-janeiro-rj', slug_vereador: 'monica-benicio-rj' },
    { sigla: 'ac', slug_cidade: 'rio-branco-ac', slug_vereador: 'samir-bestene-ac' },
  ]
}

// ─── Metadata ────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string; slug_cidade: string; slug_vereador: string }> }
): Promise<Metadata> {
  const { slug_vereador } = await params
  const pool = getPgPool()
  const res = await pool.query<{ nome_eleitoral: string; partido: string | null; uf: string }>(
    `SELECT p.nome_eleitoral, pt.sigla AS partido, p.uf
     FROM politicos p 
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.slug = $1 AND p.cargo = 'vereador'
     LIMIT 1`,
    [slug_vereador]
  )
  const ver = res.rows[0]
  if (!ver) return { title: 'Vereador não encontrado' }
  return {
    title: `${ver.nome_eleitoral} — Vereador(a) ${ver.uf} | Meus Políticos`,
    description: `Perfil, biografia, atuação e gastos de ${ver.nome_eleitoral}, vereador(a) em ${ver.uf}${ver.partido ? ` pelo ${ver.partido}` : ''}. Mandato 2025–2028.`,
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
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

type VereadorFull = VerTabData & {
  id:              string
  slug:            string
  foto_url:        string | null
  email:           string | null
  gabinete_nome:   string | null
  gabinete_telefone: string | null
  gabinete_email:  string | null
  uf:              string
  municipio_id:    string
}

type Colega = {
  id:             string
  slug:           string
  nome_eleitoral: string
  foto_url:       string | null
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default async function VereadorPage(
  { params }: { params: Promise<{ sigla: string; slug_cidade: string; slug_vereador: string }> }
) {
  const { sigla, slug_cidade, slug_vereador } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPgPool()

  // Fetch vereador details
  const vResult = await pool.query<VereadorFull>(
    `SELECT p.id, p.slug, p.nome_eleitoral, p.nome, p.foto_url,
            p.sexo, p.data_nascimento::text as data_nascimento, p.naturalidade, p.escolaridade, p.ocupacao,
            p.email, p.gabinete_nome, p.gabinete_telefone, p.gabinete_email,
            p.mandato_inicio::text as mandato_inicio, p.mandato_fim::text as mandato_fim, p.numero_mandato,
            p.gasto_total_ano::float8 as gasto_total_ano, p.presenca_pct_atual::float8 as presenca_pct_atual, p.total_votacoes,
            p.total_emendas_ano::float8 as total_emendas_ano, p.total_emendas_historico::float8 as total_emendas_historico,
            p.uf, p.municipio_id,
            pt.sigla AS partido, pt.nome AS partido_nome
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.slug = $1 AND p.cargo = 'vereador' AND p.removido_em IS NULL
     LIMIT 1`,
    [slug_vereador]
  )
  const ver = vResult.rows[0]
  if (!ver) notFound()

  // Fetch city info
  const cityRes = await pool.query<{ nome: string; slug: string }>(
    `SELECT nome, slug FROM municipios WHERE id = $1 LIMIT 1`,
    [ver.municipio_id]
  )
  const city = cityRes.rows[0]
  if (!city) notFound()

  // Fetch peer councilors from the same party
  const colegasRes = await pool.query<Colega>(
    `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.cargo = 'vereador' AND p.municipio_id = $1
       AND pt.sigla = $2 AND p.slug != $3
       AND p.removido_em IS NULL
     ORDER BY p.nome_eleitoral
     LIMIT 8`,
    [ver.municipio_id, ver.partido ?? '', slug_vereador]
  )
  const colegas = colegasRes.rows

  const cor  = cfg.cor
  const pCor = PARTIDO_COR[ver.partido ?? ''] ?? '#64748b'
  const inicial = ver.nome_eleitoral.charAt(0)
  const idade = calcIdade(ver.data_nascimento)
  const atuacaoActive = await isFeatureActive('atuacao_parlamentar')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .ver-colega:hover { border-color: ${pCor} !important; transform: translateY(-2px); }
        .ver-colega { transition: border-color 0.15s, transform 0.15s; }
        .back-link:hover { color: ${cor} !important; }
        .back-link { transition: color 0.15s; }
      ` }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 32px 72px' }}>
        
        {/* Breadcrumb */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--ink-3)', marginBottom: 28, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Início',     href: '/' },
            { label: 'Estados',    href: '/estado' },
            { label: cfg.nome,     href: `/estado/${sigla}` },
            { label: city.nome,    href: `/estado/${sigla}/${slug_cidade}` },
            { label: 'Câmara',     href: `/estado/${sigla}/${slug_cidade}/camara` },
          ].map(b => (
            <span key={b.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href={b.href} className="back-link" style={{ color: 'inherit', textDecoration: 'none' }}>{b.label}</Link>
              <span>/</span>
            </span>
          ))}
          <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{ver.nome_eleitoral}</span>
        </nav>

        {/* Hero Section */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        }}>
          {/* Top border colored by party */}
          <div style={{ height: 6, background: `linear-gradient(90deg, ${pCor}, ${pCor}66)` }} />

          <div style={{
            padding: '32px 36px',
            display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap',
          }}>
            {/* Square avatar */}
            <div style={{
              width: 110, height: 110, flexShrink: 0,
              borderRadius: 12,
              background: `linear-gradient(145deg, ${pCor} 0%, ${pCor}99 100%)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 48, fontWeight: 900, color: 'white',
              fontFamily: 'var(--font-display)',
              boxShadow: `0 8px 24px ${pCor}33`,
              overflow: 'hidden', position: 'relative',
            }}>
              {ver.foto_url ? (
                <Image src={ver.foto_url} alt={ver.nome_eleitoral} fill sizes="110px" unoptimized style={{ objectFit: 'cover' }} />
              ) : inicial}
            </div>

            {/* Identidade */}
            <div style={{ flex: 1, minWidth: 240 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                }}>
                  VEREADOR(A) · {city.nome.toUpperCase()} · MANDATO 2025–2028
                </span>
                {ver.partido && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '2px 12px',
                    borderRadius: 999, fontFamily: 'var(--font-mono)',
                    background: `${pCor}18`, color: pCor, border: `1px solid ${pCor}44`,
                  }}>
                    {ver.partido}
                  </span>
                )}
              </div>

              <h1 style={{
                fontSize: 'clamp(24px, 3.5vw, 36px)', fontWeight: 800, margin: '0 0 4px',
                color: 'var(--ink)', letterSpacing: '-0.02em', fontFamily: 'var(--font-display)'
              }}>
                {ver.nome_eleitoral}
              </h1>
              {ver.nome && ver.nome !== ver.nome_eleitoral && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--ink-3)' }}>Nome civil: {ver.nome}</p>
              )}

              {/* Mandato/Gabinete Summary */}
              <div style={{
                display: 'flex', gap: '20px 40px', flexWrap: 'wrap',
                marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--line)',
                fontSize: 13, color: 'var(--ink-2)',
              }}>
                <div>
                  <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: 11 }}>Mandato</span>
                  <strong>1º mandato</strong>
                </div>
                {idade && (
                  <div>
                    <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: 11 }}>Idade</span>
                    <strong>{idade} anos</strong>
                  </div>
                )}
                {ver.ocupacao && (
                  <div>
                    <span style={{ color: 'var(--ink-3)', display: 'block', fontSize: 11 }}>Ocupação Principal</span>
                    <strong>{ver.ocupacao}</strong>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bento: Tabs + Colleagues */}
        <div style={{ display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 24, alignItems: 'start', flexWrap: 'wrap' }}>
          {/* Interactive tab details */}
          <VereadorTabs ver={ver} cor={cor} pCor={pCor} sigla={sigla} cidadeNome={city.nome} atuacaoActive={atuacaoActive} />

          {/* Peer party members */}
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '24px 28px',
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px', fontFamily: 'var(--font-display)' }}>
              Bancada do {ver.partido}
            </h3>
            <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: '0 0 20px' }}>
              Outros vereadores do mesmo partido na Câmara Municipal
            </p>

            {colegas.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {colegas.map((c) => {
                  const initChar = c.nome_eleitoral.charAt(0)
                  return (
                    <Link key={c.id} href={`/estado/${sigla}/${slug_cidade}/camara/vereador/${c.slug}`} style={{ textDecoration: 'none' }}>
                      <div className="ver-colega" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 12px', border: '1px solid var(--line)',
                        borderRadius: 8, background: 'var(--bg)', cursor: 'pointer',
                      }}>
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', overflow: 'hidden',
                          background: `linear-gradient(135deg, ${pCor} 0%, ${pCor}99 100%)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0,
                          position: 'relative',
                        }}>
                          {c.foto_url ? (
                            <Image src={c.foto_url} alt={c.nome_eleitoral} fill sizes="36px" unoptimized style={{ objectFit: 'cover' }} />
                          ) : initChar}
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.nome_eleitoral}
                        </span>
                      </div>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <p style={{ fontSize: 13, color: 'var(--ink-3)', margin: 0, textAlign: 'center', padding: '20px 0' }}>
                Único vereador do partido nesta Câmara.
              </p>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
