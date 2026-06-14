import { getCachedGlossaryTerms } from '@/lib/glossario/cached-terms'
import { highlightGlossary } from '@/lib/glossario/highlighter'
import { isFeatureActive } from '@/lib/flags'
import type { ReactNode } from 'react'

interface GlossaryHighlighterProps {
  children: string | null | undefined
}

/**
 * GlossaryHighlighter — Server Component wrapper to parse and render text with inline tooltips.
 * Fallbacks to rendering raw children if database or parsing fails.
 */
export async function GlossaryHighlighter({ children }: GlossaryHighlighterProps) {
  if (!children) return null

  let highlighted: ReactNode = children
  try {
    const active = await isFeatureActive('glossario_tooltips')
    if (active) {
      const terms = await getCachedGlossaryTerms()
      if (terms?.length) {
        highlighted = highlightGlossary(children, terms)
      }
    }
  } catch (err) {
    console.error('[GlossaryHighlighter] Failed to highlight terms:', err)
  }

  return <>{highlighted}</>
}
