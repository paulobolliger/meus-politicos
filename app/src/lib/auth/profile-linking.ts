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
import { Pool, type PoolClient, type Pool as PgPool } from 'pg'
import type { AuthProfile, AuthProvider, CurrentUser } from './types'

type RawPerfil = {
  id: string
  nome?: string | null
  role?: string | null
  logto_sub?: string | null
  supabase_user_id?: string | null
  auth_provider?: string | null
  migrado_logto_em?: string | null
}

type LegacyAuthUser = {
  id: string
  email: string | null
}

const PROFILE_SELECT = [
  'id',
  'nome',
  'role',
  'logto_sub',
  'supabase_user_id',
  'auth_provider',
  'migrado_logto_em',
].join(', ')

const PROFILE_SQL_SELECT = `
  id,
  nome,
  role,
  logto_sub,
  supabase_user_id,
  auth_provider,
  migrado_logto_em::text AS migrado_logto_em
`

let _pool: PgPool | null = null
function getPool(): PgPool {
  if (!_pool) {
    _pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }

  return _pool
}

function toAuthProvider(value: string | null | undefined): AuthProvider {
  return value === 'logto' ? 'logto' : 'supabase'
}

export function normalizeEmail(email: string | null | undefined): string | null {
  const normalized = email?.trim().toLowerCase()
  return normalized ? normalized : null
}

export function toAuthProfile(
  perfil: RawPerfil | null,
  email: string | null = null
): AuthProfile | null {
  if (!perfil) {
    return null
  }

  return {
    id: perfil.id,
    nome: perfil.nome ?? null,
    email,
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

export async function getProfileByLogtoSubPostgres(logtoSub: string): Promise<AuthProfile | null> {
  const { rows } = await getPool().query<RawPerfil>(
    `SELECT ${PROFILE_SQL_SELECT}
     FROM perfis
     WHERE logto_sub = $1
     LIMIT 1`,
    [logtoSub]
  )

  return toAuthProfile(rows[0] ?? null)
}

export async function getProfileByLegacyEmail(
  supabase: SupabaseClient,
  email: string | null | undefined
): Promise<AuthProfile | null> {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return null
  }

  const { data: users, error: usersError } = await (supabase as any)
    .schema('auth')
    .from('users')
    .select('id, email')
    .ilike('email', normalizedEmail)

  if (usersError) {
    throw usersError
  }

  const legacyUsers = (users ?? []) as LegacyAuthUser[]

  if (legacyUsers.length !== 1) {
    return null
  }

  const legacyUser = legacyUsers[0]
  const profile =
    (await getProfileBySupabaseUserId(supabase, legacyUser.id)) ??
    (await getProfileById(supabase, legacyUser.id))

  return profile ? { ...profile, email: normalizeEmail(legacyUser.email) } : null
}

async function getLegacyProfileByEmailPostgres(
  client: PgPool | PoolClient,
  email: string | null | undefined
): Promise<AuthProfile | null> {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return null
  }

  const { rows: legacyUsers } = await client.query<LegacyAuthUser>(
    'SELECT id, email FROM auth.users WHERE lower(email) = $1',
    [normalizedEmail]
  )

  if (legacyUsers.length !== 1) {
    return null
  }

  const legacyUser = legacyUsers[0]
  const { rows } = await client.query<RawPerfil>(
    `SELECT ${PROFILE_SQL_SELECT}
     FROM perfis
     WHERE supabase_user_id = $1 OR id = $1
     LIMIT 1`,
    [legacyUser.id]
  )

  const profile = toAuthProfile(rows[0] ?? null, normalizeEmail(legacyUser.email))
  return profile
}

export async function getProfileByLegacyEmailPostgres(
  email: string | null | undefined
): Promise<AuthProfile | null> {
  return getLegacyProfileByEmailPostgres(getPool(), email)
}

export async function linkLogtoProfileByLegacyEmail(
  supabase: SupabaseClient,
  email: string | null | undefined,
  logtoSub: string
): Promise<AuthProfile | null> {
  const legacyProfile = await getProfileByLegacyEmail(supabase, email)

  if (!legacyProfile) {
    return null
  }

  const { data, error } = await (supabase as any)
    .from('perfis')
    .update({
      logto_sub: logtoSub,
      auth_provider: 'logto',
      migrado_logto_em: new Date().toISOString(),
    })
    .eq('id', legacyProfile.id)
    .is('logto_sub', null)
    .select(PROFILE_SELECT)
    .maybeSingle()

  if (error) {
    throw error
  }

  if (!data) {
    return getProfileByLogtoSub(supabase, logtoSub)
  }

  return toAuthProfile(data as RawPerfil, legacyProfile.email)
}

export async function linkLogtoProfileByLegacyEmailPostgres(
  email: string | null | undefined,
  logtoSub: string
): Promise<AuthProfile | null> {
  const pool = getPool()
  const client = await pool.connect()

  try {
    const legacyProfile = await getLegacyProfileByEmailPostgres(client, email)

    if (!legacyProfile) {
      return null
    }

    const { rows } = await client.query<RawPerfil>(
      `UPDATE perfis
       SET
         logto_sub = $1,
         auth_provider = 'logto',
         migrado_logto_em = now()
       WHERE id = $2
         AND logto_sub IS NULL
       RETURNING ${PROFILE_SQL_SELECT}`,
      [logtoSub, legacyProfile.id]
    )

    if (!rows[0]) {
      const { rows: linkedRows } = await client.query<RawPerfil>(
        `SELECT ${PROFILE_SQL_SELECT}
         FROM perfis
         WHERE logto_sub = $1
         LIMIT 1`,
        [logtoSub]
      )

      return toAuthProfile(linkedRows[0] ?? null, legacyProfile.email)
    }

    return toAuthProfile(rows[0], legacyProfile.email)
  } finally {
    client.release()
  }
}
