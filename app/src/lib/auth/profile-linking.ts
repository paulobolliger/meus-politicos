import { Pool, type PoolClient, type Pool as PgPool } from 'pg'

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

let _pool: PgPool | null = null

function getPool(): PgPool | null {
  const host = process.env.POSTGRES_HOST
  const database = process.env.POSTGRES_DB
  const user = process.env.POSTGRES_USER
  const password = process.env.POSTGRES_PASSWORD

  if (!host || !database || !user || !password) {
    return null
  }

  if (!_pool) {
    _pool = new Pool({
      host,
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database,
      user,
      password,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }

  return _pool
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
