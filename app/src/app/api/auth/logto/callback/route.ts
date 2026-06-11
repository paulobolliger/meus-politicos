import { handleSignIn } from '@logto/next/server-actions'
import { NextRequest, NextResponse } from 'next/server'

import { getLogtoConfig } from '@/lib/logto/config'

const PAINEL_URL = process.env.NEXT_PUBLIC_PAINEL_URL ?? 'https://painel.meuspoliticos.com.br'

function getRedirectUrl(request: NextRequest) {
  const redirectTo = request.nextUrl.searchParams.get('redirectTo') || '/painel'
  const host = request.headers.get('host') ?? ''

  if (
    host === 'localhost:3000' ||
    host === '127.0.0.1:3000' ||
    host.startsWith('painel.localhost') ||
    host.startsWith('app.localhost')
  ) {
    return new URL(redirectTo, request.url)
  }

  return new URL(redirectTo, PAINEL_URL)
}

export async function GET(request: NextRequest) {
  const host = request.headers.get('host')
  const proto = request.headers.get('x-forwarded-proto') ?? 'http'
  const customBaseUrl = host ? `${proto}://${host}` : undefined

  const config = getLogtoConfig(customBaseUrl)
  const callbackUrl = new URL(
    `${request.nextUrl.pathname}${request.nextUrl.search}${request.nextUrl.hash}`,
    config.baseUrl,
  )

  await handleSignIn(config, callbackUrl)

  return NextResponse.redirect(getRedirectUrl(request))
}
