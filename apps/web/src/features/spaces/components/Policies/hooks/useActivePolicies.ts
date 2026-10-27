import { useMemo } from 'react'
import { usePoliciesGetActivePoliciesV1Query } from '@safe-global/store/gateway/policies'
import type { ActivePolicy } from '@safe-global/store/gateway/policies/types'
import { useCurrentSpaceId } from '@/features/spaces'
import { SPACE_REFRESH_OPTIONS } from '../../../hooks/refreshOptions'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'

/**
 * The policies currently configured on a Safe. Space-scoped and credentialed —
 * sources `spaceId` from the current space and skips until the user is signed in
 * and a space is selected.
 *
 * The endpoint reads the whole space and returns a bare array, so the result is narrowed
 * to the requested Safe here. The `safes` request filter already asks for one Safe, but
 * the response is filtered again rather than trusted: a widened filter would otherwise
 * leak another Safe's policies into this one's sections.
 *
 * Address-book names are resolved per row via `useAddressBookItem` in the
 * rendering components (it's a hook, one call per address), not merged here.
 */
export const useActivePolicies = (
  chainId: string,
  safeAddress: string,
): { policies: ActivePolicy[]; isLoading: boolean; isError: boolean; refetch: () => void } => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)

  const { currentData, isLoading, isError, refetch } = usePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', chainId, safeAddress },
    { skip: !isUserSignedIn || !spaceId || !chainId || !safeAddress, ...SPACE_REFRESH_OPTIONS },
  )

  const policies = useMemo(
    () =>
      (currentData ?? []).filter(
        (policy) => policy.safe.chainId === chainId && policy.safe.address.toLowerCase() === safeAddress.toLowerCase(),
      ),
    [currentData, chainId, safeAddress],
  )

  return { policies, isLoading, isError, refetch }
}
