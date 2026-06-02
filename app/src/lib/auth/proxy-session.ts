import { type NextRequest, NextResponse } from 'next/server'
import LogtoEdgeClient from '@logto/next/edge'

import { getLogtoConfig } from '@/lib/logto/config'

type ProxySession = {
  response: NextResponse
  user: { id: string } | null
}

export async function getProxySession(request: NextRequest): Promise<ProxySession> {
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
