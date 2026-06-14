import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { z } from 'zod'
import { getPgPool } from '@/lib/db/pool'

const ASAAS_API_KEY = process.env.ASAAS_API_KEY ?? ''
const ASAAS_API_URL = process.env.ASAAS_API_URL ?? 'https://sandbox.asaas.com/api/v3'

const cartaoSchema = z.object({
  holderName: z.string().trim().min(2).max(120),
  number: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().min(13).max(19)),
  expiry: z.string().trim().regex(/^(0[1-9]|1[0-2])\/(\d{2}|\d{4})$/),
  ccv: z.string().trim().regex(/^\d{3,4}$/),
  postalCode: z.string().transform((value) => value.replace(/\D/g, '')).pipe(z.string().length(8)),
  addressNumber: z.string().trim().min(1).max(20),
})

const apoioSchema = z.object({
  nome: z.string().trim().min(2).max(120),
  email: z.email().transform((value) => value.trim().toLowerCase()),
  cpfCnpj: z.string().transform((value) => value.replace(/\D/g, '')).refine(
    (value) => value.length === 11 || value.length === 14,
    'CPF/CNPJ inválido.'
  ),
  telefone: z.string().default('').transform((value) => value.replace(/\D/g, '')),
  tipo: z.enum(['mensal', 'unica']),
  valor: z.number().finite().min(5).max(10_000),
  formaPagamento: z.enum(['pix', 'cartao']),
  cartaoInfo: cartaoSchema.optional(),
}).superRefine((data, ctx) => {
  if (data.formaPagamento === 'cartao' && !data.cartaoInfo) {
    ctx.addIssue({
      code: 'custom',
      path: ['cartaoInfo'],
      message: 'Dados do cartão de crédito ausentes.',
    })
  }
})

