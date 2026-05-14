'use server'

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { z } from 'zod'

import { stableHash } from '@/lib/ai/stable-hash'

export type ResumoInterpretativoMetricas = {
  cargo: string
  uf: string | null
  partido: string | null
  em_exercicio_anos: string | null
  presenca_pct_atual: number | null
  gasto_total_ano: number | null
  total_votacoes: number | null
  dado_estado: string | null
  atualizado_em: string | null
}

const resumoIASchema = z.object({
  bullets: z.array(z.string().min(1)).length(3),
  alerta: z.string().min(1).nullable(),
})

type ResumoIA = z.infer<typeof resumoIASchema>

type PoliticoResumoLinha = {
  politico_id: string
  hash_dados: string
  conteudo_json: unknown
  atualizado_em: string
}

type PoliticoResumoCotaLinha = {
  id: string
  politico_id: string
  dia_referencia: string
  geracoes: number
  limite_diario: number
}

export type ResumoInterpretativoResult = {
  resumo: ResumoIA
  atualizado_em: string | null
  origem: 'cache' | 'openai'
}

export type ResumoInterpretativoErro = {
  erro: 'limite_diario'
  limite_diario: number
}

const SYSTEM_PROMPT =
  'Es um tradutor de dados publicos neutro. Traduz as metricas num JSON para cidadaos leigos em leitura rapida. REGRAS: 1. Tom institucional, sem adjetivos; 2. Gera exatamente 3 bullets curtos (maximo 12 palavras por bullet); 3. Nunca facas calculos; 4. Gera 1 alerta APENAS se houver falta de dados ou desvios grandes, caso contrario devolve null.'

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    return null
  }

  return createSupabaseClient<any>(supabaseUrl, serviceRoleKey)
}

type AdminClient = SupabaseClient<any, 'public', any>

function buildUserPayload(metricas: ResumoInterpretativoMetricas) {
  return JSON.stringify({
    instrucoes: [
      'Converta os dados em resumo claro para leitura rapida.',
      'Respeite exatamente o schema de saida.',
      'Nao invente fatos nem complete campos ausentes.',
    ],
    metricas,
  })
}

function getDiaReferenciaUtc() {
  return new Date().toISOString().slice(0, 10)
}

function getLimiteDiario() {
  const raw = process.env.IA_RESUMO_MAX_GERACOES_DIA
  const parsed = Number(raw ?? '3')

  if (!Number.isFinite(parsed) || parsed < 1) {
    return 3
  }

  return Math.floor(parsed)
}

async function cotaDisponivel(
  admin: AdminClient,
  politicoId: string,
  diaReferencia: string,
  limiteDiario: number
) {
  const { data } = await admin
    .from('politico_resumos_ia_cotas')
    .select('id, politico_id, dia_referencia, geracoes, limite_diario')
    .eq('politico_id', politicoId)
    .eq('dia_referencia', diaReferencia)
    .maybeSingle()

  const cota = data as PoliticoResumoCotaLinha | null

  if (!cota) {
    return { disponivel: true, limite: limiteDiario, atual: 0 }
  }

  const limite = cota.limite_diario || limiteDiario
  return { disponivel: cota.geracoes < limite, limite, atual: cota.geracoes }
}

async function registrarConsumoCota(
  admin: AdminClient,
  politicoId: string,
  diaReferencia: string,
  limiteDiario: number
) {
  const { data } = await admin
    .from('politico_resumos_ia_cotas')
    .select('id, politico_id, dia_referencia, geracoes, limite_diario')
    .eq('politico_id', politicoId)
    .eq('dia_referencia', diaReferencia)
    .maybeSingle()

  const atual = data as PoliticoResumoCotaLinha | null

  if (!atual) {
    await admin.from('politico_resumos_ia_cotas').insert({
      politico_id: politicoId,
      dia_referencia: diaReferencia,
      geracoes: 1,
      limite_diario: limiteDiario,
    })
    return
  }

  await admin
    .from('politico_resumos_ia_cotas')
    .update({ geracoes: atual.geracoes + 1 })
    .eq('id', atual.id)
}

async function gerarResumoNaOpenAI(metricas: ResumoInterpretativoMetricas): Promise<ResumoIA | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return null
  }

  try {
    const client = new OpenAI({ apiKey })

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.1,
      max_tokens: 150,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'resumo_interpretativo',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              bullets: {
                type: 'array',
                minItems: 3,
                maxItems: 3,
                items: {
                  type: 'string',
                },
              },
              alerta: {
                type: ['string', 'null'],
              },
            },
            required: ['bullets', 'alerta'],
          },
        },
      },
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: buildUserPayload(metricas),
        },
      ],
    })

    const content = response.choices[0]?.message?.content
    if (!content) return null

    const parsedJson: unknown = JSON.parse(content)
    const parsed = resumoIASchema.safeParse(parsedJson)

    return parsed.success ? parsed.data : null
  } catch {
    return null
  }
}

export async function obterOuGerarResumo(
  politicoId: string,
  metricas: ResumoInterpretativoMetricas
): Promise<ResumoInterpretativoResult | ResumoInterpretativoErro | null> {
  const admin = createAdminClient()
  if (!admin) {
    return null
  }

  const hashDados = stableHash(metricas)

  try {
    const { data: cacheData } = await admin
      .from('politico_resumos_ia')
      .select('politico_id, hash_dados, conteudo_json, atualizado_em')
      .eq('politico_id', politicoId)
      .maybeSingle()

    const cached = cacheData as PoliticoResumoLinha | null

    if (cached && cached.hash_dados === hashDados) {
      const parsedCached = resumoIASchema.safeParse(cached.conteudo_json)

      if (parsedCached.success) {
        return {
          resumo: parsedCached.data,
          atualizado_em: cached.atualizado_em,
          origem: 'cache',
        }
      }
    }

    const diaReferencia = getDiaReferenciaUtc()
    const limiteDiario = getLimiteDiario()
    const cota = await cotaDisponivel(admin, politicoId, diaReferencia, limiteDiario)

    if (!cota.disponivel) {
      return {
        erro: 'limite_diario',
        limite_diario: cota.limite,
      }
    }

    const resumoGerado = await gerarResumoNaOpenAI(metricas)
    if (!resumoGerado) {
      return null
    }

    const atualizadoEm = new Date().toISOString()

    await admin.from('politico_resumos_ia').upsert(
      {
        politico_id: politicoId,
        hash_dados: hashDados,
        conteudo_json: resumoGerado,
        atualizado_em: atualizadoEm,
      },
      { onConflict: 'politico_id' }
    )

    await registrarConsumoCota(admin, politicoId, diaReferencia, limiteDiario)

    return {
      resumo: resumoGerado,
      atualizado_em: atualizadoEm,
      origem: 'openai',
    }
  } catch {
    return null
  }
}
