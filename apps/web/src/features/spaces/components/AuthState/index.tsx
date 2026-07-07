import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import SignedOutState from '../SignedOutState'
import { isUnauthorized } from '@/features/spaces/utils'
import UnauthorizedState from '../UnauthorizedState'
import LoadingState from '../LoadingState'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending, setLastUsedSpace } from '@/store/authSlice'
import { setLastUsedSpaceOrigin } from '@/features/spaces/store'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { SPACE_REFRESH_OPTIONS } from '../../hooks/refreshOptions'
import { MemberStatus } from '@/features/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'

const AuthState = ({ spaceId, children }: { spaceId: string; children: ReactNode }) => {
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData, error, isLoading, isFetching } = useSpacesGetOneV1Query(
    { id: spaceId },
    { skip: !isUserSignedIn || !spaceId, ...SPACE_REFRESH_OPTIONS },
  )
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)

  const currentMembership = currentData?.members.find((member) => member.user.id === currentUser?.id)
  const hasMembershipLoaded = !!currentData && !!currentUser
  const isCurrentUserActive = currentMembership?.status === MemberStatus.ACTIVE

  const isLoadingState = isLoading || isOidcLoginPending
  const hasLostAccess = isUserSignedIn && !isLoadingState && isUnauthorized(error)
  const isInactiveMember = isUserSignedIn && !isLoadingState && hasMembershipLoaded && !isCurrentUserActive

  useEffect(() => {
    dispatch(setLastUsedSpace(spaceId))
    dispatch(setLastUsedSpaceOrigin({ path: router.pathname, spaceId }))
  }, [dispatch, spaceId, router.pathname])

  // !isFetching: accepting an invite refetches the space — don't redirect on the stale INVITED entry
  useEffect(() => {
    if (hasLostAccess || (isInactiveMember && !isFetching)) {
      router.replace(AppRoutes.welcome.spaces)
    }
  }, [hasLostAccess, isInactiveMember, isFetching, router])

  if (!isSpacesFeatureEnabled) return null

  if (isLoadingState) return <LoadingState />

  if (!isUserSignedIn) return <SignedOutState />

  if (hasLostAccess) return <UnauthorizedState />

  if (isInactiveMember) return <LoadingState />

  return children
}

export default AuthState
