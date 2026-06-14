import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'

/**
 * Webhook Asaas — recebe notificações sobre eventos de cobrança.
 *
 * Headers esperados:
 *   asaas-access-token: token definido na configuração do webhook para segurança.
 */
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get('asaas-access-token')
    const webhookToken = process.env.ASAAS_WEBHOOK_TOKEN ?? ''

    if (!webhookToken) {
      console.error('[Webhook Asaas] ASAAS_WEBHOOK_TOKEN não configurado.')
      return NextResponse.json({ error: 'Webhook indisponível.' }, { status: 503 })
    }
    if (token !== webhookToken) {
      console.warn('[Webhook Asaas] Tentativa de acesso não autorizada.')
      return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 })
    }

    const payload = await req.json()
    const { event, payment } = payload as {
      event: string
      payment?: {
        id: string
        customer: string
        value: number
        billingType: 'PIX' | 'CREDIT_CARD' | string
        status: string
        externalReference?: string
        invoiceUrl?: string
        transactionReceiptUrl?: string
        [key: string]: unknown
      }
    }

    if (
      typeof event !== 'string' ||
      !payment ||
      typeof payment.id !== 'string' ||
      !payment.id ||
      !Number.isFinite(payment.value) ||
      payment.value <= 0
    ) {
      console.warn('[Webhook Asaas] Evento ou dados de pagamento ausentes no payload.')
      return NextResponse.json({ ok: false, error: 'Payload inválido.' }, { status: 400 })
    }

    console.log(`[Webhook Asaas] Recebido evento: ${event} para o pagamento: ${payment.id}`)

    // Apenas persistimos/confirmamos se o pagamento foi recebido ou confirmado
    if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
      const order_nsu = payment.externalReference

      if (!order_nsu || !/^apoio-(mensal|unica)-/.test(order_nsu)) {
        console.warn(`[Webhook Asaas] Pagamento ${payment.id} sem referência válida.`)
        return NextResponse.json({ ok: false, error: 'Referência inválida.' }, { status: 400 })
      }

      const transaction_nsu = payment.id
      const invoice_slug = payment.invoiceUrl || null
      const amount_centavos = Math.round(payment.value * 100)
      const capture_method = payment.billingType === 'PIX' ? 'pix' : 'credit_card'
      const receipt_url = payment.transactionReceiptUrl || payment.invoiceUrl || null
      const tipo = order_nsu.startsWith('apoio-mensal') ? 'mensal' : 'unica'

      console.log(`[Webhook Asaas] Gravando/Atualizando doação paga (${amount_centavos} centavos) para ${order_nsu}...`)
      
      const pool = getPgPool()
      await pool.query(
        `INSERT INTO doacoes (
          order_nsu,
          transaction_nsu,
          invoice_slug,
          amount_centavos,
          capture_method,
          receipt_url,
          tipo,
          status,
          pago_em,
          raw_payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pago', now(), $8)
        ON CONFLICT (order_nsu) DO UPDATE
        SET transaction_nsu = EXCLUDED.transaction_nsu,
            invoice_slug = EXCLUDED.invoice_slug,
            amount_centavos = EXCLUDED.amount_centavos,
            capture_method = EXCLUDED.capture_method,
            receipt_url = EXCLUDED.receipt_url,
            status = 'pago',
            pago_em = now(),
            raw_payload = EXCLUDED.raw_payload`,
        [
          order_nsu,
          transaction_nsu,
          invoice_slug,
          amount_centavos,
          capture_method,
          receipt_url,
          tipo,
          JSON.stringify(payload)
        ]
      )

      console.log(`[Webhook Asaas] Sucesso! Doação ${order_nsu} gravada como PAGA.`)
    }

    // Responder com 200 OK para confirmar o recebimento
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[Webhook Asaas] Erro ao processar webhook:', err)
    // Retornamos status 400 ou 500 para forçar o retry do Asaas caso ocorra erro inesperado
    return NextResponse.json({ ok: false, error: 'Erro interno no webhook.' }, { status: 500 })
  }
}
