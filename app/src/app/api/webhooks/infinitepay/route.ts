import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'

const INFINITEPAY_CHECK_API = 'https://api.checkout.infinitepay.io/payment_check'

/**
 * Webhook InfinitePay — chamado quando pagamento é aprovado.
 * Payload recebido:
 *   { invoice_slug, amount, paid_amount, installments, capture_method,
 *     transaction_nsu, order_nsu, receipt_url, items }
 *
 * Responder em < 1 segundo.
 * 200 OK = tudo certo / 400 = erro (InfinitePay retentará)
 */
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()

    const {
      invoice_slug,
      amount,
      paid_amount,
      capture_method,
      transaction_nsu,
      order_nsu,
      receipt_url,
    } = payload

    // Validação mínima dos campos obrigatórios
    if (!order_nsu || !transaction_nsu || !invoice_slug) {
      console.warn('[Webhook InfinitePay] Parâmetros obrigatórios ausentes:', {
        order_nsu,
        transaction_nsu,
        invoice_slug,
      })
      return NextResponse.json({ ok: false, error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }

    const handle = process.env.INFINITEPAY_HANDLE ?? ''
    if (!handle) {
      console.error('[Webhook InfinitePay] INFINITEPAY_HANDLE não configurado nas variáveis de ambiente.')
      return NextResponse.json({ ok: false, error: 'Erro de configuração interna.' }, { status: 500 })
    }

    // 1. Verificação Back-channel de Autenticidade do Pagamento
    console.log(`[Webhook InfinitePay] Verificando autenticidade para order_nsu: ${order_nsu}...`)
    const checkResponse = await fetch(INFINITEPAY_CHECK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        handle,
        order_nsu,
        transaction_nsu,
        slug: invoice_slug,
      }),
    })

    if (!checkResponse.ok) {
      const errText = await checkResponse.text()
      console.error('[Webhook InfinitePay] Falha ao validar transação no check API da InfinitePay:', checkResponse.status, errText)
      return NextResponse.json({ ok: false, error: 'Falha na verificação de autenticidade do pagamento.' }, { status: 400 })
    }

    const checkData = await checkResponse.json()
    // O retorno esperado do endpoint de check contém { success: true, paid: true, ... }
    if (!checkData.paid) {
      console.warn('[Webhook InfinitePay] Transação validada, mas não consta como paga:', checkData)
      return NextResponse.json({ ok: false, error: 'Transação não confirmada como paga.' }, { status: 400 })
    }

    // 2. Processar informações do pagamento
    const finalAmountCentavos = checkData.paid_amount ?? checkData.amount ?? paid_amount ?? amount
    const finalCaptureMethod = checkData.capture_method ?? capture_method ?? 'unknown'
    const finalReceiptUrl = receipt_url ?? null

    // Determinar o tipo da doação
    const tipo = order_nsu.startsWith('apoio-mensal') ? 'mensal' : 'unica'

    // 3. Gravar doação no banco de dados (idempotência por order_nsu)
    console.log(`[Webhook InfinitePay] Persistindo doação paga (${finalAmountCentavos} centavos) para ${order_nsu}...`)
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
        Number(finalAmountCentavos),
        finalCaptureMethod,
        finalReceiptUrl,
        tipo,
        JSON.stringify(payload),
      ]
    )

    console.log('[Webhook InfinitePay] Sucesso! Doação persistida com sucesso:', {
      order_nsu,
      transaction_nsu,
      invoice_slug,
      tipo,
      amount: finalAmountCentavos / 100,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[Webhook InfinitePay] Erro interno:', err)
    // Retornar 400 para acionar política de retry da InfinitePay
    return NextResponse.json({ ok: false, error: 'Erro interno.' }, { status: 400 })
  }
}
