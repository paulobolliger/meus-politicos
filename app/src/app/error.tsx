'use client'
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--neg)', marginBottom: 24 }}>
          ERRO · FALHA INESPERADA
        </div>
        <div style={{ fontSize: 64, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.04em' }}>
          Algo deu errado.
        </div>
        <p style={{ fontSize: 15, color: 'var(--ink-3)', marginTop: 16, lineHeight: 1.6 }}>
          Ocorreu um erro inesperado. Tente novamente ou volte ao início.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={reset} style={{
            padding: '10px 20px', background: 'var(--brand)', color: 'white',
            border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
          }}>Tentar novamente</button>
          <a href="/" style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid var(--line-strong)', color: 'var(--ink-2)',
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>← Início</a>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: 32, padding: 16, background: 'var(--neg-soft)', border: '1px solid var(--neg)', fontSize: 11, textAlign: 'left', color: 'var(--neg)' }}>
            {error.message}
          </div>
        )}
      </div>
    </div>
  )
}

