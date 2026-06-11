'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

type Props = {
  /** The jargon word/phrase shown inline */
  termo: string
  /** Slug to link to /glossario/[slug] */
  slug: string
  /** Short definition shown in tooltip */
  definicaoSimples?: string
  children?: React.ReactNode
}

/**
 * GlossarioTooltip — wraps a word with dotted underline and displays a hover popover card.
 */
export function GlossarioTooltip({ termo, slug, definicaoSimples: initialDef, children }: Props) {
  const [open, setOpen] = useState(false)
  const [def, setDef] = useState<string | null>(initialDef ?? null)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Lazy fetch if no initial definition is passed
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
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setOpen(true)
      fetchDef()
    }, 200)
  }

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setOpen(false)
    }, 150)
  }

  const handleFocus = () => {
    setOpen(true)
    fetchDef()
  }

  // Close on click outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <span
      ref={ref}
      className="relative inline"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={() => setOpen(false)}
    >
      {/* Trigger word with dotted underline */}
      <Link
        href={`/glossario/${slug}`}
        tabIndex={0}
        role="button"
        aria-describedby={open ? `tooltip-${slug}` : undefined}
        className="cursor-help border-b border-dotted border-indigo-400 font-medium hover:text-indigo-400 transition-colors focus:outline-none"
      >
        {children ?? termo}
      </Link>

      {/* Popover overlay */}
      {open && (
        <span
          id={`tooltip-${slug}`}
          role="tooltip"
          onMouseEnter={() => {
            if (timerRef.current) clearTimeout(timerRef.current)
            setOpen(true)
          }}
          onMouseLeave={handleMouseLeave}
          className="absolute bottom-[calc(100%+8px)] left-1/2 -translate-x-1/2 z-[250] bg-slate-950/95 border border-slate-800 text-slate-100 rounded-xl shadow-xl shadow-black/40 p-3.5 min-w-[240px] max-w-[320px] pointer-events-auto block animate-in fade-in slide-in-from-bottom-1 duration-150"
        >
          {/* Arrow indicator */}
          <span className="absolute bottom-[-5px] left-1/2 -translate-x-1/2 rotate-45 w-2 h-2 bg-slate-950 border border-slate-800 border-t-0 border-l-0" />

          {/* Header */}
          <div className="text-[10px] font-mono font-bold text-indigo-400 mb-1.5 uppercase tracking-wider">
            {termo}
          </div>

          {/* Definition */}
          {loading ? (
            <div className="text-xs text-slate-500 animate-pulse font-mono">Carregando explicação...</div>
          ) : def ? (
            <div className="text-xs text-slate-300 leading-relaxed font-sans">
              {def.length > 140 ? def.slice(0, 137) + '…' : def}
            </div>
          ) : (
            <div className="text-xs text-slate-500 italic font-sans">
              Definição indisponível no momento.
            </div>
          )}

          {/* Footer Link */}
          <span className="block mt-2.5 pt-2 border-t border-slate-800/60">
            <span className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 font-sans inline-flex items-center gap-1">
              Ver verbete completo <span>→</span>
            </span>
          </span>
        </span>
      )}
    </span>
  )
}

/**
 * Static list of common political jargon for quick reference.
 * Exposing this to support legacy references on other pages.
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

