import { usePoliciesGetPendingPoliciesV1Query } from '@safe-global/store/gateway/policies'
import type { PendingPolicy } from '@safe-global/store/gateway/policies/types'
import { useCurrentSpaceId } from '@/features/spaces'
import { SPACE_REFRESH_OPTIONS } from '../../hooks/refreshOptions'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

/**
 * Policy changes requested on a Safe but not yet applied — they sit out the
 * SafePolicyGuard's DELAY before `applyConfiguration` becomes valid. Space-scoped
 * and credentialed; skips until the user is signed in and a space is selected.
 */
export const usePendingPolicies = (
  chainId: string,
  safeAddress: string,
): { policies: PendingPolicy[]; isLoading: boolean; isError: boolean; refetch: () => void } => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const { currentData, isLoading, isError, refetch } = usePoliciesGetPendingPoliciesV1Query(
    { spaceId: spaceId ?? '', chainId, safeAddress },
    { skip: !isUserSignedIn || !spaceId || !chainId || !safeAddress, ...SPACE_REFRESH_OPTIONS },
  )

  return { policies: currentData?.items ?? [], isLoading, isError, refetch }
}
