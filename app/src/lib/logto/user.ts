import type { LogtoContext } from '@logto/next/server-actions'

import type { CurrentUser } from '@/lib/auth/types'

function getClaimString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null
}

export function buildCurrentUserFromLogto(session: LogtoContext): CurrentUser | null {
  const sub = getClaimString(session.claims?.sub)

  if (!session.isAuthenticated || !sub) {
    return null
  }

  const email =
    getClaimString(session.userInfo?.email) ??
    getClaimString(session.claims?.email)

  const name =
    getClaimString(session.userInfo?.name) ??
    getClaimString(session.claims?.name) ??
    getClaimString(session.claims?.username)

  return {
    provider: 'logto',
    perfilId: sub,
    email,
    name,
    role: 'user',
    logtoSub: sub,
    supabaseUserId: null,
    profile: null,
  }
}
