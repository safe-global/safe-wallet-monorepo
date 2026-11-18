import { useSpacesGetV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { useAppSelector } from '@/store'
import { isAuthenticated, selectIsStoreHydrated, selectLandingSpaceHint } from '@/store/authSlice'
import { filterSpacesByStatus } from '../utils'
import { MemberStatus } from './useSpaceMembers'

/**
 * Where `/spaces` without a spaceId goes: the last Workspace used, if the user is still an active
 * member, else the first active Workspace. Null when the user has no active Workspace.
 */
export const useLandingSpaceId = (): { spaceId: string | null; isLoading: boolean } => {
  const isSignedIn = useAppSelector(isAuthenticated)
  const isStoreHydrated = useAppSelector(selectIsStoreHydrated)
  const hint = useAppSelector(selectLandingSpaceHint)
  const { currentData: user, isLoading: isUserLoading } = useUsersGetWithWalletsV1Query(undefined, {
    skip: !isSignedIn,
  })
  const { currentData: spaces, isLoading: isSpacesLoading } = useSpacesGetV1Query(undefined, { skip: !isSignedIn })

  const activeSpaces = filterSpacesByStatus(user, spaces ?? [], MemberStatus.ACTIVE)
  const spaceId = activeSpaces.find((space) => space.uuid === hint)?.uuid ?? activeSpaces[0]?.uuid ?? null

  return { spaceId, isLoading: !isStoreHydrated || isUserLoading || isSpacesLoading }
}
