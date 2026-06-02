import type { LogtoNextConfig } from '@logto/next'

type RuntimeAuthProvider = 'supabase' | 'logto'

const defaultSiteUrl = 'http://localhost:3000'

export const authProvider = (process.env.AUTH_PROVIDER ?? 'supabase') as RuntimeAuthProvider

export const isLogtoEnabled = authProvider === 'logto'

export const logtoCallbackPath = '/api/auth/logto/callback'
export const logtoSignInPath = '/api/auth/logto/sign-in'
export const logtoSignOutPath = '/api/auth/logto/sign-out'

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  defaultSiteUrl

const getRequiredEnv = (name: string) => {
  const value = process.env[name]

  if (!value) {
    throw new Error(`Missing required Logto environment variable: ${name}`)
  }

  return value
}

export const getLogtoConfig = (): LogtoNextConfig => ({
  endpoint: getRequiredEnv('LOGTO_ENDPOINT'),
  appId: getRequiredEnv('LOGTO_APP_ID'),
  appSecret: getRequiredEnv('LOGTO_APP_SECRET'),
  baseUrl: getBaseUrl(),
  cookieSecret: getRequiredEnv('LOGTO_COOKIE_SECRET'),
  cookieSecure: getBaseUrl().startsWith('https://'),
})
