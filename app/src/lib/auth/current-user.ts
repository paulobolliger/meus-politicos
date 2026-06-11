/**
 * Helper de usuário autenticado para o runtime Logto.
 */

import { getAuthenticatedLogtoSession } from '@/lib/logto/session'
import { buildCurrentUserFromLogto } from '@/lib/logto/user'
import {
  AdminRequiredError,
  AuthRequiredError,
  type CurrentUser,
} from './types'
import {
  getProfileByLegacyEmailPostgres,
  getProfileByLogtoSubPostgres,
  linkLogtoProfileByLegacyEmailPostgres,
  createProfileForLogtoUserPostgres,
} from './profile-linking'

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getCurrentLogtoUser()
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()

  if (!user) {
    throw new AuthRequiredError()
  }

  return user
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireUser()

  if (user.role !== 'admin') {
    throw new AdminRequiredError()
  }

  return user
}

async function getCurrentLogtoUser(): Promise<CurrentUser | null> {
  const session = await getAuthenticatedLogtoSession()

  if (!session) {
    return null
  }

  const logtoUser = buildCurrentUserFromLogto(session)

  if (!logtoUser?.logtoSub) {
    return null
  }

  let profile = await getProfileByLogtoSubPostgres(logtoUser.logtoSub)

  if (!profile) {
    const legacyProfile = await getProfileByLegacyEmailPostgres(logtoUser.email)

    if (legacyProfile) {
      profile = await linkLogtoProfileByLegacyEmailPostgres(
        logtoUser.email,
        logtoUser.logtoSub
      )
    } else {
      profile = await createProfileForLogtoUserPostgres(
        logtoUser.logtoSub,
        logtoUser.email,
        logtoUser.name
      )
    }
  }

  if (!profile) {
    return null
  }

  return {
    ...logtoUser,
    perfilId: profile.id,
    email: logtoUser.email ?? profile.email,
    name: profile.nome ?? logtoUser.name,
    role: profile.role,
    logtoSub: profile.logtoSub ?? logtoUser.logtoSub,
    legacyAuthUserId: profile.legacyAuthUserId,
    profile,
  }
}
