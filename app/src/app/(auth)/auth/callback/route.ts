import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

const PAINEL_URL = process.env.NEXT_PUBLIC_PAINEL_URL ?? 'https://painel.meuspoliticos.com.br'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const redirectTo = searchParams.get('redirectTo') || '/painel'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  const host = request.headers.get('host') ?? ''

  // Em desenvolvimento: cookie fica em localhost, permanece em localhost:3000
  // O proxy não força auth em rotas já autenticadas
  if (host === 'localhost:3000' || host === '127.0.0.1:3000' || host.startsWith('painel.localhost')) {
    return NextResponse.redirect(new URL(redirectTo, request.url))
  }

  // Produção: redireciona para painel.meuspoliticos.com.br
  return NextResponse.redirect(`${PAINEL_URL}${redirectTo}`)
}
