/**
 * Tipos compartilhados de autenticação para o runtime Logto.
 */

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
  legacyAuthUserId: string | null
  authProvider: string | null
  migradoLogtoEm: string | null
}

export type CurrentUser = {
  provider: 'logto'
  perfilId: string
  email: string | null
  name: string | null
  role: UserRole
  logtoSub: string | null
  legacyAuthUserId: string | null
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
