import { Pool } from 'pg'

let _pool: Pool | null = null

export function getPgPool(): Pool {
  if (!_pool) {
    const host = process.env.POSTGRES_HOST
    const database = process.env.POSTGRES_DB
    const user = process.env.POSTGRES_USER
    const password = process.env.POSTGRES_PASSWORD

    if (!host || !database || !user) {
      console.warn('[DB Pool] Variáveis de banco incompletas. Usando fallbacks locais.')
    }

    _pool = new Pool({
      host: host ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: database ?? 'meuspoliticos_db',
      user: user ?? 'postgres',
      password: password,
      max: 10,
      idleTimeoutMillis: 30_000,
    })
  }

  return _pool
}
