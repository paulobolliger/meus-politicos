/**
 * File: app/src/lib/auth/current-user.ts
 * Purpose: Provider-neutral current-user helpers for the Supabase Auth -> Logto migration.
 * References:
 * - docs/auth/AUTH_MIGRATION_LOGTO.md
 * - docs/adr/ADR-001-logto-as-identity-provider.md
 *
 * Sprint 1B keeps Supabase as the only implemented runtime provider. Logto is
 * intentionally not activated here and no consumers are changed in this sprint.
 */

import { createClient } from '@/lib/supabase/server'
import { getAuthProvider } from './providers'
import {
  AdminRequiredError,
  AuthRequiredError,
  type CurrentUser,
} from './types'
import {
  buildCurrentUserFromSupabase,
  getProfileById,
  getProfileBySupabaseUserId,
} from './profile-linking'

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const provider = getAuthProvider()

  if (provider === 'logto') {
    // Sprint 1B only reserves the provider switch. Until Sprint 2 wires Logto,
    // keep Supabase as the compatibility runtime to avoid behavior changes.
    return getCurrentSupabaseUser()
  }

  return getCurrentSupabaseUser()
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthRequiredError()
  }

  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()

  if (user.role !== 'admin') {
    throw new AdminRequiredError()
  }

  return user
}

async function getCurrentSupabaseUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  const profile =
    (await getProfileBySupabaseUserId(supabase, user.id)) ??
    (await getProfileById(supabase, user.id))

  return buildCurrentUserFromSupabase(user, profile)
}
