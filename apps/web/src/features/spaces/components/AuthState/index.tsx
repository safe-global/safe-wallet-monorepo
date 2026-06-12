import { type ReactNode, useEffect } from 'react'
import { useRouter } from 'next/router'
import SignedOutState from '../SignedOutState'
import { isUnauthorized } from '@/features/spaces/utils'
import UnauthorizedState from '../UnauthorizedState'
import LoadingState from '../LoadingState'
import { useAppDispatch, useAppSelector } from '@/store'
import { isAuthenticated, selectIsOidcLoginPending, setLastUsedSpace } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { MemberStatus } from '@/features/spaces'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { AppRoutes } from '@/config/routes'

const AuthState = ({ spaceId, children }: { spaceId: string; children: ReactNode }) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData, error, isLoading, isFetching } = useSpacesGetOneV1Query(
    { id: spaceId },
    { skip: !isUserSignedIn || !spaceId },
  )
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)

  const currentMembership = currentData?.members.find((member) => member.user.id === currentUser?.id)
  const hasMembershipLoaded = !!currentData && !!currentUser
  const isCurrentUserActive = currentMembership?.status === MemberStatus.ACTIVE

  useEffect(() => {
    dispatch(setLastUsedSpace(spaceId))
  }, [dispatch, spaceId])

  // !isFetching: accepting an invite refetches the space — don't redirect on the stale INVITED entry
  useEffect(() => {
    if (hasMembershipLoaded && !isCurrentUserActive && !isFetching) {
      router.replace({ pathname: AppRoutes.welcome.spaces })
    }
  }, [hasMembershipLoaded, isCurrentUserActive, isFetching, router])

  if (!isSpacesFeatureEnabled) return null

  if (isLoading || isOidcLoginPending) return <LoadingState />

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error)) return <UnauthorizedState />

  if (hasMembershipLoaded && !isCurrentUserActive) return <LoadingState />

  return children
}

export default AuthState
