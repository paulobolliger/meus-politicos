/**
 * Client-side analytics — fire-and-forget, never blocks UI.
 * All calls are best-effort (errors silently swallowed).
 *
 * Usage:
 *   track('busca', { q: 'lula', cargo: 'senador' })
 *   track('perfil_view', { slug: 'alexandre-padilha-dep-sp', cargo: 'deputado_federal' })
 */
export function track(
  tipo: string,
  payload?: Record<string, unknown>,
): void {
  // Só dispara no cliente
  if (typeof window === 'undefined') return

  // Fire-and-forget — sem await intencional
  fetch('/api/analytics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ tipo, payload }),
    // keepalive permite envio mesmo ao navegar para outra página
    keepalive: true,
  }).catch(() => {})
}
