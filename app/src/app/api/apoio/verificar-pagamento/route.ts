import { NextRequest, NextResponse } from 'next/server'
import { getPgPool } from '@/lib/db/pool'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? ''
const ASAAS_API_URL = process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3'

export async function POST(req: NextRequest) {
  try {
    const { paymentId } = await req.json()

    if (typeof paymentId !== 'string' || !/^[A-Za-z0-9_-]{3,100}$/.test(paymentId)) {
      return NextResponse.json({ error: 'Parâmetro paymentId é obrigatório.' }, { status: 400 })
    }

    const pool = getPgPool()
    const localPayment = await pool.query(
      `SELECT order_nsu, status
       FROM doacoes
       WHERE transaction_nsu = $1
       LIMIT 1`,
      [paymentId]
    )
    if (localPayment.rowCount === 0) {
      return NextResponse.json({ paid: false, error: 'Pagamento não encontrado.' }, { status: 404 })
    }

    if (!ASAAS_API_KEY || ASAAS_API_KEY === 'mock_api_key_for_testing') {
      return NextResponse.json({ paid: false, error: 'Gateway de pagamento em manutenção.' }, { status: 503 })
    }

    // Consultar o Asaas
    const response = await fetch(`${ASAAS_API_URL}/payments/${paymentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access_token': ASAAS_API_KEY
      }
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('[Asaas] Erro ao verificar pagamento:', response.status, errText)
      return NextResponse.json({ paid: false, error: 'Não foi possível consultar o status do pagamento.' }, { status: 502 })
    }

    const paymentData = await response.json()
    const isPaid = paymentData.status === 'CONFIRMED' || paymentData.status === 'RECEIVED'

    if (isPaid) {
      // Sincronizar com banco de dados local
      await pool.query(
        `UPDATE doacoes
         SET status = 'pago',
             pago_em = COALESCE(pago_em, now()),
             raw_payload = $2
         WHERE transaction_nsu = $1 AND status != 'pago'`,
        [paymentId, JSON.stringify(paymentData)]
      )
    }

    return NextResponse.json({ paid: isPaid, status: paymentData.status })
  } catch (err) {
    console.error('[Asaas] Erro ao verificar pagamento:', err)
    return NextResponse.json({ paid: false, error: 'Erro interno.' }, { status: 500 })
  }
}
