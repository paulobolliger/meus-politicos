/**
 * File: app/src/lib/auth/providers.ts
 * Purpose: Provider selection for the phased Supabase Auth -> Logto migration.
 * References:
 * - docs/auth/AUTH_MIGRATION_LOGTO.md
 * - docs/adr/ADR-001-logto-as-identity-provider.md
 *
 * Sprint 1B only introduces provider detection. The default remains Supabase
 * and no runtime consumer is changed in this sprint.
 */

import type { AuthProvider } from './types'

export const AUTH_PROVIDERS = ['supabase', 'logto'] as const satisfies readonly AuthProvider[]

export const DEFAULT_AUTH_PROVIDER: AuthProvider = 'supabase'

export function parseAuthProvider(value: string | undefined): AuthProvider {
  if (value === 'logto' || value === 'supabase') {
    return value
  }

  return DEFAULT_AUTH_PROVIDER
}

export function getAuthProvider(): AuthProvider {
  return parseAuthProvider(process.env.AUTH_PROVIDER)
}

export function isLogtoEnabled(): boolean {
  return getAuthProvider() === 'logto'
}

export function isSupabaseEnabled(): boolean {
  return getAuthProvider() === 'supabase'
}
