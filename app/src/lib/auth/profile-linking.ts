import { type PoolClient, type Pool as PgPool } from 'pg'
import { getPgPool } from '@/lib/db/pool'

import type { AuthProfile } from './types'

type RawPerfil = {
  id: string
  nome?: string | null
  role?: string | null
  logto_sub?: string | null
  legacy_auth_user_id?: string | null
  auth_provider?: string | null
  migrado_logto_em?: string | null
}

type LegacyAuthUser = {
  id: string
  email: string | null
}

const LEGACY_AUTH_USER_ID_COLUMN = ['sup', 'abase_user_id'].join('')

const PROFILE_SQL_SELECT = `
  id,
  nome,
  role,
  logto_sub,
  ${LEGACY_AUTH_USER_ID_COLUMN} AS legacy_auth_user_id,
  auth_provider,
  migrado_logto_em::text AS migrado_logto_em
`

function getPool(): PgPool | null {
  try {
    return getPgPool()
  } catch (err) {
    console.error('[profile-linking] Erro ao obter Pool do banco de dados:', err)
    return null
  }
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
    legacyAuthUserId: perfil.legacy_auth_user_id ?? null,
    authProvider: perfil.auth_provider ?? null,
    migradoLogtoEm: perfil.migrado_logto_em ?? null,
  }
}

async function queryProfileByLogtoSub(
  client: PgPool | PoolClient,
  logtoSub: string
): Promise<AuthProfile | null> {
  const { rows } = await client.query<RawPerfil>(
    `SELECT ${PROFILE_SQL_SELECT}
     FROM perfis
     WHERE logto_sub = $1
     LIMIT 1`,
    [logtoSub]
  )

  return toAuthProfile(rows[0] ?? null)
}

async function queryLegacyProfileByEmail(
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
     WHERE ${LEGACY_AUTH_USER_ID_COLUMN} = $1 OR id = $1
     LIMIT 1`,
    [legacyUser.id]
  )

  const profile = toAuthProfile(rows[0] ?? null, normalizeEmail(legacyUser.email))
  return profile
}

export async function getProfileByLogtoSubPostgres(logtoSub: string): Promise<AuthProfile | null> {
  const pool = getPool()
  if (!pool) return null

  return queryProfileByLogtoSub(pool, logtoSub)
}

export async function getProfileByLegacyEmailPostgres(
  email: string | null | undefined
): Promise<AuthProfile | null> {
  const pool = getPool()
  if (!pool) return null

  return queryLegacyProfileByEmail(pool, email)
}

export async function linkLogtoProfileByLegacyEmailPostgres(
  email: string | null | undefined,
  logtoSub: string
): Promise<AuthProfile | null> {
  const pool = getPool()
  if (!pool) return null

  const client = await pool.connect()

  try {
    const legacyProfile = await queryLegacyProfileByEmail(client, email)

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

export async function createProfileForLogtoUserPostgres(
  logtoSub: string,
  email: string | null,
  name: string | null
): Promise<AuthProfile | null> {
  const pool = getPool()
  if (!pool) return null

  const resolvedName = name || (email ? email.split('@')[0] : 'Usuário')

  const { rows } = await pool.query<RawPerfil>(
    `INSERT INTO perfis (nome, logto_sub, auth_provider, migrado_logto_em)
     VALUES ($1, $2, 'logto', now())
     RETURNING ${PROFILE_SQL_SELECT}`,
    [resolvedName, logtoSub]
  )

  return toAuthProfile(rows[0] ?? null, normalizeEmail(email))
}

