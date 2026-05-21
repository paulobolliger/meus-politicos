import { createServerClient } from '@supabase/ssr'
import { type NextRequest, NextResponse } from 'next/server'
import { type Database } from './types'

// Compartilha cookies entre subdomínios:
//   produção: *.meuspoliticos.com.br
//   dev:      localhost / painel.localhost / app.localhost
const COOKIE_DOMAIN =
  process.env.NODE_ENV === 'production' ? '.meuspoliticos.com.br' : 'localhost'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, { ...options, domain: COOKIE_DOMAIN })
          )
        },
      },
    }
  )

  // Não escreva código entre createServerClient e supabase.auth.getUser()
  // Um simples erro pode tornar difícil depurar problemas com usuários sendo deslogados aleatoriamente
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabaseResponse, user }
}
