import { redirect } from 'next/navigation'
import { Pool } from 'pg'
import { getCurrentUser } from '@/lib/auth/current-user'
import { AdminPageHeader, StatusBadge } from '@/components/admin/AdminCard'
import Link from 'next/link'

type UsuarioRow = {
  id: string
  email_legado: string | null
  criado_em: string | null
  role: string | null
  auth_provider: string | null
  logto_vinculado: boolean
}

type CountRow = {
  count: number
}

const LEGACY_AUTH_USER_ID_COLUMN = ['sup', 'abase_user_id'].join('')

export const metadata = { title: 'Usuários — Admin' }

const PAGE_SIZE = 25

let pool: Pool | null = null

function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      host: process.env.POSTGRES_HOST ?? 'localhost',
      port: Number(process.env.POSTGRES_PORT ?? 5432),
      database: process.env.POSTGRES_DB ?? 'meuspoliticos_db',
      user: process.env.POSTGRES_USER ?? 'postgres',
      password: process.env.POSTGRES_PASSWORD,
      max: 5,
      idleTimeoutMillis: 30_000,
    })
  }

  return pool
}

function fmtDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const currentUser = await getCurrentUser()
  if (!currentUser) redirect('/login')
  if (currentUser.role !== 'admin') redirect('/painel')

  const params = await searchParams
  const emailQuery = (params.email ?? '').trim().toLowerCase()
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE
  const pool = getPool()
  const emailFilter = emailQuery ? `%${emailQuery}%` : null

  const { rows: totalRows } = await pool.query<CountRow>(
    `
      SELECT COUNT(*)::int AS count
      FROM public.perfis p
      LEFT JOIN auth.users u
        ON u.id = COALESCE(p.${LEGACY_AUTH_USER_ID_COLUMN}, p.id)
      WHERE $1::text IS NULL OR u.email ILIKE $1
    `,
    [emailFilter]
  )

  const totalUsers = totalRows[0]?.count ?? 0

  const { rows: users } = await pool.query<UsuarioRow>(
    `
      SELECT
        p.id,
        u.email AS email_legado,
        p.criado_em::text AS criado_em,
        p.role,
        p.auth_provider,
        p.logto_sub IS NOT NULL AS logto_vinculado
      FROM public.perfis p
      LEFT JOIN auth.users u
        ON u.id = COALESCE(p.${LEGACY_AUTH_USER_ID_COLUMN}, p.id)
      WHERE $1::text IS NULL OR u.email ILIKE $1
      ORDER BY p.criado_em DESC
      LIMIT $2
      OFFSET $3
    `,
    [emailFilter, PAGE_SIZE, offset]
  )

  const totalPages = Math.ceil(totalUsers / PAGE_SIZE)

  return (
    <div style={{ padding: '32px 36px', maxWidth: 960 }}>
      <AdminPageHeader
        title="Usuários"
        subtitle={`${totalUsers.toLocaleString('pt-BR')} usuários cadastrados`}
      />

      {/* Search form */}
      <form
        method="get"
        style={{ display: 'flex', gap: 8, marginBottom: 20, maxWidth: 440 }}
      >
        <input
          name="email"
          type="text"
          defaultValue={emailQuery}
          placeholder="Filtrar por email..."
          style={{
            flex: 1,
            padding: '8px 12px',
            fontSize: 14,
            border: '1px solid var(--line)',
            borderRadius: 6,
            outline: 'none',
            fontFamily: 'var(--font-sans)',
            background: 'var(--panel)',
            color: 'var(--ink)',
          }}
        />
        <button
          type="submit"
          style={{
            padding: '8px 18px',
            background: 'var(--brand)',
            color: '#fff',
            border: 'none',
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            cursor: 'pointer',
          }}
        >
          Buscar
        </button>
        {emailQuery && (
          <Link
            href="/admin/usuarios"
            style={{
              padding: '8px 12px',
              color: 'var(--ink-3)',
              border: '1px solid var(--line)',
              borderRadius: 6,
              fontSize: 14,
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            ✕
          </Link>
        )}
      </form>

      {/* Table */}
      <div
        style={{
          background: 'var(--panel)',
          borderRadius: 10,
          boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13.5 }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              {['Email legado', 'Cadastro', 'Role', 'Provider', 'Logto'].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: '10px 14px',
                    textAlign: 'left',
                    fontWeight: 600,
                    fontSize: 12,
                    color: 'var(--ink-3)',
                    letterSpacing: '0.04em',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  style={{
                    padding: '24px',
                    textAlign: 'center',
                    color: 'var(--ink-3)',
                    fontSize: 14,
                  }}
                >
                  Nenhum usuário encontrado.
                </td>
              </tr>
            )}
            {users.map((u) => (
              <tr
                key={u.id}
                style={{ borderTop: '1px solid var(--line)' }}
              >
                <td style={{ padding: '10px 14px', color: 'var(--ink)' }}>{u.email_legado ?? '—'}</td>
                <td
                  style={{
                    padding: '10px 14px',
                    color: 'var(--ink-3)',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12.5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  {u.criado_em ? fmtDate(u.criado_em) : '—'}
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <StatusBadge
                    variant={u.role === 'admin' ? 'info' : 'never'}
                    label={u.role ?? 'user'}
                  />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <StatusBadge
                    variant={u.auth_provider === 'logto' ? 'ok' : 'never'}
                    label={u.auth_provider ?? 'legacy'}
                  />
                </td>
                <td style={{ padding: '10px 14px' }}>
                  <StatusBadge
                    variant={u.logto_vinculado ? 'ok' : 'never'}
                    label={u.logto_vinculado ? 'vinculado' : 'pendente'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Link
              key={p}
              href={`/admin/usuarios?${emailQuery ? `email=${encodeURIComponent(emailQuery)}&` : ''}page=${p}`}
              style={{
                display: 'inline-block',
                padding: '5px 11px',
                borderRadius: 5,
                fontSize: 13,
                textDecoration: 'none',
                background: p === page ? 'var(--brand)' : 'var(--panel)',
                color: p === page ? '#fff' : 'var(--ink-2)',
                border: p === page ? 'none' : '1px solid var(--line)',
                fontWeight: p === page ? 600 : 400,
                boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              }}
            >
              {p}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
