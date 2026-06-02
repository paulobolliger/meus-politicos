import { getLogtoContext, type LogtoContext } from '@logto/next/server-actions'

import { getLogtoConfig } from './config'

export async function getLogtoSession(): Promise<LogtoContext> {
  return getLogtoContext(getLogtoConfig(), { fetchUserInfo: true })
}

export async function getAuthenticatedLogtoSession(): Promise<LogtoContext | null> {
  const session = await getLogtoSession()

  return session.isAuthenticated ? session : null
}
