import { getCachedGlossaryTerms } from '@/lib/glossario/cached-terms'
import { highlightGlossary } from '@/lib/glossario/highlighter'
import { isFeatureActive } from '@/lib/flags'

interface GlossaryHighlighterProps {
  children: string | null | undefined
}

/**
 * GlossaryHighlighter — Server Component wrapper to parse and render text with inline tooltips.
 * Fallbacks to rendering raw children if database or parsing fails.
 */
export async function GlossaryHighlighter({ children }: GlossaryHighlighterProps) {
  if (!children) return null
  
  try {
    const active = await isFeatureActive('glossario_tooltips')
    if (!active) {
      return <>{children}</>
    }
    const terms = await getCachedGlossaryTerms()
    if (!terms || terms.length === 0) {
      return <>{children}</>
    }
    const highlighted = highlightGlossary(children, terms)
    return <>{highlighted}</>
  } catch (err) {
    console.error('[GlossaryHighlighter] Failed to highlight terms:', err)
    return <>{children}</>
  }
}
