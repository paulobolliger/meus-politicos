'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'

type Projeto = {
  id: string
  slug: string | null
  tipo: string
  numero: string
  ano: number
  ementa: string | null
  ementa_simples: string | null
  titulo_simplificado: string | null
  situacao: string | null
  data_apresentacao: string | null
  atualizado_em: string | null
  autor_nome: string | null
  autor_foto: string | null
  autor_slug: string | null
}

type Props = {
  projetos: Projeto[]
}

type SituacaoInfo = { label: string; bg: string; color: string }

function situacaoInfo(s: string | null): SituacaoInfo {
  if (!s) return { label: '—', bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--ink-3)' }
  const lower = s.toLowerCase()
  if (lower.includes('tramit') || lower.includes('andamento') || lower.includes('votaç'))
    return { label: 'Em Votação', bg: 'var(--warn-soft)', color: 'var(--warn)' }
  if (lower.includes('aprovad') || lower.includes('sancionad') || lower.includes('promulgad'))
    return { label: 'Aprovado',   bg: 'var(--pos-soft)', color: 'var(--pos)' }
  if (lower.includes('arquivad') || lower.includes('retirad') || lower.includes('prejudicad'))
    return { label: 'Arquivado',  bg: 'rgba(255, 255, 255, 0.08)', color: 'var(--ink-3)' }
  if (lower.includes('vetad') || lower.includes('rejeitad'))
    return { label: 'Vetado',     bg: 'var(--neg-soft)', color: 'var(--neg)' }
  return { label: s.length > 22 ? s.slice(0, 22) + '…' : s, bg: 'rgba(255, 255, 255, 0.05)', color: 'var(--ink-3)' }
}

function iniciais(nome: string) {
  return nome.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')
}

function extrairTitulo(ementa: string | null, ementa_simples: string | null): string {
  if (ementa_simples) return ementa_simples.length > 80 ? ementa_simples.slice(0, 80) + '…' : ementa_simples
  if (!ementa) return 'Sem título'
  const dot = ementa.search(/[.;—–]/)
  if (dot > 10 && dot < 90) return ementa.slice(0, dot)
  return ementa.length > 70 ? ementa.slice(0, 70) + '…' : ementa
}

