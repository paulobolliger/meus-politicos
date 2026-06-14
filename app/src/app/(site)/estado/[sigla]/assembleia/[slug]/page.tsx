import { getEstado } from '@/lib/estados-config'
import { getPgPool } from '@/lib/db/pool'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { DeputadoEstadualTabs } from '@/components/site/DeputadoEstadualTabs'
import type { DepTabData } from '@/components/site/DeputadoEstadualTabs'
import { isFeatureActive } from '@/lib/flags'

export const revalidate = 86400

// ─── Partido → cor ────────────────────────────────────────────────────────────
const PARTIDO_COR: Record<string, string> = {
  PT: '#dc2626', PL: '#1d4ed8', UNIÃO: '#d97706', PP: '#059669',
  PSD: '#7c3aed', MDB: '#0891b2', PSDB: '#2563eb', PDT: '#dc2626',
  PSB: '#d97706', REPUBLICANOS: '#1d4ed8', PODE: '#16a34a',
  NOVO: '#f59e0b', PRD: '#1d4ed8', PV: '#16a34a', SOLIDARIEDADE: '#f59e0b',
  AVANTE: '#0369a1', CIDADANIA: '#7c3aed', 'PC DO B': '#dc2626',
  PSOL: '#ec4899', REDE: '#10b981', DC: '#64748b', AGIR: '#0891b2',
}

// ─── Types ────────────────────────────────────────────────────────────────────
type DeputadoFull = DepTabData & {
  id:              string
  slug:            string
  foto_url:        string | null
  email:           string | null
  gabinete_nome:   string | null
  gabinete_telefone: string | null
  gabinete_email:  string | null
  uf:              string
}

