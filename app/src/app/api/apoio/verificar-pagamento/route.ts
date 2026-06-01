import { NextRequest, NextResponse } from 'next/server'

const INFINITEPAY_CHECK_API = 'https://api.checkout.infinitepay.io/payment_check'
const HANDLE = process.env.INFINITEPAY_HANDLE ?? ''

export async function POST(req: NextRequest) {
  try {
    const { order_nsu, transaction_nsu, slug } = await req.json()

    if (!order_nsu || !transaction_nsu || !slug) {
      return NextResponse.json({ error: 'Parâmetros insuficientes.' }, { status: 400 })
    }

    const response = await fetch(INFINITEPAY_CHECK_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ handle: HANDLE, order_nsu, transaction_nsu, slug }),
    })

    if (!response.ok) {
      return NextResponse.json({ paid: false, error: 'Não foi possível verificar o pagamento.' }, { status: 502 })
    }

    const data = await response.json()
    // { success, paid, amount, paid_amount, installments, capture_method }
    return NextResponse.json(data)
  } catch (err) {
    console.error('[InfinitePay] Erro ao verificar pagamento:', err)
    return NextResponse.json({ paid: false, error: 'Erro interno.' }, { status: 500 })
  }
}
