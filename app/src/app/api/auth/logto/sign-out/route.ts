import { signOut } from '@logto/next/server-actions'
import { NextRequest } from 'next/server'

import { getLogtoConfig } from '@/lib/logto/config'

export async function GET(request: NextRequest) {
  const postSignOutRedirectUri = new URL('/', request.url)

  await signOut(getLogtoConfig(), postSignOutRedirectUri.toString())
}