type Colega = {
  id:             string
  slug:           string
  nome_eleitoral: string
  foto_url:       string | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
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

function fmtData(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtMoeda(v: string | null): string | null {
  if (!v || Number(v) === 0) return null
  const n = Number(v)
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}mi`
  if (n >= 1_000)     return `R$ ${(n / 1_000).toFixed(1).replace('.', ',')}k`
  return `R$ ${n.toLocaleString('pt-BR')}`
}

// ─── Static params ─────────────────────────────────────────────────────────────
export async function generateStaticParams() {
  return []
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string; slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const pool = getPgPool()
  const res = await pool.query<{ nome_eleitoral: string; partido: string | null; uf: string }>(
    `SELECT p.nome_eleitoral, pt.sigla AS partido, p.uf
     FROM politicos p LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.slug = $1 AND p.cargo = 'deputado_estadual'
     LIMIT 1`,
    [slug]
  )
  const dep = res.rows[0]
  if (!dep) return { title: 'Deputado não encontrado' }
  return {
    title: `${dep.nome_eleitoral} — Dep. Estadual ${dep.uf} | Meus Políticos`,
    description: `Perfil, votações e gastos de ${dep.nome_eleitoral}, deputado(a) estadual por ${dep.uf}${dep.partido ? ` pelo ${dep.partido}` : ''}. Mandato 2023–2026.`,
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function DeputadoEstadualPage({
  params,
}: {
  params: Promise<{ sigla: string; slug: string }>
}) {
  const { sigla, slug } = await params
  const siglaUp = sigla.toUpperCase()
  const cfg = getEstado(siglaUp)
  if (!cfg) notFound()

  const pool = getPgPool()

  // ─── Fetch deputado ────────────────────────────────────────────────────────
  const depResult = await pool.query<DeputadoFull>(
    `SELECT p.id, p.slug, p.nome_eleitoral, p.nome, p.foto_url,
            p.sexo, p.data_nascimento, p.naturalidade, p.escolaridade, p.ocupacao,
            p.email, p.gabinete_nome, p.gabinete_telefone, p.gabinete_email,
            p.mandato_inicio, p.mandato_fim, p.numero_mandato,
            p.gasto_total_ano, p.presenca_pct_atual, p.total_votacoes,
            p.total_emendas_ano, p.total_emendas_historico,
            p.uf,
            pt.sigla AS partido, pt.nome AS partido_nome
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.slug = $1 AND p.cargo = 'deputado_estadual'
     LIMIT 1`,
    [slug]
  )

  const dep = depResult.rows[0]
  if (!dep) notFound()

  // ─── Fetch colegas ─────────────────────────────────────────────────────────
  const colegasResult = await pool.query<Colega>(
    `SELECT p.id, p.slug, p.nome_eleitoral, p.foto_url
     FROM politicos p
     LEFT JOIN partidos pt ON pt.id = p.partido_id
     WHERE p.cargo = 'deputado_estadual' AND UPPER(p.uf) = $1
       AND pt.sigla = $2 AND p.slug != $3
       AND p.removido_em IS NULL
     ORDER BY p.nome_eleitoral
     LIMIT 8`,
    [siglaUp, dep.partido ?? '', slug]
  )
  const colegas = colegasResult.rows

  // ─── Derivados ─────────────────────────────────────────────────────────────
  const cor  = cfg.cor
  const pCor = PARTIDO_COR[dep.partido ?? ''] ?? '#64748b'
  const inicial = dep.nome_eleitoral.charAt(0)
  const idade = calcIdade(dep.data_nascimento)
  const presencaPct = dep.presenca_pct_atual ? Number(dep.presenca_pct_atual) : null
  const gastosStr   = fmtMoeda(dep.gasto_total_ano)
  const temEmendas  = dep.total_emendas_historico && Number(dep.total_emendas_historico) > 0
  const atuacaoActive = await isFeatureActive('atuacao_parlamentar')

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        .dep-detail-page,
        .dep-detail-page * { box-sizing: border-box; }
        .dep-colega:hover { border-color: ${pCor} !important; transform: translateY(-2px); }
        .dep-colega { transition: border-color 0.15s, transform 0.15s; }
        .dep-action:hover { opacity: 0.85; }
        .dep-action { transition: opacity 0.15s; }
        .back-link:hover { color: ${cor} !important; }
        .back-link { transition: color 0.15s; }
      ` }} />

      <div className="dep-detail-page" style={{ width: '100%', maxWidth: 1280, margin: '0 auto', padding: '32px 32px 72px', overflowX: 'clip' }}>

        {/* ── BREADCRUMB ──────────────────────────────────────────────────── */}
        <nav style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontSize: 13, color: 'var(--ink-3)', marginBottom: 28, flexWrap: 'wrap',
        }}>
          {[
            { label: 'Início',     href: '/' },
            { label: 'Estados',    href: '/estado' },
            { label: cfg.nome,     href: `/estado/${sigla}` },
            { label: 'Assembleia', href: `/estado/${sigla}/assembleia` },
          ].map(b => (
            <span key={b.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Link href={b.href} className="back-link" style={{ color: 'inherit', textDecoration: 'none' }}>{b.label}</Link>
              <span>/</span>
            </span>
          ))}
          <span style={{ color: 'var(--ink-2)', fontWeight: 600 }}>{dep.nome_eleitoral}</span>
        </nav>

        {/* ── HERO ────────────────────────────────────────────────────────── */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 16, overflow: 'hidden', marginBottom: 24,
        }}>
          {/* Faixa colorida */}
          <div style={{ height: 6, background: `linear-gradient(90deg, ${pCor}, ${pCor}66)` }} />

          <div style={{
            padding: '32px 36px',
            display: 'flex', alignItems: 'flex-start', gap: 28, flexWrap: 'wrap',
          }}>
            {/* Avatar quadrado como no wireframe */}
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
              {dep.foto_url
                ? <Image src={dep.foto_url} alt={dep.nome_eleitoral}
                    fill sizes="120px" unoptimized style={{ objectFit: 'cover' }} />
                : inicial
              }
            </div>

            {/* Identidade */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* Chips */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
                  color: 'var(--ink-3)', fontFamily: 'var(--font-mono)',
                }}>
                  DEPUTADO{dep.sexo === 'F' ? 'A' : ''} ESTADUAL · {siglaUp} · 2023–2026
                </span>
                {dep.partido && (
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '2px 12px',
                    borderRadius: 999, fontFamily: 'var(--font-mono)',
                    background: `${pCor}18`, color: pCor, border: `1px solid ${pCor}44`,
                  }}>
                    {dep.partido}-{siglaUp}
                  </span>
                )}
                {dep.numero_mandato && (
                  <span style={{
                    fontSize: 11, fontWeight: 600, padding: '2px 10px',
                    borderRadius: 999, background: 'var(--bg)', color: 'var(--ink-3)',
                  }}>
                    {dep.numero_mandato}º mandato
                  </span>
                )}
              </div>

              {/* Nome */}
              <h1 style={{
                margin: '0 0 6px',
                fontSize: 'clamp(22px, 3vw, 34px)',
                fontWeight: 900, color: 'var(--ink)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.02em', lineHeight: 1.1,
              }}>
                {dep.nome_eleitoral}
              </h1>

              {dep.nome && dep.nome !== dep.nome_eleitoral && (
                <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--ink-3)' }}>
                  {dep.nome}
                </p>
              )}

              {/* Mini stats */}
              <div style={{ display: 'flex', gap: 24, marginTop: 14, flexWrap: 'wrap' }}>
                {idade && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>IDADE</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--font-mono)' }}>{idade} anos</div>
                  </div>
                )}
                {dep.naturalidade && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>NATURALIDADE</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{dep.naturalidade}</div>
                  </div>
                )}
                {dep.escolaridade && (
                  <div>
                    <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>ESCOLARIDADE</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--ink-2)' }}>{dep.escolaridade}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Ações */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
              <Link href={`/estado/${sigla}/assembleia`} className="dep-action" style={{
                padding: '9px 18px', borderRadius: 9,
                border: '1px solid var(--line)', background: 'var(--bg)',
                color: 'var(--ink-2)', textDecoration: 'none',
                fontSize: 13, fontWeight: 600, textAlign: 'center',
              }}>
                ← Assembleia
              </Link>
              {dep.email && (
                <a href={`mailto:${dep.email}`} className="dep-action" style={{
                  padding: '9px 18px', borderRadius: 9,
                  border: `1px solid ${pCor}44`, background: `${pCor}0d`,
                  color: pCor, textDecoration: 'none',
                  fontSize: 13, fontWeight: 600, textAlign: 'center',
                }}>
                  ✉️ Contato
                </a>
              )}
              <button className="dep-action" style={{
                padding: '9px 18px', borderRadius: 9,
                border: '1px solid var(--line)', background: 'var(--bg)',
                color: 'var(--ink-2)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}>
                🔗 Compartilhar
              </button>
            </div>
          </div>
        </div>

        {/* ── KPI STRIP ───────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(220px, 100%), 1fr))', gap: 16, marginBottom: 24 }}>

          {/* Presença */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>PRESENÇA NAS SESSÕES</div>
              <span style={{ fontSize: 18 }}>✅</span>
            </div>
            {presencaPct !== null ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--pos)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>
                  {presencaPct.toFixed(1)}%
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: `${presencaPct}%`, background: 'var(--pos)', borderRadius: 999, transition: 'width 0.6s ease' }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>das sessões plenárias</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--line)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>—</div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999, marginBottom: 6 }} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>Em breve</span>
              </>
            )}
          </div>

          {/* Gastos */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>GASTOS DE GABINETE</div>
              <span style={{ fontSize: 18 }}>💰</span>
            </div>
            {gastosStr ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--warn)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>
                  {gastosStr}
                </div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999 }}>
                  <div style={{ height: '100%', width: '60%', background: 'var(--warn)', borderRadius: 999 }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 6 }}>no ano corrente</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--line)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>—</div>
                <div style={{ height: 6, background: 'var(--bg)', borderRadius: 999, marginBottom: 6 }} />
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>Em breve</span>
              </>
            )}
          </div>

          {/* Votações Ativas */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 14, padding: '20px 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>VOTAÇÕES REGISTRADAS</div>
              <span style={{ fontSize: 18 }}>🗳️</span>
            </div>
            {dep.total_votacoes ? (
              <>
                <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--info)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>
                  {dep.total_votacoes}
                </div>
                {/* Dots SIM / NÃO / ABS — placeholder ratio */}
                <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', marginBottom: 6 }}>
                  {Array.from({ length: Math.min(dep.total_votacoes, 20) }, (_, i) => (
                    <div key={i} style={{
                      width: 10, height: 10, borderRadius: '50%',
                      background: i < dep.total_votacoes! * 0.6 ? 'var(--pos)' :
                                  i < dep.total_votacoes! * 0.85 ? 'var(--neg)' : 'var(--warn)',
                    }} />
                  ))}
                </div>
                <div style={{ fontSize: 11, color: 'var(--ink-3)' }}>votos no total</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 30, fontWeight: 900, color: 'var(--line)', fontFamily: 'var(--font-display)', marginBottom: 10 }}>—</div>
                {/* Dots skeleton */}
                <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                  {[...Array(10)].map((_, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--bg)' }} />
                  ))}
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>Em breve</span>
              </>
            )}
          </div>
        </div>

        {/* ── GRID PRINCIPAL ──────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 20, alignItems: 'start' }}>

          {/* ── COL ESQUERDA ────────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Mandato */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderLeft: `3px solid ${cor}`, borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                MANDATO
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Cargo',    value: `Deputado${dep.sexo === 'F' ? 'a' : ''} Estadual` },
                  { label: 'Estado',   value: cfg.nome },
                  { label: 'Partido',  value: dep.partido_nome ? `${dep.partido_nome} (${dep.partido})` : dep.partido ?? '—' },
                  { label: 'Início',   value: fmtData(dep.mandato_inicio) },
                  { label: 'Término',  value: fmtData(dep.mandato_fim) },
                  { label: 'Mandato',  value: dep.numero_mandato ? `${dep.numero_mandato}º` : '—' },
                ].map(item => (
                  <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, color: 'var(--ink-2)', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dados pessoais */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                DADOS PESSOAIS
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Nome civil',    value: dep.nome ?? '—' },
                  {
                    label: 'Nascimento',
                    value: dep.data_nascimento
                      ? `${fmtData(dep.data_nascimento)}${idade ? ` (${idade} anos)` : ''}`
                      : '—',
                  },
                  { label: 'Gênero',        value: dep.sexo === 'F' ? 'Feminino' : dep.sexo === 'M' ? 'Masculino' : '—' },
                  { label: 'Naturalidade',  value: dep.naturalidade ?? '—' },
                  { label: 'Escolaridade',  value: dep.escolaridade ?? '—' },
                  { label: 'Ocupação',      value: dep.ocupacao ?? '—' },
                ].map(item => (
                  <div key={item.label}>
                    <div style={{ fontSize: 10, letterSpacing: '0.06em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                      {item.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: 13, color: item.value === '—' ? 'var(--mute)' : 'var(--ink-2)', fontWeight: item.value === '—' ? 400 : 500, marginTop: 1 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Contato */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 14 }}>
                CONTATO E GABINETE
              </div>
              {(dep.email || dep.gabinete_nome || dep.gabinete_telefone) ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {dep.gabinete_nome && (
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>GABINETE</div>
                      <div style={{ fontSize: 13, color: 'var(--ink-2)', fontWeight: 500 }}>{dep.gabinete_nome}</div>
                    </div>
                  )}
                  {dep.email && (
                    <a href={`mailto:${dep.email}`} style={{ fontSize: 13, color: pCor, textDecoration: 'none' }}>
                      ✉️ {dep.email}
                    </a>
                  )}
                  {dep.gabinete_telefone && (
                    <div style={{ fontSize: 13, color: 'var(--ink-2)' }}>📞 {dep.gabinete_telefone}</div>
                  )}
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--mute)' }}>Não disponível</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>Em breve</span>
                </div>
              )}
            </div>

            {/* Score de Transparência */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderLeft: `3px solid var(--brand)`,
              borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  SCORE DE TRANSPARÊNCIA
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                  Em cálculo
                </span>
              </div>
              {/* Indicador central */}
              <div style={{ textAlign: 'center', padding: '12px 0 16px' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%', margin: '0 auto 8px',
                  background: 'var(--bg)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 26, fontWeight: 900, color: 'var(--mute)',
                  fontFamily: 'var(--font-display)',
                }}>
                  ?
                </div>
                <div style={{ fontSize: 12, color: 'var(--ink-3)' }}>Aguardando dados de votações e gastos</div>
              </div>
              {/* Sub-scores */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Presença nas sessões', peso: '40%', valor: presencaPct },
                  { label: 'Gastos proporcionais', peso: '30%', valor: null },
                  { label: 'Participação em votos', peso: '30%', valor: dep.total_votacoes },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 11, color: 'var(--ink-2)' }}>{s.label}</span>
                      <span style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>{s.peso}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--bg)', borderRadius: 999 }}>
                      <div style={{
                        height: '100%', borderRadius: 999,
                        background: s.valor !== null ? 'var(--pos)' : 'var(--line)',
                        width: s.valor !== null
                          ? (typeof s.valor === 'number' && s.valor <= 100 ? `${s.valor}%` : '60%')
                          : '0%',
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emendas */}
            <div style={{
              background: 'var(--panel)', border: '1px solid var(--line)',
              borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  EMENDAS PARLAMENTARES
                </div>
                {!temEmendas && (
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'var(--warn-soft)', color: 'var(--warn)' }}>
                    Em breve
                  </span>
                )}
              </div>
              {temEmendas ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>ESTE ANO</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                      {fmtMoeda(dep.total_emendas_ano)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', marginBottom: 2 }}>HISTÓRICO</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', fontFamily: 'var(--font-display)' }}>
                      {fmtMoeda(dep.total_emendas_historico)}
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--mute)', padding: '12px 0' }}>
                  Emendas de deputados estaduais serão integradas em breve.
                </div>
              )}
            </div>

          </div>

          {/* ── COL DIREITA: TABS ────────────────────────────────────── */}
          <DeputadoEstadualTabs
            dep={dep}
            cor={cor}
            pCor={pCor}
            sigla={sigla}
            estadoNome={cfg.nome}
            atuacaoActive={atuacaoActive}
          />
        </div>

        {/* ── COLEGAS DE PARTIDO ──────────────────────────────────────────── */}
        {colegas.length > 0 && (
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)',
            borderRadius: 14, padding: '22px 28px', marginTop: 20,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                COLEGAS DE {dep.partido} NA ALE {siglaUp} ({colegas.length})
              </div>
              <Link href={`/estado/${sigla}/assembleia?partido=${dep.partido}`} style={{
                fontSize: 12, color: pCor, textDecoration: 'none', fontWeight: 600,
              }}>
                Ver bancada completa →
              </Link>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 8 }}>
              {colegas.map(c => (
                <Link key={c.id} href={`/estado/${sigla}/assembleia/${c.slug}`} style={{ textDecoration: 'none' }}>
                  <div className="dep-colega" style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 10,
                    border: '1px solid var(--line)', background: 'var(--bg)',
                  }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                      background: `${pCor}22`, overflow: 'hidden',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 13, fontWeight: 700, color: pCor,
                      fontFamily: 'var(--font-display)', position: 'relative',
                    }}>
                      {c.foto_url
                        ? <Image src={c.foto_url} alt={c.nome_eleitoral}
                            fill sizes="34px" unoptimized style={{ objectFit: 'cover' }} />
                        : c.nome_eleitoral.charAt(0)
                      }
                    </div>
                    <span style={{
                      fontSize: 11, color: 'var(--ink-2)', fontWeight: 500,
                      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                    }}>
                      {c.nome_eleitoral}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── FOOTER ──────────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 40, paddingTop: 24,
          borderTop: '1px solid var(--line)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <Link href={`/estado/${sigla}/assembleia`} style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, color: 'var(--ink-3)', textDecoration: 'none', fontWeight: 600,
          }}>
            ← Todos os deputados da ALE {siglaUp}
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)' }}>
            ℹ️ Fonte: TSE · Eleitos 2022 · Dados atualizados periodicamente
          </div>
        </div>

      </div>
    </>
  )
}
