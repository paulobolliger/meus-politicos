import { NextRequest, NextResponse } from 'next/server'

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

    // Validação mínima
    if (!order_nsu || !transaction_nsu) {
      return NextResponse.json({ ok: false }, { status: 400 })
    }

    // Extrair tipo de doação do order_nsu (formato: apoio-{tipo}-{ts}-{uuid})
    const tipo = order_nsu.startsWith('apoio-mensal') ? 'mensal' : 'unica'

    // TODO: registrar doação no banco de dados
    // await supabase.from('doacoes').upsert({
    //   order_nsu,
    //   transaction_nsu,
    //   invoice_slug,
    //   amount_centavos: paid_amount ?? amount,
    //   capture_method,
    //   receipt_url,
    //   tipo,
    //   status: 'pago',
    //   pago_em: new Date().toISOString(),
    // }, { onConflict: 'order_nsu' })

    console.log('[Webhook InfinitePay] Pagamento confirmado:', {
      order_nsu,
      transaction_nsu,
      invoice_slug,
      tipo,
      amount: (paid_amount ?? amount) / 100,
      capture_method,
      receipt_url,
    })

    return NextResponse.json({ ok: true }, { status: 200 })
  } catch (err) {
    console.error('[Webhook InfinitePay] Erro:', err)
    // Retornar 400 para InfinitePay retentar
    return NextResponse.json({ ok: false }, { status: 400 })
  }
}
