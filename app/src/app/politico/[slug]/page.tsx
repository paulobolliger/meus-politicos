import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Pool } from 'pg'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Calendar, ExternalLink, Receipt, Vote } from 'lucide-react'

import { AcompanharButton } from '@/components/politico/AcompanharButton'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { classeFotoEnquadramento } from '@/lib/foto-enquadramento'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/lib/supabase/types'

type PageProps = {
  params: Promise<{ slug: string }>
}

type PoliticoPerfil = {
  id: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  email: string | null
  gabinete_email: string | null
  gabinete_telefone: string | null
  gabinete_nome: string | null
  mandato_inicio: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partidos: { sigla: string | null; nome: string | null } | null
  redes_sociais: Array<{ plataforma: string | null; url: string | null }> | null
}

type PoliticoPgRow = {
  id: string
  nome: string
  nome_civil: string | null
  nome_eleitoral: string | null
  cargo: string
  uf: string | null
  foto_url: string | null
  email: string | null
  gabinete_email: string | null
  gabinete_telefone: string | null
  gabinete_nome: string | null
  mandato_inicio: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  partido_sigla: string | null
  partido_nome: string | null
  redes_sociais: Array<{ plataforma: string | null; url: string | null }> | null
}

const CARGO_STYLE: Record<string, string> = {
  deputado_federal: 'bg-[#e8eefb] text-[#1a2b5e] border-[#d7e2fa]',
  senador: 'bg-[#e8f5ee] text-[#085041] border-[#cce9da]',
  governador: 'bg-[#fff0e8] text-[#7a3000] border-[#ffd9c7]',
}

const CARGO_LABEL: Record<string, string> = {
  deputado_federal: 'Deputado Federal',
  senador: 'Senador',
  governador: 'Governador',
}

function formatarData(valor: string | null) {
  if (!valor) return null
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return null
  return format(data, "MMMM 'de' yyyy", { locale: ptBR })
}

function formatarMoeda(valor: number | null) {
  if (valor == null) return '–'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(valor)
}

function iniciaisNome(nome: string) {
  return nome
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase())
    .join('')
}

function cargoClassName(cargo: string) {
  return CARGO_STYLE[cargo] ?? 'bg-white/20 text-white border-white/30'
}

function cargoLabel(cargo: string) {
  return CARGO_LABEL[cargo] ?? cargo.replace(/_/g, ' ')
}

