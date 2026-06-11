import { NextResponse } from 'next/server'
import { getFeatureFlags, isFeatureActive } from '@/lib/flags'
import { getCurrentUser } from '@/lib/auth/current-user'

export async function GET() {
  const flags = await getFeatureFlags()
  let userId: string | undefined = undefined
  try {
    const user = await getCurrentUser()
    if (user && user.perfilId) {
      userId = user.perfilId
    }
  } catch (e) {
    // Ignore session errors
  }

  const activeFlags: Record<string, boolean> = {}
  for (const slug of Object.keys(flags)) {
    activeFlags[slug] = await isFeatureActive(slug, userId)
  }

  return NextResponse.json(activeFlags)
}
