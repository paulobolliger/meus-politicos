import React from 'react'
import { GlossarioTooltip } from '@/components/glossario/GlossarioTooltip'
import { GlossaryTerm } from './cached-terms'

/**
 * Generates singular and plural forms for Portuguese words.
 */
function makePlural(word: string): string {
  const lower = word.toLowerCase()
  // Exclusões para palavras de ligação
  if (['da', 'do', 'de', 'à', 'a', 'o', 'em', 'para'].includes(lower)) {
    return word
  }
  if (lower.endsWith('ão')) {
    return word.slice(0, -2) + 'ões' // Comissão -> Comissões
  }
  if (lower.endsWith('r') || lower.endsWith('s') || lower.endsWith('z')) {
    return word + 'es' // Parlamentar -> Parlamentares
  }
  if (lower.endsWith('l')) {
    return word.slice(0, -1) + 'is' // Federal -> Federais
  }
  return word + 's' // Emenda -> Emendas
}

/**
 * Generates matches for a glossary term, including acronyms and plural forms.
 */
export function getTermPatterns(termo: string): string[] {
  const patterns: string[] = []
  
  // Extrair parênteses se houver. Ex: "PPA (Plano Plurianual)" -> ["PPA", "Plano Plurianual"]
  const parenRegex = /^([^(]+)\(([^)]+)\)$/
  const match = termo.match(parenRegex)
  
  const parts: string[] = []
  if (match) {
    parts.push(match[1].trim())
    parts.push(match[2].trim())
  } else {
    parts.push(termo.trim())
  }
  
  for (const part of parts) {
    patterns.push(part)
    
    const lower = part.toLowerCase()
    
    // Tratamento de siglas conhecidas (ex: PEC, LDO, PL, etc)
    const isSigla = /^[A-Z]{2,6}$/.test(part) || ['pec', 'ldo', 'loa', 'ppa', 'ceap', 'cgu', 'tcu', 'pl', 'plp', 'pdl', 'siafi'].includes(lower)
    
    if (isSigla) {
      patterns.push(part + 's') // PECs, PLs, LDOs
      patterns.push(part.toLowerCase())
      patterns.push(part.toLowerCase() + 's')
    } else if (lower.includes(' de ') || lower.includes(' para ') || lower.includes(' da ') || lower.includes(' do ')) {
      // Frases compostas. Ex: "Projeto de Lei" -> pluralizar a primeira palavra: "Projetos de Lei"
      const words = part.split(' ')
      const first = words[0]
      const rest = words.slice(1).join(' ')
      
      const firstPlural = makePlural(first)
      patterns.push(`${firstPlural} ${rest}`)
    } else if (lower.includes(' ')) {
      // Termo composto sem preposição. Ex: "Bloco Parlamentar" -> pluralizar todas: "Blocos Parlamentares"
      const words = part.split(' ')
      const pluralized = words.map(w => makePlural(w))
      patterns.push(pluralized.join(' '))
    } else {
      // Palavra única
      patterns.push(makePlural(part))
    }
  }
  
  // Ordenar padrões por tamanho decrescente
  return Array.from(new Set(patterns)).sort((a, b) => b.length - a.length)
}

/**
 * Parses a plain text block, matching glossary terms and wrapping them in tooltips.
 * Splits text around HTML tags to prevent modifying attributes or links.
 */
export function highlightGlossary(text: string, terms: GlossaryTerm[]): (string | React.ReactNode)[] {
  if (!text) return [text]
  
  const patternToTerm: Record<string, { slug: string; termo: string; definicao: string }> = {}
  
  for (const t of terms) {
    const patterns = getTermPatterns(t.termo)
    for (const pat of patterns) {
      patternToTerm[pat.toLowerCase()] = {
        slug: t.slug,
        termo: t.termo,
        definicao: t.definicao_simples
      }
    }
  }
  
  const allPatterns = Object.keys(patternToTerm).sort((a, b) => b.length - a.length)
  if (allPatterns.length === 0) return [text]
  
  // Escapar padrões para RegExp
  const escaped = allPatterns.map(p => p.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'))
  
  // Lookaround de borda de palavra estendido para acentos em português
  const regex = new RegExp(`(?<![a-zA-Z0-9À-ÿ])(${escaped.join('|')})(?![a-zA-Z0-9À-ÿ])`, 'gi')
  
  // Dividir a string nas tags HTML para preservar formatações como <strong>, <a>, etc.
  const parts = text.split(/(<[^>]+>)/g)
  const result: (string | React.ReactNode)[] = []
  
  parts.forEach((part, index) => {
    // Se for uma tag HTML, mantemos intacta
    if (part.startsWith('<') && part.endsWith('>')) {
      result.push(part)
      return
    }
    
    let lastIndex = 0
    let match
    let hasMatch = false
    const textNodes: (string | React.ReactNode)[] = []
    
    // Resetar o lastIndex do RegExp global
    regex.lastIndex = 0
    
    while ((match = regex.exec(part)) !== null) {
      hasMatch = true
      const matchText = match[0]
      const matchIndex = match.index
      
      // Texto antes da correspondência
      if (matchIndex > lastIndex) {
        textNodes.push(part.substring(lastIndex, matchIndex))
      }
      
      const termInfo = patternToTerm[matchText.toLowerCase()]
      
      textNodes.push(
        <GlossarioTooltip 
          key={`term-${index}-${matchIndex}`}
          slug={termInfo.slug}
          termo={termInfo.termo}
          definicaoSimples={termInfo.definicao}
        >
          {matchText}
        </GlossarioTooltip>
      )
      
      lastIndex = regex.lastIndex
    }
    
    if (hasMatch) {
      if (lastIndex < part.length) {
        textNodes.push(part.substring(lastIndex))
      }
      result.push(...textNodes)
    } else {
      result.push(part)
    }
  })
  
  return result
}
