import { type NextRequest, NextResponse } from 'next/server'
import LogtoEdgeClient from '@logto/next/edge'

import { getAuthProvider } from '@/lib/auth/providers'
import { getLogtoConfig } from '@/lib/logto/config'
import { updateSession } from '@/lib/supabase/middleware'

type ProxySession = {
  response: NextResponse
  user: { id: string } | null
}

export async function getProxySession(request: NextRequest): Promise<ProxySession> {
  if (getAuthProvider() === 'logto') {
    const client = new LogtoEdgeClient(getLogtoConfig())
    const context = await client.getLogtoContext(request)
    const user = context.isAuthenticated && context.claims?.sub
      ? { id: context.claims.sub }
      : null

    return {
      response: NextResponse.next({ request }),
      user,
    }
  }

  const { supabaseResponse, user } = await updateSession(request)

  return {
    response: supabaseResponse,
    user: user ? { id: user.id } : null,
  }
}
