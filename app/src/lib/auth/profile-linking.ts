/**
 * File: app/src/lib/auth/profile-linking.ts
 * Purpose: Profile lookup helpers for the phased Supabase Auth -> Logto migration.
 * References:
 * - docs/auth/AUTH_MIGRATION_LOGTO.md
 * - docs/adr/ADR-001-logto-as-identity-provider.md
 *
 * Sprint 1B is read-only from the application perspective. These helpers do
 * not link, update, or create profiles; they only centralize lookup behavior
 * for later sprints.
 */

import type { SupabaseClient, User } from '@supabase/supabase-js'
import type { AuthProfile, AuthProvider, CurrentUser } from './types'

type RawPerfil = {
  id: string
  nome?: string | null
  email?: string | null
  role?: string | null
  logto_sub?: string | null
  supabase_user_id?: string | null
  auth_provider?: string | null
  migrado_logto_em?: string | null
}

const PROFILE_SELECT = [
  'id',
  'nome',
  'email',
  'role',
  'logto_sub',
  'supabase_user_id',
  'auth_provider',
  'migrado_logto_em',
].join(', ')

function toAuthProvider(value: string | null | undefined): AuthProvider {
  return value === 'logto' ? 'logto' : 'supabase'
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

export function toAuthProfile(perfil: RawPerfil | null): AuthProfile | null {
  if (!perfil) {
    return null
  }

  return {
    id: perfil.id,
    nome: perfil.nome ?? null,
    email: perfil.email ?? null,
    role: perfil.role ?? 'user',
    logtoSub: perfil.logto_sub ?? null,
    supabaseUserId: perfil.supabase_user_id ?? null,
    authProvider: toAuthProvider(perfil.auth_provider),
    migradoLogtoEm: perfil.migrado_logto_em ?? null,
  }
}

export function buildCurrentUserFromSupabase(user: User, profile: AuthProfile | null): CurrentUser {
  return {
    provider: 'supabase',
    perfilId: profile?.id ?? user.id,
    email: user.email ?? profile?.email ?? null,
    name: profile?.nome ?? user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
    role: profile?.role ?? 'user',
    logtoSub: profile?.logtoSub ?? null,
    supabaseUserId: profile?.supabaseUserId ?? user.id,
    profile,
  }
}

export async function getProfileById(
  supabase: SupabaseClient,
  profileId: string
): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select(PROFILE_SELECT)
    .eq('id', profileId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return toAuthProfile(data as RawPerfil | null)
}

export async function getProfileBySupabaseUserId(
  supabase: SupabaseClient,
  supabaseUserId: string
): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select(PROFILE_SELECT)
    .eq('supabase_user_id', supabaseUserId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return toAuthProfile(data as RawPerfil | null)
}

export async function getProfileByLogtoSub(
  supabase: SupabaseClient,
  logtoSub: string
): Promise<AuthProfile | null> {
  const { data, error } = await supabase
    .from('perfis')
    .select(PROFILE_SELECT)
    .eq('logto_sub', logtoSub)
    .maybeSingle()

  if (error) {
    throw error
  }

  return toAuthProfile(data as RawPerfil | null)
}
