import { getLogtoContext, type LogtoContext } from '@logto/next/server-actions'
import { headers } from 'next/headers'

import { getLogtoConfig } from './config'

export async function getLogtoSession(): Promise<LogtoContext> {
  let customBaseUrl: string | undefined
  try {
    const headersList = await headers()
    const host = headersList.get('host')
    const proto = headersList.get('x-forwarded-proto') ?? 'http'
    if (host) {
      customBaseUrl = `${proto}://${host}`
    }
  } catch {
    // Silently fallback if called outside request context (e.g., during build phase)
  }

  const session = await getLogtoContext(getLogtoConfig(customBaseUrl), { fetchUserInfo: true })

  return session
}

export async function getAuthenticatedLogtoSession(): Promise<LogtoContext | null> {
  const session = await getLogtoSession()

  return session.isAuthenticated ? session : null
}
