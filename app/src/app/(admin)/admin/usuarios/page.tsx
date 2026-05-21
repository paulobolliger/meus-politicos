import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { AdminPageHeader, StatusBadge } from '@/components/admin/AdminCard'
import Link from 'next/link'

type UsuarioRow = {
  id: string
  email: string | null
  criado_em: string | null
  role: string | null
}

export const metadata = { title: 'Usuários — Admin' }

const PAGE_SIZE = 25

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
  const supabase = await createClient()
  const adminClient = createAdminClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminClient as any

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')

  const params = await searchParams
  const emailQuery = (params.email ?? '').trim().toLowerCase()
  const page = Math.max(1, parseInt(params.page ?? '1', 10))

  // Buscar usuários via auth admin API (tem email)
  const { data: authData } = await adminClient.auth.admin.listUsers({
    page,
    perPage: PAGE_SIZE,
  })

  const authUsers = authData?.users ?? []
  const totalUsers = (authData && 'total' in authData ? authData.total : null) ?? authUsers.length

  // Filtrar por email se houver busca
  const filtered = emailQuery
    ? authUsers.filter((u) => u.email?.toLowerCase().includes(emailQuery))
    : authUsers

  // Buscar roles de perfis para esses usuários
  const ids = filtered.map((u) => u.id)
  const { data: perfisData } = ids.length > 0
    ? await db
        .from('perfis')
        .select('id, role')
        .in('id', ids) as { data: { id: string; role: string | null }[] | null }
    : { data: [] }

  const roleMap = new Map<string, string | null>()
  for (const p of perfisData ?? []) roleMap.set(p.id, p.role)

  const users: UsuarioRow[] = filtered.map((u) => ({
    id: u.id,
    email: u.email ?? null,
    criado_em: u.created_at ?? null,
    role: roleMap.get(u.id) ?? null,
  }))

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
              {['Email', 'Cadastro', 'Role'].map((h) => (
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
                  colSpan={3}
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
                <td style={{ padding: '10px 14px', color: 'var(--ink)' }}>{u.email ?? '—'}</td>
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
