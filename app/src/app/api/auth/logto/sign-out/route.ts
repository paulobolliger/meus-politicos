import { signOut } from '@logto/next/server-actions'
import { NextRequest } from 'next/server'

import { getLogtoConfig } from '@/lib/logto/config'

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const customBaseUrl = host ? `${proto}://${host}` : undefined
  const config = getLogtoConfig(customBaseUrl)

  const postSignOutRedirectUri = new URL('/', config.baseUrl)

  return await signOut(config, postSignOutRedirectUri.toString())
}
