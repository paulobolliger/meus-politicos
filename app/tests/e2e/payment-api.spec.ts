import { expect, test } from '@playwright/test'

test.describe('payment API validation', () => {
  test('rejects an empty support request', async ({ request }) => {
    const response = await request.post('/api/apoio/criar-link', { data: {} })
    expect(response.status()).toBe(400)
  })

  test('rejects invalid payment values and options', async ({ request }) => {
    const response = await request.post('/api/apoio/criar-link', {
      data: {
        nome: 'Pessoa Teste',
        email: 'teste@example.com',
        cpfCnpj: '12345678901',
        telefone: '',
        tipo: 'semanal',
        valor: -1,
        formaPagamento: 'boleto',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('requires card details before contacting the gateway', async ({ request }) => {
    const response = await request.post('/api/apoio/criar-link', {
      data: {
        nome: 'Pessoa Teste',
        email: 'teste@example.com',
        cpfCnpj: '12345678901',
        telefone: '',
        tipo: 'unica',
        valor: 20,
        formaPagamento: 'cartao',
      },
    })
    expect(response.status()).toBe(400)
  })

  test('requires a valid payment id for verification', async ({ request }) => {
    const response = await request.post('/api/apoio/verificar-pagamento', { data: {} })
    expect(response.status()).toBe(400)
  })
})
