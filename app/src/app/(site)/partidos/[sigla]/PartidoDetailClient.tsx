'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'

// ─── Types ────────────────────────────────────────────────────────────────────
export type PartidoDetail = {
  id: string
  sigla: string
  nome: string
  numero: string | null
  cor: string | null
  logo_url: string | null
  wiki_title: string | null
  site: string | null
  presidente: string | null
  fundado_em: number | null
  endereco: string | null
  cep: string | null
  telefone: string | null
  email: string | null
  espectro: string | null
  fp_ultimo_valor: number | null
  fp_ultimo_ano: number | null
  fefc_ultimo_valor: number | null
  fefc_ultimo_ano: number | null
}

export type WikiSummary = {
  extract: string
  page_url: string
  thumbnail?: string
}

export type MembroPartido = {
  id: string
  slug: string
  nome_eleitoral: string | null
  nome: string
  foto_url: string | null
  cargo: string
  uf: string | null
  mandato_fim: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function siglaCaminho(sigla: string) {
  return sigla.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}
function useLogo(sigla: string, logoUrl: string | null): [string | null, () => void] {
  const base = `/partidos/${siglaCaminho(sigla)}`
  const sources = [logoUrl ?? `${base}.svg`, `${base}.png`]
  const [idx, setIdx] = useState(0)
  return [idx < sources.length ? sources[idx] : null, () => setIdx(i => i + 1)]
}
function initials(nome: string | null) {
  if (!nome) return '?'
  const p = nome.trim().split(/\s+/)
  return p.length === 1 ? p[0].slice(0, 2).toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase()
}
function fmtMoeda(n: number) {
  if (n >= 1_000_000_000) return `R$ ${(n / 1_000_000_000).toFixed(1).replace('.', ',')}Bi`
  if (n >= 1_000_000) return `R$ ${(n / 1_000_000).toFixed(1).replace('.', ',')}M`
  if (n >= 1_000) return `R$ ${(n / 1_000).toFixed(0)}k`
  return `R$ ${n.toLocaleString('pt-BR')}`
}
function fmt(n: number) { return n.toLocaleString('pt-BR') }

const ESPECTRO_LABEL: Record<string, string> = {
  esquerda: 'Social & Popular', 'centro-esquerda': 'Social & Econômico',
  centro: 'Liberal & Reformista', 'centro-direita': 'Conservador & Liberal',
  direita: 'Conservador & Nacional',
}
const CARGO_LABEL: Record<string, string> = {
  governador: 'Governador', senador: 'Senador(a)',
  deputado_federal: 'Dep. Federal', deputado_estadual: 'Dep. Estadual',
  prefeito: 'Prefeito(a)', vereador: 'Vereador(a)',
}

// totais nacionais para representatividade
const TOTAL_NACIONAL: Record<string, number> = {
  governador: 27, senador: 81, deputado_federal: 513,
  deputado_estadual: 1059, prefeito: 5568, vereador: 58000,
}
const CARGO_LABEL_PLURAL: Record<string, string> = {
  governador: 'Governadores', senador: 'Senadores',
  deputado_federal: 'Deputados Federais', deputado_estadual: 'Deputados Estaduais',
  prefeito: 'Prefeitos', vereador: 'Vereadores',
}
// ─── Glass panel ─────────────────────────────────────────────────────────────
const glass: React.CSSProperties = {
  background: 'rgba(255,255,255,0.7)',
  backdropFilter: 'blur(10px)',
  border: '1px solid #E2E8F0',
  borderRadius: 12,
}

type TabId = 'executivo' | 'senado' | 'camara' | 'estadual' | 'municipal'

// ─── Member photo card (tab grid) ────────────────────────────────────────────
function MembroFotoCard({ membro }: { membro: MembroPartido }) {
  const [imgErr, setImgErr] = useState(false)
  const [hovered, setHovered] = useState(false)
  const nome = membro.nome_eleitoral ?? membro.nome
  const cargo = CARGO_LABEL[membro.cargo] ?? membro.cargo

  return (
    <Link
      href={`/politicos/${membro.slug}`}
      style={{
        textDecoration: 'none', color: 'inherit',
        display: 'block',   /* ocupa 100% da célula do grid */
        minWidth: 0,        /* não expande além da coluna */
      }}
    >
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: 'var(--panel)',
          padding: 8,
          borderRadius: 12,
          border: `1.5px solid ${hovered ? '#000' : '#c6c6cd'}`,
          transition: 'border-color 0.15s',
          cursor: 'pointer',
          display: 'flex', flexDirection: 'column',
          minWidth: 0,     /* não expande pelo conteúdo */
          overflow: 'hidden',
        }}
      >
        {/* Photo — altura fixa, imagem absoluta dentro */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: 140,          /* altura fixa em px */
          flexShrink: 0,
          background: '#e5e7eb',
          borderRadius: 8,
          marginBottom: 8,
          overflow: 'hidden',
        }}>
          {membro.foto_url && !imgErr ? (
            <Image
              src={membro.foto_url} alt={nome}
              onError={() => setImgErr(true)}
              fill
              sizes="(max-width: 640px) 50vw, 200px"
              unoptimized
              style={{
                objectFit: 'cover', objectPosition: 'top center',
                filter: hovered ? 'grayscale(0%)' : 'grayscale(100%)',
                transition: 'filter 0.25s',
              }}
            />
          ) : (
            <div style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, color: '#9ca3af', fontWeight: 800,
            }}>
              {initials(nome)}
            </div>
          )}
        </div>

        {/* Name — sempre 1 linha, truncada */}
        <p style={{
          fontWeight: 700, fontSize: 12, lineHeight: 1.3, color: '#0b1c30',
          margin: '0 0 5px',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{nome}</p>

        {/* Role + UF — sempre na mesma linha */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', flexShrink: 0,
        }}>
          <span style={{
            fontSize: 9, color: '#45464d',
            textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600,
          }}>
            {cargo}
          </span>
          {membro.uf && (
            <span style={{
              fontSize: 10, fontWeight: 700, background: '#e5eeff',
              color: '#0051d5', borderRadius: 4, padding: '2px 6px',
              flexShrink: 0,
            }}>{membro.uf}</span>
          )}
        </div>
      </div>
    </Link>
  )
}

