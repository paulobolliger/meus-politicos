import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import { CandidatoPageClient, type CandidatoData, type BemPatrimonial } from './CandidatoPageClient'

export const revalidate = 3600

// ─── Pool singleton ───────────────────────────────────────────────────────────
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5433),
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5, idleTimeoutMillis: 30_000,
  })
  return _pool
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params
  const pool = getPool()

  try {
    const res = await pool.query<{ nome_urna: string | null; nome: string; cargo: string; uf: string }>(
      `SELECT c.nome_urna, c.nome, c.cargo, c.uf
       FROM candidatos c
       WHERE c.slug = $1 OR c.sequencial_tse = $1
       LIMIT 1`,
      [slug]
    )
    const c = res.rows[0]
    if (c) {
      const nome = c.nome_urna ?? c.nome
      return {
        title: `${nome} — Candidato 2026 | Meus Políticos`,
        description: `Veja o perfil de ${nome}, candidato(a) a ${c.cargo} por ${c.uf} nas eleições de 2026. Propostas, bens declarados e histórico político.`,
        openGraph: {
          title: `${nome} · Candidato 2026`,
          description: `Perfil eleitoral de ${nome} — ${c.cargo} · ${c.uf} · Eleições 2026`,
          type: 'profile',
        },
      }
    }
  } catch { /* candidatos table may not exist yet */ }

  return { title: 'Candidato 2026 | Meus Políticos' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CandidatoPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const pool = getPool()

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
       WHERE c.slug = $1 OR c.sequencial_tse = $1
       LIMIT 1`,
      [slug]
    )
    candidato = res.rows[0] ?? null

    // Buscar bens declarados (se tabela existir)
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

  // Se não encontrou (ou tabela não existe), 404
  if (!candidato) notFound()

  return <CandidatoPageClient candidato={candidato} bens={bens} />
}
