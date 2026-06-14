'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshCw } from 'lucide-react'
import Image from 'next/image'

type TipoApoio = 'mensal' | 'unica'

export default function ApoioPage() {
  const [pagamentoEmAndamento, setPagamentoEmAndamento] = useState<TipoApoio | null>(null)
  const [erroPagamento, setErroPagamento] = useState<string | null>(null)

  // Estados do Apoio Inline
  const [modalTipo, setModalTipo] = useState<TipoApoio>('mensal')
  const [modalValor, setModalValor] = useState<number>(25)
  const [isCustomValor, setIsCustomValor] = useState(false)
  
  // Etapa do Checkout
  const [etapa, setEtapa] = useState<'cadastro' | 'pagamento' | 'sucesso'>('cadastro')
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'cartao'>('pix')

  // Informações do Apoiador
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [cpfCnpj, setCpfCnpj] = useState('')
  const [telefone, setTelefone] = useState('')

  // Informações do Cartão de Crédito
  const [cartaoHolderName, setCartaoHolderName] = useState('')
  const [cartaoNumber, setCartaoNumber] = useState('')
  const [cartaoExpiry, setCartaoExpiry] = useState('')
  const [cartaoCvv, setCartaoCvv] = useState('')
  const [cartaoPostalCode, setCartaoPostalCode] = useState('')
  const [cartaoAddressNumber, setCartaoAddressNumber] = useState('')

  // Retorno da Cobrança Pix
  const [pixQrCode, setPixQrCode] = useState('')
  const [pixCopiaCola, setPixCopiaCola] = useState('')
  const [paymentId, setPaymentId] = useState('')
  const [copiado, setCopiado] = useState(false)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  const pararPollingPix = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current)
      pollingRef.current = null
    }
  }

  // Limpar polling se desmontar
  useEffect(() => {
    return () => pararPollingPix()
  }, [])

  const iniciarPollingPix = (payId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current)
    pollingRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/apoio/verificar-pagamento', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ paymentId: payId })
        })
        const data = await response.json()
        if (response.ok && data.paid) {
          pararPollingPix()
          setEtapa('sucesso')
        }
      } catch (err) {
        console.warn('Erro ao verificar status do Pix:', err)
      }
    }, 5000)
  }

  const handleVerificarPixManual = async () => {
    if (!paymentId) return
    setPagamentoEmAndamento(modalTipo)
    setErroPagamento(null)
    try {
      const response = await fetch('/api/apoio/verificar-pagamento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentId })
      })
      const data = await response.json()
      if (response.ok && data.paid) {
        pararPollingPix()
        setEtapa('sucesso')
      } else {
        setErroPagamento('Pagamento ainda não detectado. Se você já pagou, aguarde alguns instantes.')
      }
    } catch {
      setErroPagamento('Erro ao conectar com o servidor para verificar o pagamento.')
    } finally {
      setPagamentoEmAndamento(null)
    }
  }

  const handleCopiarPix = () => {
    if (!pixCopiaCola) return
    navigator.clipboard.writeText(pixCopiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Máscaras de entrada
  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 14) return
    
    let formatted = raw
    if (raw.length <= 11) {
      formatted = raw
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
    } else {
      formatted = raw
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
    }
    setCpfCnpj(formatted)
  }

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 11) return

    let formatted = raw
    if (raw.length <= 10) {
      formatted = raw
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
    } else {
      formatted = raw
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
    }
    setTelefone(formatted)
  }

  const handleValidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 4) return
    let formatted = raw
    if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}`
    }
    setCartaoExpiry(formatted)
  }

  const handleNumeroCartaoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 16) return
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCartaoNumber(formatted)
  }

  const handlePostalCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '')
    if (raw.length > 8) return
    const formatted = raw.replace(/(\d{5})(\d{1,3})$/, '$1-$2')
    setCartaoPostalCode(formatted)
  }

  async function handleConfirmarApoioInline(e: React.FormEvent) {
    e.preventDefault()
    if (!modalTipo) return

    if (!nome.trim()) {
      setErroPagamento('Informe seu nome completo.')
      return
    }
    if (!email.trim() || !email.includes('@')) {
      setErroPagamento('Informe um e-mail válido.')
      return
    }
    const cleanCpf = cpfCnpj.replace(/\D/g, '')
    if (cleanCpf.length !== 11 && cleanCpf.length !== 14) {
      setErroPagamento('Informe um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.')
      return
    }
    const cleanPhone = telefone.replace(/\D/g, '')
    if (cleanPhone.length < 10) {
      setErroPagamento('Informe um telefone válido com DDD.')
      return
    }

    if (formaPagamento === 'cartao') {
      if (!cartaoHolderName.trim()) {
        setErroPagamento('Informe o nome do titular do cartão.')
        return
      }
      if (cartaoNumber.replace(/\s/g, '').length < 15) {
        setErroPagamento('Informe um número de cartão válido.')
        return
      }
      if (!cartaoExpiry.includes('/') || cartaoExpiry.length < 5) {
        setErroPagamento('Informe a validade no formato MM/AA.')
        return
      }
      if (cartaoCvv.trim().length < 3) {
        setErroPagamento('Informe o código de segurança (CVV).')
        return
      }
      if (cartaoPostalCode.replace(/\D/g, '').length < 8) {
        setErroPagamento('Informe um CEP de faturamento válido.')
        return
      }
      if (!cartaoAddressNumber.trim()) {
        setErroPagamento('Informe o número do endereço.')
        return
      }
    }

    setPagamentoEmAndamento(modalTipo)
    setErroPagamento(null)

    try {
      const payload = {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        cpfCnpj: cleanCpf,
        telefone: cleanPhone,
        tipo: modalTipo,
        valor: modalValor,
        formaPagamento,
        ...(formaPagamento === 'cartao' ? {
          cartaoInfo: {
            holderName: cartaoHolderName.trim(),
            number: cartaoNumber.replace(/\s/g, ''),
            expiry: cartaoExpiry,
            ccv: cartaoCvv.trim(),
            postalCode: cartaoPostalCode.replace(/\D/g, ''),
            addressNumber: cartaoAddressNumber.trim()
          }
        } : {})
      }

      const response = await fetch('/api/apoio/criar-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (!response.ok) {
        setErroPagamento(data.error ?? 'Não foi possível processar seu pagamento. Verifique seus dados e tente novamente.')
        return
      }

      if (formaPagamento === 'pix') {
        setPixQrCode(data.qrCode)
        setPixCopiaCola(data.copiaCola)
        setPaymentId(data.paymentId)
        iniciarPollingPix(data.paymentId)
      } else {
        setEtapa('sucesso')
      }
    } catch {
      setErroPagamento('Falha de conexão ao processar pagamento.')
    } finally {
      setPagamentoEmAndamento(null)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', color: 'var(--ink)', position: 'relative', overflow: 'hidden', minHeight: '100vh' }}>
      
      {/* Halos/Glows decorativos em segundo plano */}
      <div style={{
        position: 'absolute',
        top: '-5%',
        left: '10%',
        width: '500px',
        height: '500px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99, 102, 241, 0.12) 0%, rgba(99, 102, 241, 0) 70%)',
        filter: 'blur(80px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />
      <div style={{
        position: 'absolute',
        bottom: '25%',
        right: '-10%',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, rgba(236, 72, 153, 0) 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* ── Seção de Apoio Principal (Direct & Fluid Checkout) ───────────────── */}
      <section id="apoiar" style={{ background: 'transparent', padding: '128px 24px 80px', position: 'relative', zIndex: 1 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{
              fontSize: 42, fontWeight: 900, margin: '0 0 16px',
              letterSpacing: '-0.03em',
              lineHeight: 1.15,
              color: 'var(--ink)',
              fontFamily: 'var(--font-display)',
            }}>
              Seja um mantenedor da <span style={{
                background: 'linear-gradient(135deg, var(--brand-2) 0%, #a855f7 50%, #f43f5e 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>independência</span>
            </h2>
            <p style={{ fontSize: 15, color: 'var(--ink-3)', margin: '0 auto', maxWidth: 460, lineHeight: 1.6 }}>
              Escolha o valor e a frequência do seu apoio para manter o portal Meus Políticos 100% independente.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-7" style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              padding: '40px 32px',
              boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
              position: 'relative',
              zIndex: 2
            }}>
            
            {/* FORMULÁRIO DE CADASTRO E PAGAMENTO */}
            {etapa !== 'sucesso' && !pixQrCode && (
              <form onSubmit={handleConfirmarApoioInline} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                
                {/* Frequência do Apoio */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    FREQUÊNCIA DO APOIO
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => {
                        setModalTipo('mensal')
                        if (!isCustomValor) setModalValor(25)
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 10,
                        border: modalTipo === 'mensal' ? '2px solid var(--brand-2)' : '1px solid var(--line)',
                        background: modalTipo === 'mensal' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Mensal (Recorrente)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setModalTipo('unica')
                        if (!isCustomValor) setModalValor(50)
                      }}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 10,
                        border: modalTipo === 'unica' ? '2px solid var(--brand-2)' : '1px solid var(--line)',
                        background: modalTipo === 'unica' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      Único (Uma vez)
                    </button>
                  </div>
                </div>

                {/* Seleção do Valor */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    VALOR DO APOIO
                  </span>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
                    {[10, 25, 50, 100].map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setModalValor(val)
                          setIsCustomValor(false)
                        }}
                        style={{
                          padding: '10px 0',
                          borderRadius: 8,
                          border: (!isCustomValor && modalValor === val) ? '2px solid var(--brand-2)' : '1px solid var(--line)',
                          background: (!isCustomValor && modalValor === val) ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.2)',
                          color: 'var(--ink)',
                          fontWeight: 700,
                          fontSize: 14,
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                      >
                        R$ {val}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomValor(true)
                        setModalValor(20) // padrão ao clicar em custom
                      }}
                      style={{
                        padding: '10px 0',
                        borderRadius: 8,
                        border: isCustomValor ? '2px solid var(--brand-2)' : '1px solid var(--line)',
                        background: isCustomValor ? 'rgba(99, 102, 241, 0.15)' : 'rgba(30, 41, 59, 0.2)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      Outro
                    </button>
                  </div>

                  {/* Input de Valor Customizado */}
                  {isCustomValor && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}>
                      <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink-2)' }}>R$</span>
                      <input
                        type="number"
                        min="5"
                        placeholder="Digite o valor"
                        value={modalValor || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value)
                          setModalValor(isNaN(val) ? 0 : val)
                        }}
                        className="input-apoio"
                        style={{ height: 38 }}
                      />
                      <span style={{ fontSize: 11, color: 'var(--ink-3)' }}>Mínimo de R$ 5</span>
                    </div>
                  )}
                </div>

                {/* Seus Dados */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    SEUS DADOS
                  </span>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="text"
                      required
                      placeholder="Nome Completo"
                      value={nome}
                      onChange={(e) => setNome(e.target.value)}
                      className="input-apoio"
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <input
                      type="email"
                      required
                      placeholder="Endereço de E-mail"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-apoio"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="text"
                      required
                      placeholder="CPF / CNPJ"
                      value={cpfCnpj}
                      onChange={handleCpfCnpjChange}
                      className="input-apoio"
                    />
                    <input
                      type="text"
                      required
                      placeholder="WhatsApp (com DDD)"
                      value={telefone}
                      onChange={handleTelefoneChange}
                      className="input-apoio"
                    />
                  </div>
                </div>

                {/* Forma de Pagamento */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                    FORMA DE PAGAMENTO
                  </span>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('pix')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 10,
                        border: formaPagamento === 'pix' ? '2px solid var(--brand-2)' : '1px solid var(--line)',
                        background: formaPagamento === 'pix' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ color: formaPagamento === 'pix' ? 'var(--brand-2)' : 'var(--ink-3)' }}>
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                      </svg>
                      Pix
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormaPagamento('cartao')}
                      style={{
                        flex: 1,
                        padding: '12px',
                        borderRadius: 10,
                        border: formaPagamento === 'cartao' ? '2px solid var(--brand-2)' : '1px solid var(--line)',
                        background: formaPagamento === 'cartao' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(30, 41, 59, 0.2)',
                        color: 'var(--ink)',
                        fontWeight: 700,
                        fontSize: 14,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: formaPagamento === 'cartao' ? 'var(--brand-2)' : 'var(--ink-3)' }}>
                        <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
                        <line x1="2" y1="10" x2="22" y2="10" />
                      </svg>
                      Cartão
                    </button>
                  </div>
                </div>

                {/* Dados do Cartão (inline se selecionado) */}
                {formaPagamento === 'cartao' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em' }}>
                      DADOS DO CARTÃO
                    </span>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        type="text"
                        required
                        placeholder="Nome como escrito no cartão"
                        value={cartaoHolderName}
                        onChange={(e) => setCartaoHolderName(e.target.value.toUpperCase())}
                        className="input-apoio"
                      />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <input
                        type="text"
                        required
                        placeholder="Número do Cartão"
                        value={cartaoNumber}
                        onChange={handleNumeroCartaoChange}
                        className="input-apoio"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="Validade (MM/AA)"
                        value={cartaoExpiry}
                        onChange={handleValidadeChange}
                        className="input-apoio"
                      />
                      <input
                        type="text"
                        required
                        placeholder="CVV"
                        value={cartaoCvv}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '')
                          if (raw.length <= 4) setCartaoCvv(raw)
                        }}
                        className="input-apoio"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <input
                        type="text"
                        required
                        placeholder="CEP do Titular"
                        value={cartaoPostalCode}
                        onChange={handlePostalCodeChange}
                        className="input-apoio"
                      />
                      <input
                        type="text"
                        required
                        placeholder="Número do Endereço"
                        value={cartaoAddressNumber}
                        onChange={(e) => setCartaoAddressNumber(e.target.value)}
                        className="input-apoio"
                      />
                    </div>
                  </div>
                )}

                {erroPagamento && (
                  <div style={{ fontSize: 12, color: 'var(--neg)', fontWeight: 500, lineHeight: 1.4 }}>
                    {erroPagamento}
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-apoio-primary"
                  style={{
                    width: '100%',
                    height: 46,
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 700,
                    cursor: pagamentoEmAndamento !== null ? 'wait' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    marginTop: 8
                  }}
                  disabled={pagamentoEmAndamento !== null}
                >
                  {pagamentoEmAndamento !== null ? (
                    <>
                      <RefreshCw size={16} className="spin" /> Processando...
                    </>
                  ) : formaPagamento === 'pix' ? 'Gerar Código Pix' : `Apoiar com R$ ${modalValor} ${modalTipo === 'mensal' ? '/mês' : ''}`}
                </button>

              </form>
            )}

            {/* SE PIX GERADO */}
            {etapa !== 'sucesso' && pixQrCode && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--ink)', textAlign: 'center', margin: 0 }}>
                  Pix de R$ {modalValor} gerado!
                </h3>
                
                <div style={{ display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
                  <div style={{ background: '#ffffff', padding: '16px', borderRadius: '16px', border: '1px solid var(--line)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                    <Image
                      src={`data:image/png;base64,${pixQrCode}`}
                      alt="QR Code Pix"
                      width={180}
                      height={180}
                      unoptimized
                      style={{ display: 'block' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>CÓDIGO PIX (COPIA E COLA)</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="text"
                      readOnly
                      value={pixCopiaCola}
                      onClick={(e) => (e.target as HTMLInputElement).select()}
                      style={{
                        height: 38,
                        flex: 1,
                        padding: '0 12px',
                        background: 'rgba(30, 41, 59, 0.4)',
                        border: '1px solid var(--line)',
                        borderRadius: 8,
                        color: 'var(--ink)',
                        fontSize: 12,
                        outline: 'none',
                        textOverflow: 'ellipsis'
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleCopiarPix}
                      style={{
                        padding: '0 16px',
                        borderRadius: 8,
                        background: copiado ? 'var(--pos-soft)' : 'var(--surface)',
                        border: `1px solid ${copiado ? 'var(--pos)' : 'var(--line)'}`,
                        color: copiado ? 'var(--pos)' : 'var(--ink)',
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {copiado ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, margin: '6px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: 'var(--ink-2)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                    <RefreshCw size={14} className="spin" style={{ color: 'var(--brand-2)' }} />
                    Aguardando confirmação de pagamento...
                  </div>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.5 }}>
                    Abra o app do seu banco, escolha &quot;Pagar via Pix&quot; e aponte a câmera para o QR Code ou cole o código acima.
                  </p>
                </div>

                {erroPagamento && (
                  <div style={{ fontSize: 12, color: 'var(--neg)', fontWeight: 500, textAlign: 'center' }}>
                    {erroPagamento}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    type="button"
                    onClick={() => {
                      pararPollingPix()
                      setPixQrCode('')
                      setPixCopiaCola('')
                      setPaymentId('')
                    }}
                    className="btn-modal-cancel"
                    style={{ flex: 1, height: 42 }}
                    disabled={pagamentoEmAndamento !== null}
                  >
                    Voltar / Alterar valor
                  </button>
                  <button
                    type="button"
                    onClick={handleVerificarPixManual}
                    className="btn-apoio-primary"
                    style={{
                      flex: 1.5, height: 42, borderRadius: 8, fontSize: 13, fontWeight: 700,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                    }}
                    disabled={pagamentoEmAndamento !== null}
                  >
                    {pagamentoEmAndamento !== null ? (
                      <RefreshCw size={14} className="spin" />
                    ) : null}
                    Já paguei
                  </button>
                </div>
              </div>
            )}

            {/* ETAPA SUCESSO */}
            {etapa === 'sucesso' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '20px 0' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 32, color: '#fff', marginBottom: 24,
                  boxShadow: '0 8px 20px rgba(16, 185, 129, 0.3)'
                }}>
                  ✓
                </div>
                <h4 style={{ fontSize: 22, fontWeight: 800, color: 'var(--ink)', margin: '0 0 12px' }}>
                  Apoio Confirmado!
                </h4>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: '0 0 24px' }}>
                  Muito obrigado por sua contribuição de <strong>R$ {modalValor}</strong>. Seu apoio cívico foi registrado e processado com sucesso.
                </p>
                <div style={{ padding: '16px 20px', borderRadius: 12, background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.1)', marginBottom: 28 }}>
                  <p style={{ fontSize: 12, color: 'var(--ink-3)', margin: 0, lineHeight: 1.6 }}>
                    Seu investimento financia nossa infraestrutura independente de dados públicos, IA e rigor fiscal.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEtapa('cadastro')
                    setPixQrCode('')
                    setPixCopiaCola('')
                    setPaymentId('')
                    setNome('')
                    setEmail('')
                    setCpfCnpj('')
                    setTelefone('')
                    setCartaoHolderName('')
                    setCartaoNumber('')
                    setCartaoExpiry('')
                    setCartaoCvv('')
                    setCartaoPostalCode('')
                    setCartaoAddressNumber('')
                  }}
                  className="btn-apoio-primary"
                  style={{ width: '100%', height: 46, borderRadius: 12, fontWeight: 700 }}
                >
                  Fazer outro apoio
                </button>
              </div>
            )}

          </div>

            {/* Coluna 2: Texto Explicativo (Por que doar?) */}
            <div className="lg:col-span-5" style={{
              background: 'var(--panel)',
              border: '1px solid var(--line)',
              borderRadius: 24,
              padding: '40px 32px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
              position: 'relative',
              zIndex: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}>
              <div>
                <h3 style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: 'var(--ink)',
                  margin: '0 0 16px',
                  fontFamily: 'var(--font-display)'
                }}>
                  Por que apoiar o Meus Políticos?
                </h3>
                <p style={{ fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.6, margin: 0 }}>
                  Somos uma plataforma cidadã 100% independente que acredita no poder da fiscalização social e no livre acesso à informação.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {[
                  {
                    title: 'Independência Editorial',
                    desc: 'Não recebemos verbas de governos, partidos ou coligações políticas. Nossa fidelidade é exclusivamente com a transparência pública.'
                  },
                  {
                    title: 'Custos de Infraestrutura',
                    desc: 'Manter robôs e scrapers coletando dados públicos de 1.680 parlamentares em tempo real exige servidores potentes 24 horas por dia.'
                  },
                  {
                    title: 'Gratuito e Sem Anúncios',
                    desc: 'Acreditamos que a transparência cívica deve ser pública e livre de barreiras. Não cobramos mensalidades obrigatórias e não exibimos anúncios comerciais.'
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', gap: 12 }}>
                    <div style={{
                      color: 'var(--brand-2)',
                      fontSize: 16,
                      fontWeight: 'bold',
                      lineHeight: 1
                    }}>
                      ✓
                    </div>
                    <div>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--ink)', margin: '0 0 4px' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: 12.5, color: 'var(--ink-3)', lineHeight: 1.5, margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Status de Uptime do Servidor */}
              <div style={{
                marginTop: 8,
                padding: '16px',
                borderRadius: 12,
                background: 'rgba(30, 41, 59, 0.3)',
                border: '1px solid var(--line)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 11, color: 'var(--ink-3)', fontFamily: 'var(--font-mono)' }}>
                  STATUS DO PORTAL
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: 'var(--pos)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <span style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: 'var(--pos)',
                    display: 'inline-block'
                  }} />
                  UPTIME 99.98%
                </span>
              </div>
            </div>

          </div>
        </div>
      </section>




      {/* Estilos CSS embutidos para comportamento responsivo e animações */}
      <style>{`
        .spin {
          animation: spin-animation 1s linear infinite;
        }
        @keyframes spin-animation {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .hover-scale {
          transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .hover-scale:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }

        /* Grades Responsivas */
        .grid-custos {
          display: grid;
          grid-template-columns: 1fr;
          gap: 48px;
          align-items: center;
        }
        .grid-planos {
          display: grid;
          grid-template-columns: 1fr;
          gap: 28px;
          max-width: 900px;
          margin: 0 auto;
        }
        .grid-legendas {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }

        /* Classes de botões */
        .btn-apoio-primary {
          background: linear-gradient(135deg, var(--brand-2) 0%, #7c3aed 100%);
          color: #fff !important;
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.25);
        }
        .btn-apoio-primary:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
          filter: brightness(1.1);
        }
        .btn-apoio-secondary {
          background: var(--surface);
          border: 1px solid var(--line);
          color: var(--ink-2) !important;
        }
        .btn-apoio-secondary:hover {
          background: var(--panel);
          border-color: var(--line-strong);
          color: var(--ink) !important;
          transform: translateY(-1px);
        }

        /* Formulários e Inputs do Modal */
        .input-apoio {
          height: 38px;
          width: 100%;
          padding: 0 12px;
          background: rgba(30, 41, 59, 0.4);
          border: 1px solid var(--line);
          border-radius: 8px;
          color: var(--ink);
          font-size: 13px;
          outline: none;
          transition: border-color 0.15s ease;
        }
        .input-apoio:focus {
          border-color: var(--brand-2);
        }

        .btn-modal-cancel {
          background: transparent;
          border: 1px solid var(--line);
          color: var(--ink-2) !important;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-modal-cancel:hover {
          background: rgba(255,255,255,0.03);
          border-color: var(--line-strong);
        }

        /* Modal Overlay & Card */
        .modal-backdrop {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          background: rgba(10, 14, 26, 0.7);
          backdrop-filter: blur(8px);
          animation: fade-in 0.2s ease;
        }
        .modal-card {
          background: var(--panel);
          border: 1px solid var(--line);
          border-radius: 18px;
          width: 440px;
          max-width: 90vw;
          padding: 32px 28px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.5);
          animation: scale-up 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scale-up {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        /* Media Queries de Breakpoints */
        @media (min-width: 640px) {
          .grid-legendas {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        @media (min-width: 768px) {
          .grid-planos {
            grid-template-columns: 1fr 1fr;
          }
        }
        @media (min-width: 1024px) {
          .grid-custos {
            grid-template-columns: 1fr 1fr;
            gap: 80px;
          }
          .grid-legendas {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      `}</style>
    </div>
  )
}
