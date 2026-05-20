'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Props = {
  /** The jargon word/phrase shown inline */
  termo: string
  /** Slug to link to /glossario/[slug] */
  slug: string
  /** Short definition shown in tooltip — fetch lazily */
  definicaoSimples?: string
  children?: React.ReactNode
}

/**
 * GlossarioTooltip — wraps any jargon word with an underline + popover.
 *
 * Usage:
 *   <GlossarioTooltip termo="CEAP" slug="ceap">CEAP</GlossarioTooltip>
 *   <GlossarioTooltip termo="Emenda parlamentar" slug="emenda-parlamentar" definicaoSimples="..." />
 *
 * When definicaoSimples is not provided, it fetches on first hover via /api/glossario/[slug].
 */
export function GlossarioTooltip({ termo, slug, definicaoSimples: initialDef, children }: Props) {
  const [open, setOpen] = useState(false)
  const [def, setDef] = useState<string | null>(initialDef ?? null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lazy fetch if no initial definition
  const fetchDef = async () => {
    if (def || loading) return
    setLoading(true)
    try {
      const res = await fetch(`/api/glossario/${slug}`)
      if (res.ok) {
        const json = await res.json()
        setDef(json.definicao_simples ?? null)
      }
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => {
      setOpen(true)
      fetchDef()
    }, 200)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setOpen(false)
  }

  const handleFocus = () => {
    setOpen(true)
    fetchDef()
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  return (
    <span
      ref={ref}
      style={{ position: 'relative', display: 'inline' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={() => setOpen(false)}
    >
      {/* Underlined trigger */}
      <span
        tabIndex={0}
        role="button"
        aria-describedby={open ? `tooltip-${slug}` : undefined}
        style={{
          cursor: 'help',
          borderBottom: '1px dashed var(--brand)',
          color: 'inherit',
          outline: 'none',
        }}
      >
        {children ?? termo}
      </span>

      {/* Tooltip popover */}
      {open && (
        <span
          id={`tooltip-${slug}`}
          role="tooltip"
          style={{
            position: 'absolute',
            bottom: 'calc(100% + 8px)',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderRadius: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
            padding: '10px 14px',
            minWidth: 220,
            maxWidth: 300,
            pointerEvents: 'auto',
          }}
        >
          {/* Arrow */}
          <span style={{
            position: 'absolute',
            bottom: -5,
            left: '50%',
            transform: 'translateX(-50%) rotate(45deg)',
            width: 8, height: 8,
            background: 'var(--panel)',
            border: '1px solid var(--line)',
            borderTop: 'none', borderLeft: 'none',
          }} />

          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', marginBottom: 5, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>
            {termo}
          </div>

          {loading ? (
            <div style={{ fontSize: 12, color: 'var(--mute)' }}>Carregando...</div>
          ) : def ? (
            <div style={{ fontSize: 12.5, color: 'var(--ink-2)', lineHeight: 1.55 }}>
              {def.length > 140 ? def.slice(0, 137) + '…' : def}
            </div>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--mute)', fontStyle: 'italic' }}>
              Definição não encontrada.
            </div>
          )}

          <Link
            href={`/glossario/${slug}`}
            style={{
              display: 'inline-block',
              marginTop: 8,
              fontSize: 11,
              color: 'var(--brand-2)',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Ver definição completa →
          </Link>
        </span>
      )}
    </span>
  )
}

/**
 * Static list of common political jargon for quick reference.
 * Use this to wrap hardcoded terms throughout the site.
 */
export const TERMOS_GLOSSARIO: Record<string, { slug: string; definicaoSimples: string }> = {
  'CEAP': {
    slug: 'ceap',
    definicaoSimples: 'Cota para o Exercício da Atividade Parlamentar — verba mensal de até R$50 mil que cada deputado pode gastar com passagens, hospedagem, alimentação e outros custos de seu trabalho.',
  },
  'emenda parlamentar': {
    slug: 'emenda-parlamentar',
    definicaoSimples: 'Verba que cada deputado ou senador indica para ser gasta em obras ou serviços em sua região. É uma das principais formas de os parlamentares direcionar recursos públicos para seus redutos eleitorais.',
  },
  'Emenda Pix': {
    slug: 'emenda-pix',
    definicaoSimples: 'Tipo de emenda parlamentar criada em 2023 onde o dinheiro vai direto para o município sem precisar de convênio. É mais rápida, mas tem menos controle de uso.',
  },
  'PL': {
    slug: 'pl',
    definicaoSimples: 'Projeto de Lei — proposta de criar ou mudar uma lei, apresentada por um deputado, senador ou pelo Executivo. Precisa ser aprovada pela Câmara, pelo Senado e sancionada pelo Presidente.',
  },
  'PEC': {
    slug: 'pec',
    definicaoSimples: 'Proposta de Emenda Constitucional — proposta para mudar a Constituição. É mais difícil de aprovar: precisa de 3/5 dos votos em dois turnos em cada Casa do Congresso.',
  },
  'MPV': {
    slug: 'mpv',
    definicaoSimples: 'Medida Provisória — ato do Presidente com força de lei imediata, usado em casos de urgência. Precisa ser convertida em lei pelo Congresso em até 120 dias ou perde a validade.',
  },
  'quórum': {
    slug: 'quorum',
    definicaoSimples: 'Número mínimo de parlamentares presentes para que uma votação seja válida. Para leis ordinárias é maioria simples; para PECs é maioria absoluta (mais de 50% de todos os membros).',
  },
  'plenário': {
    slug: 'plenario',
    definicaoSimples: 'O salão principal onde todos os deputados ou senadores se reúnem para debater e votar as propostas. É onde as decisões finais são tomadas.',
  },
  'CPI': {
    slug: 'cpi',
    definicaoSimples: 'Comissão Parlamentar de Inquérito — criada para investigar fatos de relevância para a administração pública. Tem poderes semelhantes aos da Justiça para convocar pessoas e solicitar documentos.',
  },
  'TSE': {
    slug: 'tse',
    definicaoSimples: 'Tribunal Superior Eleitoral — responsável por organizar as eleições, registrar candidatos e partidos, e julgar disputas eleitorais no Brasil.',
  },
}
