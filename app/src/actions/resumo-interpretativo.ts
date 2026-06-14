'use server'

import OpenAI from 'openai'
import type { Pool } from 'pg'
import { z } from 'zod'

import { stableHash } from '@/lib/ai/stable-hash'
import { getPgPool } from '@/lib/db/pool'

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

function getPool(): Pool | null {
  const host = process.env.POSTGRES_HOST
  const database = process.env.POSTGRES_DB
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD

  if (!host || !database || !user || !password) {
    return null
  }

  return getPgPool()
}

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
  db: Pool,
  politicoId: string,
  diaReferencia: string,
  limiteDiario: number
) {
  const { rows } = await db.query<PoliticoResumoCotaLinha>(
    `
      SELECT id, politico_id, dia_referencia::text AS dia_referencia, geracoes, limite_diario
      FROM politico_resumos_ia_cotas
      WHERE politico_id = $1
        AND dia_referencia = $2
      LIMIT 1
    `,
    [politicoId, diaReferencia]
  )

  const cota = rows[0] ?? null

  if (!cota) {
    return { disponivel: true, limite: limiteDiario, atual: 0 }
  }

  const limite = cota.limite_diario || limiteDiario
  return { disponivel: cota.geracoes < limite, limite, atual: cota.geracoes }
}

async function registrarConsumoCota(
  db: Pool,
  politicoId: string,
  diaReferencia: string,
  limiteDiario: number
) {
  const { rows } = await db.query<PoliticoResumoCotaLinha>(
    `
      SELECT id, politico_id, dia_referencia::text AS dia_referencia, geracoes, limite_diario
      FROM politico_resumos_ia_cotas
      WHERE politico_id = $1
        AND dia_referencia = $2
      LIMIT 1
    `,
    [politicoId, diaReferencia]
  )

  const atual = rows[0] ?? null

  if (!atual) {
    await db.query(
      `
        INSERT INTO politico_resumos_ia_cotas (
          politico_id,
          dia_referencia,
          geracoes,
          limite_diario
        )
        VALUES ($1, $2, 1, $3)
      `,
      [politicoId, diaReferencia, limiteDiario]
    )
    return
  }

  await db.query(
    `
      UPDATE politico_resumos_ia_cotas
      SET geracoes = geracoes + 1
      WHERE id = $1
    `,
    [atual.id]
  )
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
  const db = getPool()
  if (!db) {
    return null
  }

  const hashDados = stableHash(metricas)

  try {
    const { rows: cacheRows } = await db.query<PoliticoResumoLinha>(
      `
        SELECT politico_id, hash_dados, conteudo_json, atualizado_em::text AS atualizado_em
        FROM politico_resumos_ia
        WHERE politico_id = $1
        LIMIT 1
      `,
      [politicoId]
    )

    const cached = cacheRows[0] ?? null

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
    const cota = await cotaDisponivel(db, politicoId, diaReferencia, limiteDiario)

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

    await db.query(
      `
        INSERT INTO politico_resumos_ia (
          politico_id,
          hash_dados,
          conteudo_json,
          atualizado_em
        )
        VALUES ($1, $2, $3::jsonb, $4)
        ON CONFLICT (politico_id)
        DO UPDATE SET
          hash_dados = EXCLUDED.hash_dados,
          conteudo_json = EXCLUDED.conteudo_json,
          atualizado_em = EXCLUDED.atualizado_em
      `,
      [politicoId, hashDados, JSON.stringify(resumoGerado), atualizadoEm]
    )

    await registrarConsumoCota(db, politicoId, diaReferencia, limiteDiario)

    return {
      resumo: resumoGerado,
      atualizado_em: atualizadoEm,
      origem: 'openai',
    }
  } catch {
    return null
  }
}
