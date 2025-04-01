import { type ReactNode } from 'react'
import SignedOutState from '@/features/spaces/components/SignedOutState'
import { isUnauthorized } from '@/features/spaces/utils'
import UnauthorizedState from '@/features/spaces/components/UnauthorizedState'
import LoadingState from '@/features/spaces/components/LoadingState'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacesGetOneV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useUsersGetWithWalletsV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/users'
import { MemberStatus } from '@/features/spaces/hooks/useSpaceMembers'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useFeatureFlagRedirect from '@/features/spaces/hooks/useFeatureFlagRedirect'

const AuthState = ({ spaceId, children }: { spaceId: string; children: ReactNode }) => {
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { currentData: currentUser } = useUsersGetWithWalletsV1Query(undefined, { skip: !isUserSignedIn })
  const { currentData, error, isLoading } = useSpacesGetOneV1Query({ id: Number(spaceId) }, { skip: !isUserSignedIn })
  const isSpacesFeatureEnabled = useHasFeature(FEATURES.SPACES)
  useFeatureFlagRedirect()

  const isCurrentUserDeclined = currentData?.members.some(
    (member) => member.user.id === currentUser?.id && member.status === MemberStatus.DECLINED,
  )

  if (!isSpacesFeatureEnabled) return null

  if (isLoading) return <LoadingState />

  if (!isUserSignedIn) return <SignedOutState />

  if (isUnauthorized(error) || isCurrentUserDeclined) return <UnauthorizedState />

  return children
}

export default AuthState
