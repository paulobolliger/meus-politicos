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

  // OAuth ocorre no domínio principal; evita iniciar login no subdomínio app.
  if (isAppHost && pathname === '/login') {
    const destination = request.nextUrl.clone()
    destination.hostname = host.startsWith('app.localhost') ? 'localhost' : 'meuspoliticos.com.br'
    destination.protocol = host.startsWith('app.localhost') ? 'http:' : 'https:'
    destination.port = host.startsWith('app.localhost') ? '3000' : ''
    destination.pathname = '/login'
    return NextResponse.redirect(destination)
  }

  // No host app, a raiz redireciona para /painel (logado) ou /home (não logado).
  if (isAppHost && pathname === '/') {
    const destination = request.nextUrl.clone()
    destination.pathname = user ? '/painel' : '/home'
    return NextResponse.redirect(destination)
  }

  // No host app, serve rotas do grupo (app) via rewrite interno.
  if (isAppHost) {
    return supabaseResponse
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