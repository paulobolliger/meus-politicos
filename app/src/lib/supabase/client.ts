import { createBrowserClient } from '@supabase/ssr'
import { type Database } from './types'

// Compartilha cookies entre subdomínios (localhost ↔ painel.localhost ↔ app.localhost)
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? '.meuspoliticos.com.br' : 'localhost'

function buildCookieString(name: string, value: string, options: Record<string, unknown>): string {
  let str = `${name}=${value}`
  str += `; Domain=${COOKIE_DOMAIN}`
  str += `; Path=${(options.path as string) ?? '/'}`
  if (options.maxAge) str += `; Max-Age=${options.maxAge}`
  if (options.sameSite) str += `; SameSite=${options.sameSite}`
  if (options.secure) str += '; Secure'
  if (options.httpOnly) str += '; HttpOnly'
  return str
}

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          if (typeof document === 'undefined') return []
          return document.cookie
            .split(';')
            .map((c) => c.trim())
            .filter(Boolean)
            .map((c) => {
              const eq = c.indexOf('=')
              return eq > 0
                ? { name: c.slice(0, eq).trim(), value: c.slice(eq + 1).trim() }
                : { name: c.trim(), value: '' }
            })
        },
        setAll(cookiesToSet) {
          if (typeof document === 'undefined') return
          cookiesToSet.forEach(({ name, value, options }) => {
            document.cookie = buildCookieString(name, value, (options ?? {}) as Record<string, unknown>)
          })
        },
      },
    }
  )
}