export async function POST(req: NextRequest) {
  try {
    const parsed = apoioSchema.safeParse(await req.json())
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Dados de pagamento inválidos.', fields: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      )
    }
    const { nome, email, cpfCnpj, telefone, tipo, valor, formaPagamento, cartaoInfo } = parsed.data

    if (!ASAAS_API_KEY || ASAAS_API_KEY === 'mock_api_key_for_testing') {
      console.error('[Asaas] API Key do Asaas não configurada corretamente.')
      return NextResponse.json({ error: 'Gateway de pagamento em manutenção.' }, { status: 503 })
    }

    const cleanCpfCnpj = cpfCnpj
    const cleanEmail = email
    const cleanPhone = telefone || undefined

    // 1. Buscar ou Criar Cliente no Asaas
    let customerId = ''
    try {
      const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${cleanCpfCnpj}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        }
      })

      if (searchRes.ok) {
        const searchData = await searchRes.json()
        if (searchData.data && searchData.data.length > 0) {
          customerId = searchData.data[0].id
        }
      }
    } catch (err) {
      console.warn('[Asaas] Falha ao pesquisar cliente por CPF/CNPJ:', err)
    }

    if (!customerId) {
      const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          name: nome.trim(),
          email: cleanEmail,
          cpfCnpj: cleanCpfCnpj,
          phone: cleanPhone,
          notificationDisabled: true
        })
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        console.error('[Asaas] Erro ao criar cliente:', createRes.status, errText)
        return NextResponse.json({ error: 'Falha ao registrar dados do pagador no Asaas.' }, { status: 400 })
      }

      const createData = await createRes.json()
      customerId = createData.id
    }

    // 2. Definir dados de controle
    const order_nsu = `apoio-${tipo}-${Date.now()}-${randomUUID().slice(0, 8)}`
    
    // Obter data de vencimento (Hoje no horário de Brasília)
    const brazilDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const year = brazilDate.getFullYear()
    const month = String(brazilDate.getMonth() + 1).padStart(2, '0')
    const day = String(brazilDate.getDate()).padStart(2, '0')
    const dueDate = `${year}-${month}-${day}`

    // 3. Processar Cobrança Pix
    if (formaPagamento === 'pix') {
      const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'PIX',
          value: valor,
          dueDate,
          externalReference: order_nsu,
          description: tipo === 'mensal' ? 'Apoio Cívico Mensal (Pix)' : 'Apoio Cívico (Pix)'
        })
      })

      if (!paymentRes.ok) {
        const errText = await paymentRes.text()
        console.error('[Asaas] Erro ao criar pagamento Pix:', paymentRes.status, errText)
        return NextResponse.json({ error: 'Falha ao gerar cobrança Pix no Asaas.' }, { status: 400 })
      }

      const paymentData = await paymentRes.json()
      const paymentId = paymentData.id

      // Obter QR Code e Copia e Cola
      const qrRes = await fetch(`${ASAAS_API_URL}/payments/${paymentId}/pixQrCode`, {
        method: 'GET',
        headers: {
          'access_token': ASAAS_API_KEY
        }
      })

      if (!qrRes.ok) {
        const errText = await qrRes.text()
        console.error('[Asaas] Erro ao obter QR Code Pix:', qrRes.status, errText)
        return NextResponse.json({ error: 'Falha ao gerar QR Code do Pix.' }, { status: 400 })
      }

      const qrData = await qrRes.json()

      // Registrar no Banco de Dados local
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
          raw_payload
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'pendente', $8)`,
        [
          order_nsu,
          paymentId,
          paymentData.invoiceUrl || null,
          Math.round(valor * 100),
          'pix',
          paymentData.invoiceUrl || null,
          tipo,
          JSON.stringify(paymentData)
        ]
      )

      return NextResponse.json({
        success: true,
        type: 'pix',
        paymentId,
        order_nsu,
        qrCode: qrData.encodedImage,
        copiaCola: qrData.payload
      })
    }

    // 4. Processar Cobrança Cartão de Crédito
    if (formaPagamento === 'cartao') {
      if (!cartaoInfo) return NextResponse.json({ error: 'Dados do cartão de crédito ausentes.' }, { status: 400 })

      const [expMonth, expYear] = cartaoInfo.expiry.split('/')
      if (!expMonth || !expYear) {
        return NextResponse.json({ error: 'Data de validade do cartão inválida.' }, { status: 400 })
      }

      const fullYear = expYear.trim().length === 2 ? `20${expYear.trim()}` : expYear.trim()
      const remoteIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || '177.100.100.100'

      const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access_token': ASAAS_API_KEY
        },
        body: JSON.stringify({
          customer: customerId,
          billingType: 'CREDIT_CARD',
          value: valor,
          dueDate,
          externalReference: order_nsu,
          description: tipo === 'mensal' ? 'Apoio Cívico Mensal (Cartão)' : 'Apoio Cívico (Cartão)',
          creditCard: {
            holderName: cartaoInfo.holderName.trim(),
            number: cartaoInfo.number.replace(/\s+/g, ''),
            expiryMonth: expMonth.trim(),
            expiryYear: fullYear,
            ccv: cartaoInfo.ccv.trim()
          },
          creditCardHolderInfo: {
            name: nome.trim(),
            email: cleanEmail,
            cpfCnpj: cleanCpfCnpj,
            postalCode: cartaoInfo.postalCode.replace(/\D/g, ''),
            addressNumber: cartaoInfo.addressNumber.trim(),
            phone: cleanPhone
          },
          remoteIp
        })
      })

      if (!paymentRes.ok) {
        const errText = await paymentRes.text()
        console.error('[Asaas] Erro ao criar pagamento Cartão:', paymentRes.status, errText)
        
        try {
          const errJson = JSON.parse(errText)
          if (errJson.errors && errJson.errors.length > 0) {
            const errors = errJson.errors as Array<{ description?: string }>
            const errorMsg = errors
              .map((error) => error.description)
              .filter((description): description is string => Boolean(description))
              .join('; ')
            return NextResponse.json({ error: errorMsg }, { status: 400 })
          }
        } catch {
          // Ignora e retorna padrão
        }

        return NextResponse.json({ error: 'Erro ao processar o cartão de crédito.' }, { status: 400 })
      }

      const paymentData = await paymentRes.json()
      const paymentId = paymentData.id
      const isPaid = paymentData.status === 'CONFIRMED' || paymentData.status === 'RECEIVED'

      // Registrar no Banco de Dados local
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
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          order_nsu,
          paymentId,
          paymentData.invoiceUrl || null,
          Math.round(valor * 100),
          'credit_card',
          paymentData.transactionReceiptUrl || paymentData.invoiceUrl || null,
          tipo,
          isPaid ? 'pago' : 'pendente',
          isPaid ? new Date() : null,
          JSON.stringify(paymentData)
        ]
      )

      return NextResponse.json({
        success: true,
        type: 'cartao',
        paymentId,
        order_nsu,
        status: paymentData.status
      })
    }

    return NextResponse.json({ error: 'Forma de pagamento não suportada.' }, { status: 400 })
  } catch (err) {
    console.error('[Asaas] Erro interno no backend:', err)
    return NextResponse.json({ error: 'Erro interno no servidor.' }, { status: 500 })
  }
}
