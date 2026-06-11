import type { MetadataRoute } from 'next'
import { getPgPool } from '@/lib/db/pool'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://meuspoliticos.com.br'

  // 1. Static pages
  const staticPages = [
    '',
    '/sobre',
    '/como-funciona',
    '/metodologia',
    '/termos',
    '/privacidade',
    '/busca',
    '/eleicao',
    '/senado',
    '/camara',
    '/estado',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1.0 : 0.8,
  }))

  // 2. State pages (27 states)
  const states = [
    'ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg',
    'pa', 'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to'
  ]
  const statePages = states.flatMap((sigla) => [
    {
      url: `${baseUrl}/estado/${sigla}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/estado/${sigla}/executivo`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/estado/${sigla}/assembleia`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    }
  ])

  try {
    const pool = getPgPool()

    // 3. City pages
    const citiesRes = await pool.query<{ slug: string; uf: string }>(
      `SELECT slug, uf FROM municipios ORDER BY nome ASC`
    )
    const cityPages = citiesRes.rows.flatMap((city) => {
      const uf = city.uf.toLowerCase()
      return [
        {
          url: `${baseUrl}/estado/${uf}/${city.slug}`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.6,
        },
        {
          url: `${baseUrl}/estado/${uf}/${city.slug}/camara`,
          lastModified: new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.5,
        }
      ]
    })

    // 4. Politician pages
    const politRes = await pool.query<{ id: string }>(
      `SELECT id FROM politicos WHERE removido_em IS NULL ORDER BY nome ASC`
    )
    const politicianPages = politRes.rows.map((pol) => ({
      url: `${baseUrl}/politicos/${pol.id}`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }))

    // 5. Candidate pages
    const candRes = await pool.query<{ slug: string; eleicao_ano: number }>(
      `SELECT slug, eleicao_ano FROM candidatos WHERE slug IS NOT NULL`
    )
    const candidatePages = candRes.rows.map((cand) => ({
      url: `${baseUrl}/eleicao/${cand.eleicao_ano}/candidatos/${cand.slug}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

    // 6. Glossary pages
    const glossRes = await pool.query<{ slug: string }>(
      `SELECT slug FROM glossario ORDER BY termo ASC`
    )
    const glossaryPages = glossRes.rows.map((term) => ({
      url: `${baseUrl}/glossario/${term.slug}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    }))

    return [
      ...staticPages,
      ...statePages,
      ...cityPages,
      ...politicianPages,
      ...candidatePages,
      ...glossaryPages,
    ]
  } catch (error) {
    console.error('Failed to generate dynamic sitemap parts, falling back to static/states only:', error)
    return [
      ...staticPages,
      ...statePages,
    ]
  }
}
