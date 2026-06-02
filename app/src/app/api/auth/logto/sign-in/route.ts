import { signIn } from '@logto/next/server-actions'
import { NextRequest } from 'next/server'

import { getLogtoConfig, logtoCallbackPath } from '@/lib/logto/config'

function getSafeRedirectPath(request: NextRequest, fallback: string) {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') ?? fallback

  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) {
    return fallback
  }

  return redirectTo
}

export async function GET(request: NextRequest) {
  const config = getLogtoConfig()
  const redirectUri = new URL(logtoCallbackPath, config.baseUrl)
  const postRedirectUri = new URL(getSafeRedirectPath(request, '/painel'), request.url)

  await signIn(config, {
    redirectUri,
    postRedirectUri,
    interactionMode: 'signIn',
  })
}
