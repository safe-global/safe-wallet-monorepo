import { useMemo } from 'react'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import { isActiveAllowlistPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import useChains from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { isAuthenticated } from '@/store/authSlice'
import { useSpacePoliciesGetActivePoliciesV1Query } from '@/store/api/gateway/spacePolicies'
import { useCurrentSpaceId } from '../../../../public/hooks/useCurrentSpaceId'
import { TABLE_POLICY_TYPES, toActiveRows } from '../../hooks/useSpacePolicies'

/** Whether the Safe's recipient allowlist checks its spending limits too, read from the policies the table shows. */
export const useIsCoveredByAllowlist = (chainId?: string, safeAddress?: string): boolean => {
  const spaceId = useCurrentSpaceId()
  const isUserSignedIn = useAppSelector(isAuthenticated)
  const { configs: chains } = useChains()
  const { currentData } = useSpacePoliciesGetActivePoliciesV1Query(
    { spaceId: spaceId ?? '', types: TABLE_POLICY_TYPES },
    { skip: !isUserSignedIn || !spaceId },
  )

  return useMemo(() => {
    if (!currentData || !chainId || !safeAddress) return false

    return toActiveRows(currentData, chains).some(
      (policy) =>
        isActiveAllowlistPolicy(policy) &&
        policy.spendingLimitsCovered &&
        policy.safe.chainId === chainId &&
        sameAddress(policy.safe.address, safeAddress),
    )
  }, [currentData, chains, chainId, safeAddress])
}
