import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

// Rotas que exigem autenticação
const PROTECTED_ROUTES = ['/meus-politicos', '/admin']

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const host = request.headers.get('host')?.toLowerCase() ?? ''
  const { pathname } = request.nextUrl

  const isAppHost =
    host.startsWith('app.localhost') ||
    host.startsWith('app.meuspoliticos.com.br') ||
    host.startsWith('app.meuspoliticos.com.br:')

  // Evita conflito de route groups na rota raiz: app host usa /home internamente.
  if (isAppHost && pathname === '/') {
    const rewritten = request.nextUrl.clone()
    rewritten.pathname = '/home'
    return NextResponse.rewrite(rewritten)
  }

  // /busca no app host usa rota interna /app-busca (sidebar, sem conflito com (site)/)
  if (isAppHost && pathname === '/busca') {
    const rewritten = request.nextUrl.clone()
    rewritten.pathname = '/app-busca'
    return NextResponse.rewrite(rewritten)
  }

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  )

  if (isProtected && !user) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Executa em todas as rotas exceto:
     * - _next/static (arquivos estáticos)
     * - _next/image (otimização de imagens)
     * - favicon.ico
     * - arquivos com extensão (ex: .png, .svg)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}