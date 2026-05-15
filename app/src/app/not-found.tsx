export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'IBM Plex Mono, monospace',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 480 }}>
        <div style={{ fontSize: 11, letterSpacing: '0.14em', color: 'var(--mute)', marginBottom: 24 }}>
          ERRO · 404 · RECURSO NÃO ENCONTRADO
        </div>
        <div style={{
          fontSize: 96, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.05em', lineHeight: 1,
        }}>404</div>
        <p style={{ fontSize: 16, color: 'var(--ink-3)', marginTop: 20, lineHeight: 1.6 }}>
          Esta página não existe ou foi movida.
        </p>
        <div style={{ marginTop: 32, display: 'flex', gap: 12, justifyContent: 'center' }}>
          <a href="/" style={{
            padding: '10px 20px', background: 'var(--brand)', color: 'white',
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>← Voltar ao início</a>
          <a href="/busca" style={{
            padding: '10px 20px', background: 'transparent',
            border: '1px solid var(--line-strong)', color: 'var(--ink-2)',
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}>Buscar políticos</a>
        </div>
        <div style={{ marginTop: 48, fontSize: 11, color: 'var(--mute)', letterSpacing: '0.08em' }}>
          meuspoliticos.com.br · transparência · dados · cidadania
        </div>
      </div>
    </div>
  )
}

