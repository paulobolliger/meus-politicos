import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CandidatoPageClient, type CandidatoData, type BemPatrimonial } from './CandidatoPageClient'
import { getPgPool } from '@/lib/db/pool'

export const revalidate = 3600

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ ano: string; slug: string }> }
): Promise<Metadata> {
  const { ano, slug } = await params
  const anoNum = parseInt(ano, 10)
  if (isNaN(anoNum)) return { title: 'Candidato | Meus Políticos' }

  const pool = getPgPool()

  try {
    const res = await pool.query<{ nome_urna: string | null; nome: string; cargo: string; uf: string; link_foto: string | null }>(
      `SELECT c.nome_urna, c.nome, c.cargo, c.uf, c.link_foto
       FROM candidatos c
       WHERE (c.slug = $1 OR c.sequencial_tse = $1) AND c.eleicao_ano = $2
       LIMIT 1`,
      [slug, anoNum]
    )
    const c = res.rows[0]
    if (c) {
      const nome = c.nome_urna ?? c.nome
      const shareImg = c.link_foto || "/logos_meus-politicos_colorido_fundobranco.png"
      return {
        title: `${nome} — Candidato ${ano} | Meus Políticos`,
        description: `Veja o perfil de ${nome}, candidato(a) a ${c.cargo} por ${c.uf} nas eleições de ${ano}. Propostas, bens declarados e histórico político.`,
        openGraph: {
          title: `${nome} · Candidato ${ano}`,
          description: `Perfil eleitoral de ${nome} — ${c.cargo} · ${c.uf} · Eleições ${ano}`,
          type: 'profile',
          images: [
            {
              url: shareImg,
              alt: `Foto de ${nome}`,
            },
          ],
        },
      }
    }
  } catch { /* candidatos table may not exist yet */ }

  return { title: `Candidato ${ano} | Meus Políticos` }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CandidatoPage(
  { params }: { params: Promise<{ ano: string; slug: string }> }
) {
  const { ano, slug } = await params
  const anoNum = parseInt(ano, 10)
  if (isNaN(anoNum)) notFound()

  const pool = getPgPool()

  let candidato: CandidatoData | null = null
  let bens: BemPatrimonial[] = []

  try {
    // Buscar candidato com partido e politico vinculado
    const res = await pool.query<CandidatoData>(
      `SELECT
         c.id,
         c.nome,
         c.nome_urna,
         c.slug,
         c.cargo,
         c.uf,
         c.situacao,
         c.genero,
         c.cor_raca,
         c.sequencial_tse,
         c.escolaridade,
         c.ocupacao,
         c.descricao,
         c.link_foto,
         pt.sigla          AS partido_sigla,
         pt.nome           AS partido_nome,
         pol.slug          AS politico_slug,
         pol.foto_url,
         pol.presenca_pct_atual,
         pol.gasto_total_ano
       FROM candidatos c
       LEFT JOIN partidos  pt  ON pt.id  = c.partido_id
       LEFT JOIN politicos pol ON pol.id = c.politico_id
       WHERE (c.slug = $1 OR c.sequencial_tse = $1) AND c.eleicao_ano = $2
       LIMIT 1`,
      [slug, anoNum]
    )
    candidato = res.rows[0] ?? null

    // Buscar bens declarados
    if (candidato) {
      try {
        const bensRes = await pool.query<BemPatrimonial>(
          `SELECT descricao, valor, ano
           FROM candidatos_bens
           WHERE candidato_id = $1
           ORDER BY ano DESC, valor DESC`,
          [candidato.id]
        )
        bens = bensRes.rows
      } catch { /* tabela candidatos_bens pode não existir ainda */ }
    }
  } catch { /* candidatos table may not exist yet */ }

  // Se não encontrou, 404
  if (!candidato) notFound()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GovernmentOfficial',
    'name': candidato.nome,
    'alternateName': candidato.nome_urna,
    'description': `Perfil de candidatura eleitoral de ${candidato.nome} para o cargo de ${candidato.cargo} nas eleições de ${anoNum}.`,
    'image': candidato.link_foto,
    'jobTitle': candidato.cargo,
    'address': {
      '@type': 'PostalAddress',
      'addressRegion': candidato.uf,
      'addressCountry': 'BR'
    }
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <CandidatoPageClient candidato={candidato} bens={bens} ano={anoNum} />
    </>
  )
}
