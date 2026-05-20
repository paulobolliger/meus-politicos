'use client'

import { useEffect, useRef, useState } from 'react'

type ShareButtonProps = {
  nomeEleitoral: string
  slug: string
  cargo: string | null
  uf: string | null
  gastoCeap: number | null
  presencaPct: number | null
  partidoSigla: string | null
}

const SITE_URL = 'https://meuspoliticos.com.br'

function buildTexto({
  nomeEleitoral,
  slug,
  cargo,
  uf,
  gastoCeap,
  presencaPct,
}: ShareButtonProps): string {
  const url = `${SITE_URL}/politicos/${slug}`
  const cargoStr = cargo ? cargo.replace('_', ' ') : 'parlamentar'
  const partes: string[] = [`🔍 ${nomeEleitoral} (${cargoStr.toUpperCase()}${uf ? ' · ' + uf : ''})`]

  if (presencaPct !== null) {
    partes.push(`✅ Presença: ${Math.round(presencaPct)}%`)
  }
  if (gastoCeap !== null) {
    const fmtGasto = gastoCeap >= 1_000_000
      ? `R$ ${(gastoCeap / 1_000_000).toFixed(1)}mi`
      : `R$ ${(gastoCeap / 1_000).toFixed(0)}mil`
    partes.push(`💰 Gastos CEAP: ${fmtGasto}/ano`)
  }

  partes.push(`\nVeja o perfil completo: ${url}`)
  partes.push(`#TransparênciaPolítica #MeusPoliticos`)
  return partes.join('\n')
}

export function ShareButton(props: ShareButtonProps) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const texto = buildTexto(props)
  const url = `${SITE_URL}/politicos/${props.slug}`

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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(texto)}`
  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(texto)}`

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 14px',
          background: 'var(--panel)',
          color: 'var(--ink-2)',
          border: '1px solid var(--line)',
          fontSize: 13,
          fontWeight: 600,
          cursor: 'pointer',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          borderRadius: 4,
        }}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="currentColor">
          <path d="M15 8a3 3 0 1 0-2.977-2.63l-4.94 2.47a3 3 0 1 0 0 4.319l4.94 2.47a3 3 0 1 0 .895-1.789l-4.94-2.47a3.027 3.027 0 0 0 0-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
        </svg>
        Compartilhar
        <svg width="10" height="10" viewBox="0 0 20 20" fill="currentColor" style={{ opacity: 0.5 }}>
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          left: 0,
          zIndex: 100,
          background: 'var(--panel)',
          border: '1px solid var(--line)',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.14)',
          minWidth: 220,
          overflow: 'hidden',
        }}>
          {/* Preview */}
          <div style={{
            padding: '10px 14px',
            background: 'var(--bg-2)',
            borderBottom: '1px solid var(--line-soft)',
            fontSize: 11,
            color: 'var(--ink-3)',
            lineHeight: 1.5,
            whiteSpace: 'pre-line',
            maxHeight: 100,
            overflow: 'hidden',
          }}>
            {texto.split('\n').slice(0, 4).join('\n')}
          </div>

          {/* Actions */}
          <div style={{ padding: 6, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <a
              href={twitterUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6,
                textDecoration: 'none', fontSize: 13, fontWeight: 500, color: 'var(--ink)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: 'center' }}>𝕏</span>
              Compartilhar no Twitter/X
            </a>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6,
                textDecoration: 'none', fontSize: 13, fontWeight: 500, color: 'var(--ink)',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: 'center', color: '#25D366' }}>✉</span>
              Enviar pelo WhatsApp
            </a>
            <button
              onClick={() => { handleCopy(); setOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 10px', borderRadius: 6,
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: 500, color: copied ? 'var(--pos)' : 'var(--ink)',
                width: '100%', textAlign: 'left',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--bg-2)' }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent' }}
            >
              <span style={{ fontSize: 16, lineHeight: 1, width: 20, textAlign: 'center' }}>
                {copied ? '✓' : '🔗'}
              </span>
              {copied ? 'Link copiado!' : 'Copiar link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
