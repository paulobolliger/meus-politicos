import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'

const INFINITEPAY_API = 'https://api.checkout.infinitepay.io/links'
const HANDLE = process.env.INFINITEPAY_HANDLE ?? ''
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://meuspoliticos.com.br'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { nome, email, tipo, valor } = body as {
      nome: string
      email: string
      tipo: 'mensal' | 'unica'
      valor: number // em reais
    }

    if (!nome || !email || !valor) {
      return NextResponse.json({ error: 'Campos obrigatórios ausentes.' }, { status: 400 })
    }
    if (!HANDLE) {
      console.error('[InfinitePay] INFINITEPAY_HANDLE não configurado')
      return NextResponse.json({ error: 'Configuração de pagamento indisponível.' }, { status: 500 })
    }

    const order_nsu = `apoio-${tipo}-${Date.now()}-${randomUUID().slice(0, 8)}`
    const valorCentavos = Math.round(valor * 100)
    const descricao = tipo === 'mensal' ? 'Apoio Cívico Mensal' : 'Apoio Cívico'

    const redirect_url = `${BASE_URL}/apoio/confirmacao`
    const webhook_url = `${BASE_URL}/api/webhooks/infinitepay`

    const payload = {
      handle: HANDLE,
      order_nsu,
      items: [
        {
          description: descricao,
          quantity: 1,
          price: valorCentavos,
        },
      ],
      redirect_url,
      webhook_url,
      customer: {
        name: nome,
        email,
      },
    }

    const response = await fetch(INFINITEPAY_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[InfinitePay] Erro ao criar link:', response.status, errText)
      return NextResponse.json({ error: 'Falha ao gerar link de pagamento.' }, { status: 502 })
    }

    const data = await response.json()

    // InfinitePay retorna { url } ou { link } com o link de checkout
    const paymentUrl = data.url ?? data.link ?? data.checkout_url

    if (!paymentUrl) {
      console.error('[InfinitePay] Resposta sem URL:', data)
      return NextResponse.json({ error: 'URL de pagamento não retornada.' }, { status: 502 })
    }

    return NextResponse.json({ url: paymentUrl, order_nsu })
  } catch (err) {
    console.error('[InfinitePay] Erro interno:', err)
    return NextResponse.json({ error: 'Erro interno do servidor.' }, { status: 500 })
  }
}