export function ProjetosViewSelector({ projetos }: Props) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: `
        .projeto-card {
          transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .projeto-card:hover {
          transform: translateY(-2px);
          border-color: rgba(139, 92, 246, 0.4) !important;
          box-shadow: 0 12px 30px -10px rgba(0,0,0,0.5), 0 0 15px -3px rgba(139,92,246,0.1) !important;
        }
        .projeto-row-item {
          transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .projeto-row-item:hover {
          transform: translateX(2px);
          border-color: rgba(139, 92, 246, 0.3) !important;
          box-shadow: 0 4px 20px -5px rgba(0,0,0,0.3) !important;
        }
        .stretched-link::after {
          position: absolute;
          top: 0;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 1;
          content: "";
        }
      ` }} />

      {/* Visualização Toggle Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        borderBottom: '1px solid var(--line)',
        paddingBottom: 12,
      }}>
        <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', fontWeight: 700, letterSpacing: '0.06em' }}>
          {projetos.length === 1 ? '1 PROJETO NESTA PÁGINA' : `${projetos.length} PROJETOS NESTA PÁGINA`}
        </span>

        {/* Toggle buttons */}
        <div style={{
          display: 'flex',
          background: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 8,
          padding: 2,
          border: '1px solid var(--line)',
        }}>
          <button
            type="button"
            onClick={() => setViewMode('grid')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              background: viewMode === 'grid' ? 'var(--panel)' : 'transparent',
              color: viewMode === 'grid' ? 'white' : 'var(--ink-3)',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>
            </svg>
            Cards
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: 'none',
              padding: '6px 12px',
              borderRadius: 6,
              fontSize: 11,
              fontWeight: 700,
              cursor: 'pointer',
              background: viewMode === 'list' ? 'var(--panel)' : 'transparent',
              color: viewMode === 'list' ? 'white' : 'var(--ink-3)',
              fontFamily: 'var(--font-sans)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" x2="21" y1="6" y2="6"/><line x1="3" x2="21" y1="12" y2="12"/><line x1="3" x2="21" y1="18" y2="18"/>
            </svg>
            Lista
          </button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(300px, 100%), 1fr))',
          gap: 24,
        }}>
          {projetos.map((p) => {
            const sit = situacaoInfo(p.situacao)
            const titulo = p.titulo_simplificado || extrairTitulo(p.ementa, p.ementa_simples)
            const descricao = (p.titulo_simplificado || p.ementa_simples) ? p.ementa : null
            const href = p.slug ? `/projetos/${p.slug}` : null
            const dataUlt = p.atualizado_em ?? p.data_apresentacao
            const dataStr = dataUlt ? new Date(dataUlt).toLocaleDateString('pt-BR') : null

            return (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: '100%',
                }}
                className="projeto-card"
              >
                {/* Top */}
                <div>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 16,
                    gap: 8,
                  }}>
                    <span style={{
                      fontSize: 13, fontWeight: 600,
                      background: 'rgba(99, 102, 241, 0.12)',
                      color: '#818CF8',
                      padding: '3px 8px',
                      borderRadius: 4,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {p.tipo} {p.numero}/{p.ano}
                    </span>
                    <span style={{
                      fontSize: 10, fontWeight: 700,
                      letterSpacing: '0.05em',
                      textTransform: 'uppercase',
                      background: sit.bg,
                      color: sit.color,
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontFamily: 'var(--font-mono)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}>
                      {sit.label}
                    </span>
                  </div>

                  <h3 style={{
                    margin: '0 0 8px',
                    fontSize: 18, fontWeight: 700,
                    lineHeight: 1.35,
                    color: 'var(--ink)',
                  }}>
                    {href ? (
                      <Link href={href} className="stretched-link" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                        {titulo}
                      </Link>
                    ) : titulo}
                  </h3>

                  {descricao && (
                    <p style={{
                      margin: '0 0 16px',
                      fontSize: 14, lineHeight: 1.55,
                      color: '#94A3B8',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {descricao}
                    </p>
                  )}
                </div>

                {/* Bottom */}
                <div style={{
                  borderTop: '1px solid #334155',
                  paddingTop: 16,
                  marginTop: 16,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}>
                  {p.autor_nome && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {p.autor_slug ? (
                        <Link href={`/politicos/${p.autor_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', position: 'relative', zIndex: 2 }}>
                          {p.autor_foto ? (
                            <Image
                              src={p.autor_foto}
                              alt={p.autor_nome}
                              width={32} height={32}
                              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              unoptimized
                            />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: '#dce9ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: 'var(--ink-2)',
                              flexShrink: 0,
                            }}>
                              {iniciais(p.autor_nome)}
                            </div>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }} className="hover:underline">
                            {p.autor_nome}
                          </span>
                        </Link>
                      ) : (
                        <>
                          {p.autor_foto ? (
                            <Image
                              src={p.autor_foto}
                              alt={p.autor_nome}
                              width={32} height={32}
                              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              unoptimized
                            />
                          ) : (
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%',
                              background: '#dce9ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 11, fontWeight: 700, color: 'var(--ink-2)',
                              flexShrink: 0,
                            }}>
                              {iniciais(p.autor_nome)}
                            </div>
                          )}
                          <span style={{ fontSize: 14, fontWeight: 600, color: '#F8FAFC' }}>
                            {p.autor_nome}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: 10, letterSpacing: '0.05em',
                      textTransform: 'uppercase', fontFamily: 'var(--font-mono)',
                      color: '#94A3B8',
                    }}>
                      Última atualização
                    </span>
                    {dataStr && (
                      <span style={{
                        fontSize: 13, fontFamily: 'var(--font-mono)',
                        color: '#CBD5E1', fontVariantNumeric: 'tabular-nums',
                      }}>
                        {dataStr}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}>
          {projetos.map((p) => {
            const sit = situacaoInfo(p.situacao)
            const titulo = p.titulo_simplificado || extrairTitulo(p.ementa, p.ementa_simples)
            const href = p.slug ? `/projetos/${p.slug}` : null
            const dataUlt = p.atualizado_em ?? p.data_apresentacao
            const dataStr = dataUlt ? new Date(dataUlt).toLocaleDateString('pt-BR') : null

            return (
              <div
                key={p.id}
                style={{
                  position: 'relative',
                  background: 'var(--panel)',
                  border: '1px solid var(--line)',
                  borderRadius: 12,
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                  flexWrap: 'wrap',
                }}
                className="projeto-row-item"
              >
                {/* Left side: Type badge + Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flex: '1 1 500px', minWidth: 0 }}>
                  <span style={{
                    fontSize: 12, fontWeight: 700,
                    background: 'rgba(99, 102, 241, 0.12)',
                    color: '#818CF8',
                    padding: '4px 8px',
                    borderRadius: 4,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}>
                    {p.tipo} {p.numero}/{p.ano}
                  </span>

                  <h3 style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    color: 'var(--ink)',
                    lineHeight: 1.4,
                  }}>
                    {href ? (
                      <Link href={href} className="stretched-link" style={{ color: 'var(--ink)', textDecoration: 'none' }}>
                        {titulo}
                      </Link>
                    ) : titulo}
                  </h3>
                </div>

                {/* Right side: Status + Author + Date */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flex: '0 0 auto',
                  marginLeft: 'auto',
                  flexWrap: 'wrap',
                }}>
                  {/* Status Pill */}
                  <span style={{
                    fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    background: sit.bg,
                    color: sit.color,
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontFamily: 'var(--font-mono)',
                    whiteSpace: 'nowrap',
                  }}>
                    {sit.label}
                  </span>

                  {/* Author */}
                  {p.autor_nome && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative', zIndex: 2 }}>
                      {p.autor_slug ? (
                        <Link href={`/politicos/${p.autor_slug}`} style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                          {p.autor_foto ? (
                            <Image
                              src={p.autor_foto}
                              alt={p.autor_nome}
                              width={24} height={24}
                              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              unoptimized
                            />
                          ) : (
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#dce9ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 700, color: 'var(--ink-2)',
                              flexShrink: 0,
                            }}>
                              {iniciais(p.autor_nome)}
                            </div>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }} className="hover:underline">
                            {p.autor_nome}
                          </span>
                        </Link>
                      ) : (
                        <>
                          {p.autor_foto ? (
                            <Image
                              src={p.autor_foto}
                              alt={p.autor_nome}
                              width={24} height={24}
                              style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                              unoptimized
                            />
                          ) : (
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%',
                              background: '#dce9ff',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 9, fontWeight: 700, color: 'var(--ink-2)',
                              flexShrink: 0,
                            }}>
                              {iniciais(p.autor_nome)}
                            </div>
                          )}
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--ink-2)' }}>
                            {p.autor_nome}
                          </span>
                        </>
                      )}
                    </div>
                  )}

                  {/* Date */}
                  {dataStr && (
                    <span style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono)',
                      color: 'var(--ink-3)',
                      whiteSpace: 'nowrap',
                    }}>
                      {dataStr}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
