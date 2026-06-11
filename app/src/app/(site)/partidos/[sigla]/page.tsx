import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import { PartidoDetailClient, type PartidoDetail, type MembroPartido } from './PartidoDetailClient'

export const revalidate = 3600

// ─── Pool singleton ───────────────────────────────────────────────────────────
let _pool: Pool | null = null
function getPool(): Pool {
  if (!_pool) _pool = new Pool({
    host:     process.env.POSTGRES_HOST     ?? 'localhost',
    port:     Number(process.env.POSTGRES_PORT ?? 5432),
    database: process.env.POSTGRES_DB       ?? 'meuspoliticos_db',
    user:     process.env.POSTGRES_USER     ?? 'postgres',
    password: process.env.POSTGRES_PASSWORD,
    max: 5, idleTimeoutMillis: 30_000,
  })
  return _pool
}

// ─── Wikipedia summary ────────────────────────────────────────────────────────
export type WikiSummary = {
  extract: string
  page_url: string
  thumbnail?: string
}

async function fetchWikiSummary(wikiTitle: string | null): Promise<WikiSummary | null> {
  if (!wikiTitle) return null
  try {
    const encoded = encodeURIComponent(wikiTitle.replace(/ /g, '_'))
    const res = await fetch(
      `https://pt.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      {
        headers: { 'User-Agent': 'MeusPoliticos/1.0 (https://meuspoliticos.com.br)' },
        next: { revalidate: 86400 }, // cache 24h
      }
    )
    if (!res.ok) return null
    const data = await res.json() as {
      extract?: string
      content_urls?: { desktop?: { page?: string } }
      thumbnail?: { source?: string }
    }
    return {
      extract:   data.extract ?? '',
      page_url:  data.content_urls?.desktop?.page ?? `https://pt.wikipedia.org/wiki/${encoded}`,
      thumbnail: data.thumbnail?.source,
    }
  } catch {
    return null
  }
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata(
  { params }: { params: Promise<{ sigla: string }> }
): Promise<Metadata> {
  const { sigla } = await params
  const pool = getPool()

  try {
    const res = await pool.query<{ sigla: string; nome: string }>(
      `SELECT sigla, nome FROM partidos WHERE LOWER(sigla) = $1 LIMIT 1`,
      [sigla.toLowerCase()]
    )
    const p = res.rows[0]
    if (p) {
      return {
        title: `${p.sigla} — ${p.nome} | Meus Políticos`,
        description: `Bancada, presença, votações e gastos do ${p.sigla} — ${p.nome}.`,
      }
    }
  } catch { /* table may not exist */ }

  return { title: 'Partido | Meus Políticos' }
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function PartidoPage(
  { params }: { params: Promise<{ sigla: string }> }
) {
  const { sigla } = await params
  const pool = getPool()

  let partido: PartidoDetail | null = null
  let membros: MembroPartido[] = []
  let gastosPorCategoria: { categoria: string; valor: number }[] = []
  let wiki: WikiSummary | null = null
  let coesao: { score: number; totalSessoes: number } | null = null
  let coesaoPorAno: { ano: number; score: number }[] = []
  let topDissidentes: { nome: string; slug: string; uf: string | null; alinhamento: number }[] = []

  try {
    // ── 1. Partido info ─────────────────────────────────────────────────────
    const res = await pool.query<PartidoDetail>(
      `SELECT id, sigla, nome, numero, cor, logo_url, wiki_title, site,
              presidente, fundado_em, endereco, cep, telefone, email, espectro,
              fp_ultimo_valor, fp_ultimo_ano, fefc_ultimo_valor, fefc_ultimo_ano
       FROM partidos
       WHERE LOWER(sigla) = $1 LIMIT 1`,
      [sigla.toLowerCase()]
    )
    if (!res.rows[0]) notFound()
    partido = res.rows[0]

    // ── 2. Membros ──────────────────────────────────────────────────────────
    const membrosRes = await pool.query<MembroPartido>(
      `SELECT
         p.id, p.slug, p.nome_eleitoral, p.nome, p.foto_url,
         p.cargo, p.uf, p.mandato_fim,
         ROUND(p.presenca_pct_atual::numeric, 1) AS presenca_pct_atual,
         p.gasto_total_ano
       FROM politicos p
       WHERE p.partido_id = $1 AND p.removido_em IS NULL
       ORDER BY
         CASE p.cargo
           WHEN 'governador'        THEN 1
           WHEN 'senador'           THEN 2
           WHEN 'deputado_federal'  THEN 3
           WHEN 'deputado_estadual' THEN 4
           ELSE 5
         END,
         p.presenca_pct_atual DESC NULLS LAST,
         p.nome_eleitoral`,
      [partido.id]
    )
    membros = membrosRes.rows.map(m => ({
      ...m,
      presenca_pct_atual: m.presenca_pct_atual != null ? Number(m.presenca_pct_atual) : null,
      gasto_total_ano:    m.gasto_total_ano    != null ? Number(m.gasto_total_ano)    : null,
    }))

    // ── 3. Gastos por categoria (CEAP) ──────────────────────────────────────
    try {
      const gasRes = await pool.query<{ categoria: string; valor: number }>(
        `SELECT g.categoria, SUM(g.valor) AS valor
         FROM gastos g
         JOIN politicos p ON p.id = g.politico_id
         WHERE p.partido_id = $1
           AND g.ano = $2
         GROUP BY g.categoria
         ORDER BY SUM(g.valor) DESC
         LIMIT 8`,
        [partido.id, new Date().getFullYear()]
      )
      gastosPorCategoria = gasRes.rows.map(r => ({ ...r, valor: Number(r.valor) }))
    } catch { /* gastos table may not exist */ }

    // ── 4. Coesão nas votações ──────────────────────────────────────────────
    try {
      const coesaoRes = await pool.query<{ score: string; total_sessoes: string }>(
        `WITH votos_partido AS (
           SELECT v.proposicao_id, v.voto, COUNT(*) AS qtd
           FROM votacoes v
           JOIN politicos p ON p.id = v.politico_id
           WHERE p.partido_id = $1
             AND v.voto IN ('sim', 'nao', 'abstencao')
             AND v.proposicao_id IS NOT NULL
           GROUP BY v.proposicao_id, v.voto
         ),
         sessao_total AS (
           SELECT proposicao_id, SUM(qtd) AS total FROM votos_partido GROUP BY proposicao_id
         ),
         sessao_maioria AS (
           SELECT vp.proposicao_id, MAX(vp.qtd) AS maioria, st.total
           FROM votos_partido vp
           JOIN sessao_total st USING (proposicao_id)
           GROUP BY vp.proposicao_id, st.total
         )
         SELECT
           ROUND(AVG(maioria::numeric / total * 100), 1) AS score,
           COUNT(*)                                       AS total_sessoes
         FROM sessao_maioria
         WHERE total >= 3`,
        [partido.id]
      )
      const row = coesaoRes.rows[0]
      if (row?.score != null) {
        coesao = { score: Number(row.score), totalSessoes: Number(row.total_sessoes) }
      }
    } catch { /* votacoes may not exist */ }

    // ── 5. Coesão por ano + dissidentes ────────────────────────────────────
    try {
      const [anoRes, dissRes] = await Promise.all([
        // Coesão por ano (últimos 3 anos)
        pool.query<{ ano: number; score: string }>(
          `WITH votos_partido AS (
             SELECT EXTRACT(YEAR FROM v.data)::int AS ano,
                    v.proposicao_id, v.voto, COUNT(*) AS qtd
             FROM votacoes v
             JOIN politicos p ON p.id = v.politico_id
             WHERE p.partido_id = $1
               AND v.voto IN ('sim','nao','abstencao')
               AND v.proposicao_id IS NOT NULL
               AND v.data >= CURRENT_DATE - INTERVAL '3 years'
             GROUP BY ano, v.proposicao_id, v.voto
           ),
           sessao_total AS (
             SELECT ano, proposicao_id, SUM(qtd) AS total FROM votos_partido GROUP BY ano, proposicao_id
           ),
           sessao_maioria AS (
             SELECT vp.ano, vp.proposicao_id, MAX(vp.qtd) AS maioria, st.total
             FROM votos_partido vp JOIN sessao_total st USING (ano, proposicao_id)
             GROUP BY vp.ano, vp.proposicao_id, st.total
           )
           SELECT ano, ROUND(AVG(maioria::numeric / total * 100), 1) AS score
           FROM sessao_maioria WHERE total >= 3
           GROUP BY ano ORDER BY ano`,
          [partido.id]
        ),
        // Top 5 dissidentes
        pool.query<{ nome: string; slug: string; uf: string | null; alinhamento: string }>(
          `WITH maioria_sessao AS (
             SELECT v.proposicao_id,
                    MODE() WITHIN GROUP (ORDER BY v.voto) AS voto_maioria
             FROM votacoes v
             JOIN politicos p ON p.id = v.politico_id
             WHERE p.partido_id = $1
               AND v.voto IN ('sim','nao','abstencao')
               AND v.proposicao_id IS NOT NULL
             GROUP BY v.proposicao_id
             HAVING COUNT(DISTINCT v.politico_id) >= 3
           ),
           votos_por_pol AS (
             SELECT v.politico_id,
                    COUNT(*) FILTER (WHERE v.voto = ms.voto_maioria)::numeric AS alinhados,
                    COUNT(*) AS total
             FROM votacoes v
             JOIN maioria_sessao ms USING (proposicao_id)
             WHERE v.voto IN ('sim','nao','abstencao')
             GROUP BY v.politico_id
             HAVING COUNT(*) >= 10
           )
           SELECT p.nome_eleitoral AS nome, p.slug, p.uf,
                  ROUND(vpp.alinhados / vpp.total * 100, 1) AS alinhamento
           FROM votos_por_pol vpp
           JOIN politicos p ON p.id = vpp.politico_id
           WHERE p.partido_id = $1
           ORDER BY alinhamento ASC
           LIMIT 5`,
          [partido.id]
        ),
      ])
      coesaoPorAno   = anoRes.rows.map(r => ({ ano: r.ano, score: Number(r.score) }))
      topDissidentes = dissRes.rows.map(r => ({ nome: r.nome, slug: r.slug, uf: r.uf ?? null, alinhamento: Number(r.alinhamento) }))
    } catch { /* ignore */ }

    // ── 6. Wikipedia summary ────────────────────────────────────────────────
    wiki = await fetchWikiSummary(partido.wiki_title ?? null)

  } catch (err) {
    if ((err as { digest?: string }).digest?.startsWith('NEXT_NOT_FOUND')) throw err
    notFound()
  }

  if (!partido) notFound()

  return (
    <PartidoDetailClient
      partido={partido}
      membros={membros}
      gastosPorCategoria={gastosPorCategoria}
      wiki={wiki}
      coesao={coesao}
      coesaoPorAno={coesaoPorAno}
      topDissidentes={topDissidentes}
    />
  )
}
