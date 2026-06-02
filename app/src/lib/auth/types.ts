/**
 * File: app/src/lib/auth/types.ts
 * Purpose: Shared auth types for the phased Supabase Auth -> Logto migration.
 * References:
 * - docs/auth/AUTH_MIGRATION_LOGTO.md
 * - docs/adr/ADR-001-logto-as-identity-provider.md
 *
 * Sprint 1B is compatibility-only. Supabase remains the runtime provider.
 */

export type AuthProvider = 'supabase' | 'logto'

export type UserRole = 'user' | 'admin' | string

export type AuthProfile = {
  id: string
  nome: string | null
  /**
   * Email resolved from the identity provider or from legacy auth.users.
   * public.perfis does not own an email column during the migration.
   */
  email: string | null
  role: UserRole
  logtoSub: string | null
  supabaseUserId: string | null
  authProvider: AuthProvider
  migradoLogtoEm: string | null
}

export type CurrentUser = {
  provider: AuthProvider
  perfilId: string
  email: string | null
  name: string | null
  role: UserRole
  logtoSub: string | null
  supabaseUserId: string | null
  profile: AuthProfile | null
}

export class AuthRequiredError extends Error {
  constructor(message = 'Authentication required') {
    super(message)
    this.name = 'AuthRequiredError'
  }
}

export class AdminRequiredError extends Error {
  constructor(message = 'Admin role required') {
    super(message)
    this.name = 'AdminRequiredError'
  }
}
