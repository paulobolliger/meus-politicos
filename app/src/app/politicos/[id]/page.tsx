import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

import { PoliticoDashboardV2 } from '@/components/politico-v2/PoliticoDashboardV2'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type PageProps = {
  params: Promise<{ id: string }>
}

type PoliticoPerfil = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  mandato_inicio: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partidos: { sigla: string | null; nome: string | null } | null
  redes_sociais: Array<{ plataforma: string | null; url: string | null }> | null
}

type PoliticoPgRow = {
  id: string
  slug: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  mandato_inicio: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partido_sigla: string | null
  partido_nome: string | null
  redes_sociais: Array<{ plataforma: string | null; url: string | null }> | null
}

async function buscarPoliticoViaPostgres(idOuSlug: string): Promise<PoliticoPerfil | null> {
  const host = process.env.SUPABASE_DB_HOST
  const password = process.env.SUPABASE_DB_PASSWORD

  if (!host || !password) {
    return null
  }

  const pool = new Pool({
    host,
    port: Number(process.env.SUPABASE_DB_PORT ?? '5432'),
    user: process.env.SUPABASE_DB_USER ?? 'postgres',
    password,
    database: 'postgres',
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    const result = await pool.query<PoliticoPgRow>(
      `
        SELECT
          p.id,
          p.slug,
          p.nome,
          p.nome_civil,
          p.nome_eleitoral,
          p.cargo::text AS cargo,
          p.uf,
          p.foto_url,
          p.mandato_inicio::text AS mandato_inicio,
          p.presenca_pct_atual,
          p.gasto_total_ano,
          p.total_votacoes,
          pa.sigla AS partido_sigla,
          pa.nome AS partido_nome,
          COALESCE(
            json_agg(
              json_build_object('plataforma', r.plataforma, 'url', r.url)
            ) FILTER (WHERE r.url IS NOT NULL),
            '[]'::json
          ) AS redes_sociais
        FROM politicos p
        LEFT JOIN partidos pa ON pa.id = p.partido_id
        LEFT JOIN redes_sociais r ON r.politico_id = p.id
        WHERE p.slug = $1 OR p.id::text = $1
        GROUP BY
          p.id,
          p.slug,
          p.nome,
          p.nome_civil,
          p.nome_eleitoral,
          p.cargo,
          p.uf,
          p.foto_url,
          p.mandato_inicio,
          p.presenca_pct_atual,
          p.gasto_total_ano,
          p.total_votacoes,
          pa.sigla,
          pa.nome
        LIMIT 1
      `,
      [idOuSlug]
    )

    const row = result.rows[0]

    if (!row) {
      return null
    }

    return {
      id: row.id,
      slug: row.slug,
      nome: row.nome,
      nome_civil: row.nome_civil,
      nome_eleitoral: row.nome_eleitoral,
      cargo: row.cargo,
      uf: row.uf,
      foto_url: row.foto_url,
      mandato_inicio: row.mandato_inicio,
      presenca_pct_atual: row.presenca_pct_atual,
      gasto_total_ano: row.gasto_total_ano,
      total_votacoes: row.total_votacoes,
      partidos: {
        sigla: row.partido_sigla,
        nome: row.partido_nome,
      },
      redes_sociais: row.redes_sociais ?? [],
    }
  } finally {
    await pool.end()
  }
}

async function buscarPolitico(idOuSlug: string): Promise<PoliticoPerfil | null> {
  const supabase = await createClient()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const adminClient =
    serviceRoleKey && supabaseUrl
      ? createSupabaseClient<Database>(supabaseUrl, serviceRoleKey)
      : null

  const { data: politico } = await supabase
    .from('politicos')
    .select('*, partidos(sigla, nome), redes_sociais(plataforma, url)')
    .or(`slug.eq.${idOuSlug},id.eq.${idOuSlug}`)
    .limit(1)
    .maybeSingle()

  if (politico) {
    return politico as unknown as PoliticoPerfil
  }

  if (adminClient) {
    const { data: adminPolitico } = await adminClient
      .from('politicos')
      .select('*, partidos(sigla, nome), redes_sociais(plataforma, url)')
      .or(`slug.eq.${idOuSlug},id.eq.${idOuSlug}`)
      .limit(1)
      .maybeSingle()

    if (adminPolitico) {
      return adminPolitico as unknown as PoliticoPerfil
    }
  }

  return buscarPoliticoViaPostgres(idOuSlug)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const politico = await buscarPolitico(id)

  if (!politico) {
    return {
      title: 'Politico nao encontrado - V2',
    }
  }

  return {
    title: `${politico.nome_eleitoral ?? politico.nome} - Radar Politico V2`,
  }
}

export default async function PoliticoV2Page({ params }: PageProps) {
  const { id } = await params
  const politico = await buscarPolitico(id)

  if (!politico) {
    notFound()
  }

  return <PoliticoDashboardV2 politico={{ ...politico, redes_sociais: politico.redes_sociais ?? [] }} />
}