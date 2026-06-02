import { signIn } from '@logto/next/server-actions'
import { NextRequest } from 'next/server'

import { getLogtoConfig, logtoCallbackPath } from '@/lib/logto/config'

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get('email')?.trim()
  const config = getLogtoConfig()
  const redirectUri = new URL(logtoCallbackPath, config.baseUrl)
  const postRedirectUri = new URL('/login', request.url)

  await signIn(config, {
    redirectUri,
    postRedirectUri,
    firstScreen: 'reset_password',
    identifiers: ['email'],
    loginHint: email || undefined,
  })
}
