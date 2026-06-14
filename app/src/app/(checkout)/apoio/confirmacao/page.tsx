'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function LockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
      <span style={{ fontSize: 13, color: '#6b7280' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 600, color: '#0a0e1a', fontFamily: mono ? 'monospace' : 'inherit', textAlign: 'right' }}>
        {value}
      </span>
    </div>
  )
}

function ConfirmacaoContent() {
  const params = useSearchParams()
  const orderNsu = params.get('order_nsu') ?? ''
  const transactionNsu = params.get('transaction_nsu') ?? ''
  const slug = params.get('slug') ?? ''

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafd', fontFamily: 'var(--font-sans, system-ui)', color: '#0a0e1a' }}>
      <header style={{ background: '#fff', borderBottom: '1px solid #e5e7eb', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <Image src="/logos_meus-politicos_colorido_semfundo.png" alt="Meus Politicos" height={24} width={120} style={{ width: 'auto', height: 24, objectFit: 'contain' }} />
            <span style={{ padding: '2px 8px', borderRadius: 4, background: 'rgba(40,81,203,0.08)', color: '#2851cb', fontSize: 11, fontWeight: 700, letterSpacing: '0.05em' }}>
              APOIAR
            </span>
          </Link>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#6b7280' }}>
            <LockIcon /> Pagamento via Asaas
          </span>
        </div>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '64px 32px 80px', textAlign: 'center' }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', fontSize: 36 }}>
          ✓
        </div>
        <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Apoio recebido</h1>
        <p style={{ fontSize: 15, color: '#4b5563', marginBottom: 32, lineHeight: 1.6 }}>
          Obrigado por acreditar em transparencia politica. A confirmacao financeira sera processada com seguranca pelo Asaas.
        </p>

        {(orderNsu || transactionNsu || slug) && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 24, marginBottom: 28, textAlign: 'left' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#9ca3af', marginBottom: 16, letterSpacing: '0.05em' }}>
              REFERENCIA DA TRANSACAO
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {orderNsu && <Row label="Pedido" value={orderNsu} mono />}
              {transactionNsu && <Row label="Transacao" value={transactionNsu} mono />}
              {slug && <Row label="Referencia" value={slug} mono />}
            </div>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Link href="/" style={{ display: 'block', padding: '14px', borderRadius: 10, background: '#2851cb', color: '#fff', textDecoration: 'none', fontSize: 14, fontWeight: 700 }}>
            Voltar ao site
          </Link>
          <Link href="/apoio" style={{ display: 'block', padding: '14px', borderRadius: 10, background: '#fff', color: '#374151', border: '1px solid #e5e7eb', textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
            Voltar para apoio
          </Link>
        </div>

        <div style={{ marginTop: 32, padding: '16px 20px', borderRadius: 10, background: 'rgba(40,81,203,0.05)', border: '1px solid rgba(40,81,203,0.1)' }}>
          <p style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, margin: 0 }}>
            Publicamos relatorios de transparencia com o uso dos recursos arrecadados para manter o projeto independente.
          </p>
        </div>
      </main>
    </div>
  )
}

export default function ConfirmacaoPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafd' }}>
        <span style={{ fontSize: 14, color: '#6b7280' }}>Carregando...</span>
      </div>
    }>
      <ConfirmacaoContent />
    </Suspense>
  )
}