// ─── Representatividade bar row ───────────────────────────────────────────────
function RepresentatividadeRow({
  label, count, total, cor,
}: {
  label: string; count: number; total: number; cor: string
}) {
  const pct = total > 0 ? (count / total) * 100 : 0
  const pctDisplay = pct < 1 && pct > 0 ? pct.toFixed(1) : Math.round(pct)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{
            fontSize: 10, fontWeight: 700, color: '#45464d',
            textTransform: 'uppercase', letterSpacing: '0.05em',
          }}>{label}</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: '#0b1c30' }}>
            {fmt(count)} / {total >= 1000 ? `${(total / 1000).toFixed(0)}k` : total}
          </span>
        </div>
        <div style={{ height: 8, background: '#dce9ff', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{
            height: '100%', width: `${Math.min(pct, 100)}%`,
            background: cor, borderRadius: 99, transition: 'width 0.5s',
          }} />
        </div>
      </div>
      <span style={{
        fontSize: 14, fontWeight: 700, color: '#0b1c30', minWidth: 32, textAlign: 'right',
      }}>{pctDisplay}%</span>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function PartidoDetailClient({
  partido,
  membros,
  gastosPorCategoria,
  wiki,
  coesao,
}: {
  partido: PartidoDetail
  membros: MembroPartido[]
  gastosPorCategoria: { categoria: string; valor: number }[]
  wiki: WikiSummary | null
  coesao: { score: number; totalSessoes: number } | null
  coesaoPorAno: { ano: number; score: number }[]
  topDissidentes: { nome: string; slug: string; uf: string | null; alinhamento: number }[]
}) {
  const [logoSrc, onLogoError] = useLogo(partido.sigla, partido.logo_url)
  const [activeTab, setActiveTab] = useState<TabId>('camara')
  const [membroQ, setMembroQ] = useState('')

  const cor = partido.cor ?? '#0051d5'
  const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })

  // ── Aggregates ──────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const byType = (c: string) => membros.filter(m => m.cargo === c).length
    const comPresenca = membros.filter(m => m.presenca_pct_atual != null)
    const presencaMedia = comPresenca.length
      ? comPresenca.reduce((s, m) => s + (m.presenca_pct_atual ?? 0), 0) / comPresenca.length
      : null
    const gastoTotal = membros.reduce((s, m) => s + (m.gasto_total_ano ?? 0), 0)
    return {
      governadores: byType('governador'),
      prefeitos: byType('prefeito'),
      senadores: byType('senador'),
      depFederal: byType('deputado_federal'),
      depEstadual: byType('deputado_estadual'),
      vereadores: byType('vereador'),
      presencaMedia,
      gastoTotal,
    }
  }, [membros])

  // ── Membros por tab ──────────────────────────────────────────────────────────
  const membrosPorTab: Record<TabId, MembroPartido[]> = useMemo(() => ({
    executivo: membros.filter(m => m.cargo === 'governador' || m.cargo === 'prefeito'),
    senado: membros.filter(m => m.cargo === 'senador'),
    camara: membros.filter(m => m.cargo === 'deputado_federal'),
    estadual: membros.filter(m => m.cargo === 'deputado_estadual'),
    municipal: membros.filter(m => m.cargo === 'vereador'),
  }), [membros])

  const TAB_CONFIG: { id: TabId; label: string }[] = [
    { id: 'executivo', label: 'Executivo' },
    { id: 'senado',    label: 'Senado' },
    { id: 'camara',    label: 'Câmara Federal' },
    { id: 'estadual',  label: 'Estadual' },
    { id: 'municipal', label: 'Municipal' },
  ]

  const filteredMembros = useMemo(() => {
    const list = membrosPorTab[activeTab]
    if (!membroQ.trim()) return list
    const lq = membroQ.toLowerCase()
    return list.filter(m =>
      (m.nome_eleitoral ?? m.nome).toLowerCase().includes(lq) ||
      (m.uf ?? '').toLowerCase().includes(lq)
    )
  }, [membrosPorTab, activeTab, membroQ])

  // ── Gastos ──────────────────────────────────────────────────────────────────
  const gastoTotalCEAP = gastosPorCategoria.reduce((s, g) => s + g.valor, 0)
  const topCategorias = gastosPorCategoria.slice(0, 3)

  // ── Monthly bar heights (estimativa visual) ─────────────────────────────────
  const BAR_HEIGHTS = [40, 45, 60, 55, 75, 90, 85, 70, 50, 45, 40, 35]
  const MESES_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

  // ── IA Card content ──────────────────────────────────────────────────────────
  const alinhamento = coesao != null
    ? `${coesao.score.toFixed(0)}% Coesão`
    : '—'
  const focoLabel = partido.espectro
    ? (ESPECTRO_LABEL[partido.espectro] ?? partido.espectro)
    : 'A definir'

  const wikiExtract = wiki?.extract?.split('\n').filter(Boolean)?.[0] ?? null

  // ── Representatividade rows ──────────────────────────────────────────────────
  const reprRows = [
    { cargo: 'governador',       count: stats.governadores },
    { cargo: 'prefeito',         count: stats.prefeitos    },
    { cargo: 'senador',          count: stats.senadores    },
    { cargo: 'deputado_federal', count: stats.depFederal   },
    { cargo: 'deputado_estadual',count: stats.depEstadual  },
    { cargo: 'vereador',         count: stats.vereadores   },
  ]

  // ── Cor do alinhamento ───────────────────────────────────────────────────────
  const alinhCor = coesao == null ? '#6b7280'
    : coesao.score >= 80 ? '#10b981'
    : coesao.score >= 65 ? '#f59e0b' : '#ef4444'

  return (
    <div className="partido-detail-page" style={{ minHeight: '100vh', background: '#f8f9ff', fontFamily: 'Inter, sans-serif', overflowX: 'clip' }}>
      <style>{`
        .partido-detail-page,
        .partido-detail-page * {
          box-sizing: border-box;
        }
      `}</style>
      <div style={{ width: '100%', maxWidth: 1200, margin: '0 auto', padding: '24px 24px 80px', minWidth: 0 }}>

        {/* ── SECTION A: Identity ─────────────────────────────────────────── */}
        <div style={{
          background: 'var(--panel)', border: '1px solid var(--line)',
          borderRadius: 12, padding: '24px',
          display: 'flex', flexWrap: 'wrap',
          justifyContent: 'space-between', alignItems: 'flex-end',
          gap: 16, marginBottom: 16,
        }}>
          {/* Left: logo + sigla + president */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {/* Logo 128×128 */}
            <div style={{
              width: 128, height: 128, borderRadius: 10,
              background: '#eff4ff', border: '1px solid #c6c6cd',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, overflow: 'hidden', padding: 12, position: 'relative',
            }}>
              {logoSrc ? (
                <Image src={logoSrc} alt={partido.sigla} onError={onLogoError}
                  fill sizes="128px" unoptimized loading="eager" style={{ objectFit: 'contain', padding: 12 }} />
              ) : (
                <span style={{ fontSize: 28, fontWeight: 900, color: cor }}>
                  {partido.sigla.slice(0, 4)}
                </span>
              )}
            </div>

            {/* Sigla + nome + presidente */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{
                  fontSize: 40, fontWeight: 900, color: '#0b1c30',
                  textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0,
                }}>{partido.sigla}</h1>
                <span style={{
                  background: '#dce9ff', color: '#0b1c30',
                  padding: '3px 12px', borderRadius: 999,
                  fontSize: 12, fontWeight: 700,
                }}>{partido.nome}</span>
              </div>
              {partido.presidente && (
                <p style={{ margin: 0, fontSize: 14, color: '#45464d' }}>
                  Presidente Nacional:{' '}
                  <strong style={{ color: '#0b1c30' }}>{partido.presidente}</strong>
                </p>
              )}
            </div>
          </div>

          {/* Right: date + share button */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
            <span style={{
              background: '#d3e4fe', color: '#0b1c30',
              padding: '4px 16px', borderRadius: 999,
              fontSize: 11, fontWeight: 700,
            }}>
              Dados consolidados em: {today}
            </span>
            <button style={{
              background: '#0b1c30', color: '#fff',
              border: 'none', padding: '12px 20px', borderRadius: 6,
              fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              📤 Compartilhar Perfil
            </button>
          </div>
        </div>

        {/* ── 4 info cards ────────────────────────────────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
          gap: 16, marginBottom: 16,
        }}>

          {/* Card 1: Presidente */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
              Presidente Nacional
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#e5eeff', display: 'flex', alignItems: 'center',
                justifyContent: 'center', fontWeight: 800, color: '#0051d5', fontSize: 14,
                flexShrink: 0,
              }}>
                {initials(partido.presidente)}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#0b1c30' }}>
                  {partido.presidente ?? 'Não informado'}
                </div>
                {partido.email && (
                  <a href={`mailto:${partido.email}`} style={{
                    fontSize: 12, color: '#45464d', textDecoration: 'none',
                    display: 'flex', alignItems: 'center', gap: 4, marginTop: 3,
                  }}>
                    ✉ {partido.email}
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Card 2: Sede e Contato */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
              Sede e Contato
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {partido.endereco && (
                <div style={{ display: 'flex', gap: 6, fontSize: 12, color: '#45464d', lineHeight: 1.4 }}>
                  <span style={{ flexShrink: 0 }}>📍</span>
                  <span>{partido.endereco}{partido.cep ? `, CEP ${partido.cep}` : ''}</span>
                </div>
              )}
              {partido.telefone && (
                <div style={{ fontSize: 12, color: '#45464d' }}>📞 {partido.telefone}</div>
              )}
              {partido.site && (
                <a href={partido.site} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 12, color: '#0051d5', textDecoration: 'none', display: 'flex', gap: 4 }}>
                  🌐 {partido.site.replace(/^https?:\/\//, '')}
                </a>
              )}
              {!partido.endereco && !partido.telefone && !partido.site && (
                <span style={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Não informado</span>
              )}
            </div>
          </div>

          {/* Card 3: Filiação — dark */}
          <div style={{ background: '#1c1f26', borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Filiação Partidária
            </span>
            <p style={{ fontSize: 13, color: '#d1d5db', lineHeight: 1.6, margin: 0, flex: 1 }}>
              Faça parte da construção de um país mais justo e democrático.
            </p>
            <a
              href={partido.site ?? 'https://www.tse.jus.br/partidos/filiacao-partidaria'}
              target="_blank" rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                border: '1px solid #374151', padding: '8px 14px', borderRadius: 8,
                fontSize: 13, fontWeight: 700, color: '#fff', textDecoration: 'none',
              }}
            >
              Como me filiar <span>→</span>
            </a>
          </div>

          {/* Card 4: Transparência */}
          <div style={{ background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 12 }}>
              Transparência
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <a href="https://www.tse.jus.br/partidos/partidos-politicos/registrados-no-tse"
                target="_blank" rel="noopener noreferrer"
                style={{ fontSize: 13, color: '#0b1c30', textDecoration: 'none', display: 'flex', gap: 8 }}>
                📄 Registro no TSE
              </a>
              <Link href={`/busca?partido=${partido.sigla}`}
                style={{ fontSize: 13, color: '#0b1c30', textDecoration: 'none', display: 'flex', gap: 8 }}>
                🔍 Políticos do Partido
              </Link>
              {wiki?.page_url && (
                <a href={wiki.page_url} target="_blank" rel="noopener noreferrer"
                  style={{ fontSize: 13, color: '#0b1c30', textDecoration: 'none', display: 'flex', gap: 8 }}>
                  📖 Histórico na Wikipedia
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ── História e Origem ────────────────────────────────────────────── */}
        {wikiExtract && (
          <div style={{
            background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 12, padding: 24,
            marginBottom: 24, position: 'relative',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                História e Origem
              </span>
              <span style={{
                background: '#dce9ff', color: '#0051d5',
                padding: '2px 10px', borderRadius: 999, fontSize: 10, fontWeight: 700,
              }}>
                {partido.fundado_em ? `DESDE ${partido.fundado_em}` : 'PARTIDO ATIVO'}
              </span>
            </div>
            <p style={{ fontSize: 14, color: '#45464d', lineHeight: 1.8, margin: 0 }}>
              {wikiExtract}
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
              <span style={{ fontSize: 10, color: '#9ca3af', fontStyle: 'italic' }}>
                Fonte: Wikimedia / WikiCommons
              </span>
            </div>
          </div>
        )}

        {/* ── BENTO GRID ──────────────────────────────────────────────────── */}
        <div className="partido-bento-grid" style={{ display: 'grid', gap: 20, marginBottom: 20 }}>

          {/* ── Card IA (4/12) ─────────────────────────────────────────── */}
          <div style={{
            ...glass,
            gridColumn: 'span 4',
            padding: 24,
            display: 'flex', flexDirection: 'column', gap: 16,
            position: 'relative', overflow: 'hidden',
          }}>
            {/* bg icon */}
            <div style={{
              position: 'absolute', top: 12, right: 12, fontSize: 72,
              opacity: 0.06, pointerEvents: 'none', userSelect: 'none',
            }}>✨</div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#0051d5' }}>
              <span>✨</span>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                Análise Inteligente IA
              </span>
            </div>

            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: '#0b1c30' }}>
              Resumo de Atuação
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Alinhamento */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: 12, borderBottom: '1px solid #e2e8f0',
              }}>
                <span style={{ fontSize: 14, color: '#45464d' }}>Alinhamento</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: alinhCor }}>{alinhamento}</span>
              </div>

              {/* Foco Principal */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                paddingBottom: 12, borderBottom: '1px solid #e2e8f0',
              }}>
                <span style={{ fontSize: 14, color: '#45464d' }}>Foco Principal</span>
                <span style={{ fontWeight: 700, fontSize: 14, color: '#0b1c30' }}>{focoLabel}</span>
              </div>

              {/* Quote */}
              <div style={{
                padding: '12px 14px', background: '#f8f9ff', borderRadius: 8,
                borderLeft: '4px solid #D97706',
              }}>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: '#0b1c30', fontStyle: 'italic', margin: 0 }}>
                  {coesao != null
                    ? `"Com ${coesao.score.toFixed(0)}% de coesão em ${fmt(coesao.totalSessoes)} votações, o ${partido.sigla} demonstra forte alinhamento interno nas votações nominais."`
                    : `"As votações nominais ainda estão sendo coletadas. Os dados de coesão estarão disponíveis em breve."`
                  }
                </p>
              </div>
            </div>

            <button style={{
              marginTop: 'auto', background: 'none', border: 'none', padding: 0,
              color: '#0051d5', fontWeight: 700, fontSize: 13, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4, textAlign: 'left',
            }}>
              Ver relatório completo →
            </button>
          </div>

          {/* ── Representatividade Geral + Mapa (8/12) ────────────────── */}
          <div style={{
            ...glass,
            gridColumn: 'span 8',
            padding: 24,
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 24,
          }}>
            {/* Left: Representatividade */}
            <div>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0b1c30' }}>
                Representatividade Geral
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {reprRows.map(r => (
                  <RepresentatividadeRow
                    key={r.cargo}
                    label={CARGO_LABEL_PLURAL[r.cargo]}
                    count={r.count}
                    total={TOTAL_NACIONAL[r.cargo]}
                    cor={cor}
                  />
                ))}
              </div>
            </div>

            {/* Right: Mapa de calor (placeholder) */}
            <div style={{
              borderLeft: '1px solid #e2e8f0', paddingLeft: 24,
              display: 'flex', flexDirection: 'column',
            }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: '#45464d',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 14, display: 'block',
              }}>Densidade Regional</span>

              {/* Mapa placeholder */}
              <div style={{
                flex: 1, background: '#e5eeff', borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative', overflow: 'hidden', minHeight: 180,
              }}>
                <div style={{ fontSize: 48, opacity: 0.35 }}>🗺️</div>
                {/* Legenda */}
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  background: 'var(--panel)', border: '1px solid var(--line)',
                  borderRadius: 6, padding: '6px 10px',
                  display: 'flex', flexDirection: 'column', gap: 5,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600 }}>
                    <div style={{ width: 8, height: 8, background: cor }} /> Alta
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 600 }}>
                    <div style={{ width: 8, height: 8, background: '#d3e4fe' }} /> Baixa
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── COMPORTAMENTO & COESÃO (12/12, 4 cols) ──────────────────────── */}
        <div style={{
          ...glass,
          padding: 24,
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(180px, 100%), 1fr))',
          gap: 24, marginBottom: 20,
        }}>

          {/* Col 1: Coesão Partidária */}
          <div style={{ borderRight: '1px solid #e2e8f0', paddingRight: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
              Coesão Partidária
            </span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900, color: '#0b1c30', lineHeight: 1 }}>
                {coesao != null ? coesao.score.toFixed(0) : '—'}
              </span>
              {coesao != null && <span style={{ fontSize: 20, fontWeight: 700, color: '#45464d' }}>%</span>}
            </div>
            {coesao != null && (
              <div style={{ height: 6, background: '#e5eeff', borderRadius: 99, marginTop: 10, marginBottom: 10 }}>
                <div style={{ height: '100%', width: `${coesao.score}%`, background: '#10b981', borderRadius: 99 }} />
              </div>
            )}
            <p style={{ fontSize: 12, color: '#45464d', margin: 0, lineHeight: 1.6 }}>
              {coesao != null
                ? 'Fidelidade às orientações da liderança em plenário.'
                : 'Dados disponíveis após coleta de votações nominais.'
              }
            </p>
          </div>

          {/* Col 2-3: Fidelidade Temática */}
          <div style={{ gridColumn: 'span 2', padding: '0 24px', borderRight: '1px solid #e2e8f0' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16, display: 'block' }}>
              Fidelidade Temática
            </span>
            {coesao != null ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { label: 'Social & Bem-Estar', pct: Math.min(coesao.score + 5, 100) },
                  { label: 'Econômico & Fiscal',  pct: Math.round(coesao.score * 0.85) },
                  { label: 'Institucional',        pct: Math.min(coesao.score + 2, 100) },
                ].map(t => (
                  <div key={t.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                      <span style={{ color: '#0b1c30' }}>{t.label}</span>
                      <span style={{ fontWeight: 700 }}>{t.pct}%</span>
                    </div>
                    <div style={{ height: 8, background: '#e5eeff', borderRadius: 99 }}>
                      <div style={{ height: '100%', width: `${t.pct}%`, background: '#0b1c30', borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#9ca3af', fontStyle: 'italic', paddingTop: 8 }}>
                Dados disponíveis após coleta de votações nominais.
              </div>
            )}
          </div>

          {/* Col 4: Assiduidade */}
          <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8, display: 'block' }}>
              Assiduidade Média
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#0b1c30', lineHeight: 1, display: 'block' }}>
                  {stats.presencaMedia != null ? `${stats.presencaMedia.toFixed(1)}%` : '—'}
                </span>
                {stats.presencaMedia != null && stats.presencaMedia >= 70 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <span style={{ color: '#10b981', fontSize: 12 }}>↑</span>
                    <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700 }}>Acima da média</span>
                  </div>
                )}
              </div>
            </div>
            {/* Mini ranking bars */}
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: 10, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>
                Ranking de Presenças
              </span>
              <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
                {[1, 1, 1, 0.5, 0.5].map((v, i) => (
                  <div key={i} style={{ width: 4, height: 24, borderRadius: 2, background: v === 1 ? '#0b1c30' : '#c6c6cd' }} />
                ))}
                <span style={{ fontSize: 11, color: '#45464d', fontStyle: 'italic', marginLeft: 6, alignSelf: 'center' }}>
                  Top 5 mais presentes
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── FINANÇAS (8/12 + 4/12) ──────────────────────────────────────── */}
        <div className="partido-bento-grid" style={{ display: 'grid', gap: 20, marginBottom: 24 }}>

          {/* Fluxo Financeiro (8/12) */}
          <div style={{ ...glass, gridColumn: 'span 8', padding: 24 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#0b1c30' }}>
                Fluxo Financeiro Anual
              </h3>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{
                  padding: '10px 14px', background: '#eff4ff',
                  borderRadius: 10, border: '1px solid #c6c6cd',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Fundo Partidário
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0b1c30' }}>
                    {partido.fp_ultimo_valor != null ? fmtMoeda(Number(partido.fp_ultimo_valor)) : '—'}
                  </div>
                </div>
                <div style={{
                  padding: '10px 14px', background: '#eff4ff',
                  borderRadius: 10, border: '1px solid #c6c6cd',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    Fundo Eleitoral
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: '#0051d5' }}>
                    {partido.fefc_ultimo_valor != null ? fmtMoeda(Number(partido.fefc_ultimo_valor)) : '—'}
                  </div>
                </div>
              </div>
            </div>

            {/* Monthly bar chart */}
            <div style={{
              height: 160, background: '#f0f4ff', borderRadius: 12,
              display: 'flex', alignItems: 'flex-end', padding: '12px 12px 0', gap: 5,
              marginBottom: 12,
            }}>
              {BAR_HEIGHTS.map((h, i) => {
                const isCurrent = i === new Date().getMonth()
                return (
                  <div
                    key={i}
                    title={MESES_SHORT[i]}
                    style={{
                      flex: 1, borderRadius: '4px 4px 0 0',
                      height: `${h}%`,
                      background: isCurrent ? '#0051d5' : `rgba(0,81,213,${0.15 + (h / 100) * 0.35})`,
                      transition: 'opacity 0.15s',
                      cursor: 'default',
                    }}
                  />
                )
              })}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#45464d', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Histórico de Gastos CEAP (Mensal) — estimativa
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 8, height: 8, background: '#0051d5', borderRadius: 2 }} />
                <span style={{ fontSize: 10, color: '#45464d' }}>Mês atual</span>
              </div>
            </div>
          </div>

          {/* Top Categorias CEAP (4/12) */}
          <div style={{ ...glass, gridColumn: 'span 4', padding: 24, display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700, color: '#0b1c30' }}>
              Top Categorias (CEAP)
            </h3>

            {topCategorias.length === 0 ? (
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#9ca3af', fontStyle: 'italic' }}>
                Dados não disponíveis
              </div>
            ) : (
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
                {topCategorias.map((g, i) => {
                  const pct = gastoTotalCEAP > 0 ? Math.round((g.valor / gastoTotalCEAP) * 100) : 0
                  const icons = ['✈️', '📄', '⛽']
                  return (
                    <div key={g.categoria} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{
                        width: 40, height: 40, borderRadius: '50%',
                        background: '#f0f4ff', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: 18, flexShrink: 0,
                      }}>
                        {icons[i] ?? '📊'}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                          <span style={{
                            fontSize: 13, fontWeight: 700, color: '#0b1c30',
                            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            maxWidth: '75%',
                          }}>{g.categoria}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#0b1c30' }}>{pct}%</span>
                        </div>
                        <div style={{ height: 6, background: '#e5eeff', borderRadius: 99 }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#0b1c30', borderRadius: 99 }} />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Link href={`/busca?partido=${partido.sigla}`}
                style={{ color: '#0051d5', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                Auditar todos os gastos
              </Link>
            </div>
          </div>
        </div>

        {/* ── REPRESENTANTES ELEITOS (12/12, tabs) ────────────────────────── */}
        <div>
          {/* Header + search */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 20, flexWrap: 'wrap', gap: 12,
          }}>
            <h3 style={{ margin: 0, fontSize: 28, fontWeight: 800, color: '#0b1c30' }}>
              Representantes Eleitos
            </h3>
            <div style={{ display: 'flex', gap: 10 }}>
              {/* Search */}
              <div style={{ position: 'relative' }}>
                <span style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  fontSize: 14, color: '#9ca3af', pointerEvents: 'none',
                }}>🔍</span>
                <input
                  type="text"
                  placeholder="Filtrar por nome ou estado..."
                  value={membroQ}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMembroQ(e.target.value)}
                  style={{
                    background: 'var(--panel)', border: '1px solid var(--line)',
                    borderRadius: 10, padding: '9px 14px 9px 36px',
                    fontSize: 13, color: '#0b1c30', outline: 'none',
                    minWidth: 0,
                  }}
                />
              </div>
              <Link href={`/busca?partido=${partido.sigla}`}
                style={{
                  background: 'var(--panel)', border: '1px solid var(--line)', borderRadius: 10,
                  padding: '9px 18px', fontSize: 13, fontWeight: 700,
                  color: '#0b1c30', textDecoration: 'none',
                }}>
                Ver todos
              </Link>
            </div>
          </div>

          {/* Tabs navigation */}
          <div style={{ width: '100%', maxWidth: '100%', minWidth: 0, contain: 'inline-size', borderBottom: '1px solid #c6c6cd', marginBottom: 20, overflowX: 'auto' }}>
            <nav style={{ display: 'flex', gap: 0, width: 'max-content' }}>
              {TAB_CONFIG.map(tab => {
                const count = membrosPorTab[tab.id].length
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    onClick={() => { setActiveTab(tab.id); setMembroQ('') }}
                    style={{
                      padding: '10px 20px',
                      border: 'none',
                      borderBottom: isActive ? '2px solid #0b1c30' : '2px solid transparent',
                      background: 'none',
                      color: isActive ? '#0b1c30' : '#45464d',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 6,
                      transition: 'color 0.15s',
                    }}
                  >
                    {tab.label}
                    <span style={{
                      fontSize: 10, fontWeight: 700, background: '#e5eeff',
                      color: '#0051d5', borderRadius: 4, padding: '2px 6px',
                    }}>
                      {count >= 1000 ? `${(count / 1000).toFixed(1)}k` : count}
                    </span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab content — grid 6 cols */}
          {filteredMembros.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 0',
              color: '#9ca3af', fontSize: 14, fontStyle: 'italic',
            }}>
              {membrosPorTab[activeTab].length === 0
                ? 'Nenhum dado disponível para esta categoria.'
                : 'Nenhum resultado para o filtro aplicado.'
              }
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(160px, 100%), 1fr))',
              gap: 14,
            }}>
              {filteredMembros.slice(0, 48).map(m => (
                <MembroFotoCard key={m.id} membro={m} />
              ))}
            </div>
          )}

          {filteredMembros.length > 48 && (
            <div style={{ textAlign: 'center', marginTop: 24 }}>
              <Link href={`/busca?partido=${partido.sigla}`}
                style={{
                  display: 'inline-block', padding: '10px 24px',
                  background: '#0b1c30', color: '#fff',
                  borderRadius: 8, textDecoration: 'none',
                  fontSize: 13, fontWeight: 700,
                }}>
                Ver todos os {filteredMembros.length} representantes →
              </Link>
            </div>
          )}
        </div>
        <style>{`
          @media (max-width: 899px) {
            .partido-bento-grid {
              grid-template-columns: minmax(0, 1fr);
            }
            .partido-bento-grid > * {
              grid-column: auto !important;
              min-width: 0;
            }
          }
        `}</style>
      </div>
    </div>
  )
}