async function buscarPoliticoViaPostgres(slug: string): Promise<PoliticoPerfil | null> {
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
          p.nome,
          p.nome_civil,
          p.nome_eleitoral,
          p.cargo::text AS cargo,
          p.uf,
          p.foto_url,
          p.email,
          p.gabinete_email,
          p.gabinete_telefone,
          p.gabinete_nome,
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
        WHERE p.slug = $1
        GROUP BY
          p.id,
          p.nome,
          p.nome_civil,
          p.nome_eleitoral,
          p.cargo,
          p.uf,
          p.foto_url,
          p.email,
          p.gabinete_email,
          p.gabinete_telefone,
          p.gabinete_nome,
          p.mandato_inicio,
          p.presenca_pct_atual,
          p.gasto_total_ano,
          p.total_votacoes,
          pa.sigla,
          pa.nome
        LIMIT 1
      `,
      [slug]
    )

    const row = result.rows[0]

    if (!row) {
      return null
    }

    return {
      id: row.id,
      nome: row.nome,
      nome_civil: row.nome_civil,
      nome_eleitoral: row.nome_eleitoral,
      cargo: row.cargo,
      uf: row.uf,
      foto_url: row.foto_url,
      email: row.email,
      gabinete_email: row.gabinete_email,
      gabinete_telefone: row.gabinete_telefone,
      gabinete_nome: row.gabinete_nome,
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

async function buscarPolitico(slug: string): Promise<PoliticoPerfil | null> {
  const supabase = await createClient()
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  const adminClient =
    serviceRoleKey && supabaseUrl
      ? createSupabaseClient<Database>(supabaseUrl, serviceRoleKey)
      : null

  const { data: politico, error } = await supabase
    .from('politicos')
    .select('*, partidos(sigla, nome), redes_sociais(plataforma, url)')
    .eq('slug', slug)
    .single()

  if (politico) {
    return politico as unknown as PoliticoPerfil
  }

  if (adminClient) {
    const { data: adminPolitico } = await adminClient
      .from('politicos')
      .select('*, partidos(sigla, nome), redes_sociais(plataforma, url)')
      .eq('slug', slug)
      .single()

    if (adminPolitico) {
      return adminPolitico as unknown as PoliticoPerfil
    }
  }

  const fallbackClient = adminClient ?? supabase

  if (!error && !adminClient) {
    return null
  }

  const { data: basePolitico } = await fallbackClient
    .from('politicos')
    .select('*, partidos(sigla, nome)')
    .eq('slug', slug)
    .single()

  if (!basePolitico) {
    return buscarPoliticoViaPostgres(slug)
  }

  const { data: redesSociais } = await fallbackClient
    .from('redes_sociais')
    .select('plataforma, url')
    .eq('politico_id', basePolitico.id)

  return {
    ...(basePolitico as unknown as Omit<PoliticoPerfil, 'redes_sociais'>),
    redes_sociais: (redesSociais ?? []) as PoliticoPerfil['redes_sociais'],
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const politico = await buscarPolitico(slug)

  if (!politico) {
    return {
      title: 'Politico nao encontrado - Meus Politicos',
    }
  }

  return {
    title: `${politico.nome_eleitoral ?? politico.nome} - Meus Politicos`,
  }
}

export default async function PoliticoPage({ params }: PageProps) {
  const { slug } = await params
  const politico = await buscarPolitico(slug)

  if (!politico) {
    notFound()
  }

  const nomeExibicao = politico.nome_eleitoral ?? politico.nome
  const nomeCivil = politico.nome_civil ?? politico.nome
  const mandatoDesde = formatarData(politico.mandato_inicio)
  const hasFoto = Boolean(politico.foto_url)

  return (
    <main className="bg-[#f5f6fa] pb-12">
      <section className="bg-[#1a2b5e] text-white">
        <div className="container-shell py-8 sm:py-10">
          <div className="flex flex-col gap-6 sm:gap-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-4">
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/25 bg-[#2952cc] sm:h-24 sm:w-24">
                  {hasFoto ? (
                    <Image
                      src={politico.foto_url ?? ''}
                      alt={`Foto de ${nomeExibicao}`}
                      fill
                      className={`object-cover ${classeFotoEnquadramento({ cargo: politico.cargo, slug })}`}
                      unoptimized
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-semibold tracking-wide text-white">
                      {iniciaisNome(nomeExibicao)}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <h1 className="text-3xl font-bold leading-tight sm:text-4xl">{nomeExibicao}</h1>
                  <p className="text-sm text-white/70 sm:text-base">{nomeCivil}</p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Badge className={cargoClassName(politico.cargo)}>
                      {cargoLabel(politico.cargo)}
                    </Badge>
                    <Badge className="border border-white/30 bg-white/10 text-white">
                      {politico.partidos?.sigla ?? 'Sem partido'}
                    </Badge>
                    <Badge className="border border-white/30 bg-white/10 text-white">
                      UF {politico.uf ?? '–'}
                    </Badge>
                    <Badge className="border border-white/30 bg-white/10 text-white">
                      Mandato desde {mandatoDesde ?? '–'}
                    </Badge>
                  </div>
                </div>
              </div>

              <AcompanharButton nome={nomeExibicao} />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200 bg-white">
        <div className="container-shell grid grid-cols-2 gap-3 py-5 sm:grid-cols-4 sm:gap-5">
          <div>
            <p className="text-xs text-slate-500">Presenca</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">
              {politico.presenca_pct_atual == null ? '–' : `${politico.presenca_pct_atual}%`}
            </p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Gasto cota</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{formatarMoeda(politico.gasto_total_ano)}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Votacoes</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{politico.total_votacoes ?? '–'}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">Gabinete</p>
            <p className="mt-1 text-lg font-semibold text-slate-900">{politico.gabinete_telefone ?? '–'}</p>
          </div>
        </div>
      </section>

      <section className="container-shell mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="rounded-xl border border-slate-200 bg-white p-4 sm:p-6">
          <Tabs defaultValue="votacoes" className="gap-4">
            <TabsList variant="line" className="w-full justify-start gap-1 overflow-x-auto">
              <TabsTrigger value="votacoes">Votacoes</TabsTrigger>
              <TabsTrigger value="gastos">Gastos</TabsTrigger>
              <TabsTrigger value="presenca">Presenca</TabsTrigger>
              <TabsTrigger value="emendas" disabled>
                Emendas
                <Badge variant="outline" className="ml-1 border-slate-300 text-[10px] text-slate-500">
                  Em breve
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="historico" disabled>
                Historico
                <Badge variant="outline" className="ml-1 border-slate-300 text-[10px] text-slate-500">
                  Em breve
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="votacoes" className="pt-6">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-10">
                <Vote className="mx-auto text-[#2952cc]" size={34} />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Votacoes sendo coletadas</h2>
                <p className="mt-2 text-sm text-slate-600 sm:text-base">
                  Em breve as votacoes deste politico aparecerao aqui
                </p>
              </div>
            </TabsContent>

            <TabsContent value="gastos" className="pt-6">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-10">
                <Receipt className="mx-auto text-[#2952cc]" size={34} />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Gastos sendo coletados</h2>
              </div>
            </TabsContent>

            <TabsContent value="presenca" className="pt-6">
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center sm:p-10">
                <Calendar className="mx-auto text-[#2952cc]" size={34} />
                <h2 className="mt-4 text-xl font-semibold text-slate-900">Dados de presenca sendo coletados</h2>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <Card className="h-fit">
          <CardHeader className="border-b border-slate-200 pb-4">
            <CardTitle>Contato do gabinete</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
              <p className="mt-1 wrap-break-word text-sm text-slate-900">{politico.gabinete_email ?? '–'}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Telefone</p>
              <p className="mt-1 text-sm text-slate-900">{politico.gabinete_telefone ?? '–'}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Gabinete</p>
              <p className="mt-1 text-sm text-slate-900">{politico.gabinete_nome ?? '–'}</p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Redes sociais</p>
              <div className="mt-2 space-y-2">
                {politico.redes_sociais && politico.redes_sociais.length > 0 ? (
                  politico.redes_sociais
                    .filter((rede) => rede.url)
                    .map((rede) => (
                      <a
                        key={`${rede.plataforma}-${rede.url}`}
                        href={rede.url ?? '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        <span className="capitalize">{rede.plataforma ?? 'canal'}</span>
                        <ExternalLink size={14} />
                      </a>
                    ))
                ) : (
                  <p className="text-sm text-slate-500">Sem redes sociais cadastradas.</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
