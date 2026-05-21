import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'

const PAINEL_URL = process.env.NEXT_PUBLIC_PAINEL_URL ?? 'https://painel.meuspoliticos.com.br'

export async function proxy(request: NextRequest) {
  const { supabaseResponse, user } = await updateSession(request)

  const host = request.headers.get('host')?.toLowerCase() ?? ''
  const { pathname } = request.nextUrl

  const isPainelHost =
    host.startsWith('painel.localhost') ||
    host.startsWith('painel.meuspoliticos.com.br')

  const isAppHost =
    host.startsWith('app.localhost') ||
    host.startsWith('app.meuspoliticos.com.br')

  // ── painel.* ──────────────────────────────────────────────────────────────
  // Área exclusivamente autenticada. Qualquer rota não-auth exige login.

  if (isPainelHost) {
    const isAuthRoute =
      pathname.startsWith('/login') ||
      pathname.startsWith('/cadastro') ||
      pathname.startsWith('/recuperar-senha') ||
      pathname.startsWith('/auth/')

    if (!user && !isAuthRoute) {
      // API routes devem retornar 401 (não redirecionar para HTML do login)
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
      const loginUrl = request.nextUrl.clone()
      loginUrl.pathname = '/login'
      if (pathname !== '/') loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // Raiz do painel → /painel
    if (pathname === '/') {
      const destination = request.nextUrl.clone()
      destination.pathname = '/painel'
      return NextResponse.redirect(destination)
    }

    return supabaseResponse
  }

  // ── app.* ─────────────────────────────────────────────────────────────────
  // App analítico público. Login redireciona para painel.*

  if (isAppHost) {
    if (pathname === '/login') {
      const base = host.startsWith('app.localhost')
        ? `http://painel.localhost:3000`
        : PAINEL_URL
      // Preserva ?redirectTo e outros params ao redirecionar para o painel
      const dest = new URL('/login', base)
      request.nextUrl.searchParams.forEach((v, k) => dest.searchParams.set(k, v))
      return NextResponse.redirect(dest.toString())
    }

    if (pathname === '/') {
      const destination = request.nextUrl.clone()
      destination.pathname = '/home'
      return NextResponse.redirect(destination)
    }

    if (pathname === '/busca') {
      const rewritten = request.nextUrl.clone()
      rewritten.pathname = '/app-busca'
      return NextResponse.rewrite(rewritten)
    }

    return supabaseResponse
  }

  // ── meuspoliticos.com.br (site público) ───────────────────────────────────

  if (pathname === '/login') {
    // Em dev: serve /login localmente (sem subdomínio, cookie compartilhado)
    // Em produção: redireciona para painel.meuspoliticos.com.br
    const isLocalhost = host.startsWith('localhost') || host.startsWith('127.0.0.1')
    if (!isLocalhost) {
      return NextResponse.redirect(`${PAINEL_URL}/login`)
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
