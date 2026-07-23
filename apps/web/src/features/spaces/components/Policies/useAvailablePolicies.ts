import { usePoliciesGetPoliciesV1Query } from '@safe-global/store/gateway/policies'
import type { AvailablePolicy } from '@safe-global/store/gateway/policies/types'
import { useCurrentSpaceId } from '@/features/spaces'
import { SPACE_REFRESH_OPTIONS } from '../../hooks/refreshOptions'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

/**
 * The policy types a Safe can configure (the tile catalogue). Space-scoped and
 * credentialed — sources `spaceId` from the current space and skips until the
 * user is signed in and a space is selected.
 */
export const useAvailablePolicies = (
  chainId: string,
  safeAddress: string,
): { policies: AvailablePolicy[]; isLoading: boolean; isError: boolean; refetch: () => void } => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const { currentData, isLoading, isError, refetch } = usePoliciesGetPoliciesV1Query(
    { spaceId: spaceId ?? '', chainId, safeAddress },
    { skip: !isUserSignedIn || !spaceId || !chainId || !safeAddress, ...SPACE_REFRESH_OPTIONS },
  )

  return { policies: currentData?.items ?? [], isLoading, isError, refetch }
}
