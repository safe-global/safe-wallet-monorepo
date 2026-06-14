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
  const router = useRouter()
  const dispatch = useAppDispatch()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData, error, isLoading } = useSpacesGetOneV1Query(
    { id: spaceId },
    { skip: !isUserSignedIn || !spaceId },
  )
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  const isOidcLoginPending = useAppSelector(selectIsOidcLoginPending)

  const isCurrentUserDeclined = currentData?.members.some(
    (member) => member.user.id === currentUser?.id && member.status === MemberStatus.DECLINED,
  )

  const isLoadingState = isLoading || isOidcLoginPending
  const hasLostAccess = isUserSignedIn && !isLoadingState && (isUnauthorized(error) || isCurrentUserDeclined)

  useEffect(() => {
    dispatch(setLastUsedSpace(spaceId))
  }, [dispatch, spaceId])

  useEffect(() => {
    if (hasLostAccess) {
      router.replace(AppRoutes.welcome.spaces)
    }
  }, [hasLostAccess, router])

  if (!isSpacesFeatureEnabled) return null

  if (isLoadingState) return <LoadingState />

  if (!isUserSignedIn) return <SignedOutState />

  if (hasLostAccess) return <UnauthorizedState />

  return children
}

export default AuthState
