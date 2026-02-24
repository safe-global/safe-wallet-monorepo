import { useMemo } from 'react'
import { useNestedSafeOwners } from '@/hooks/useNestedSafeOwners'
import useChainId from '@/hooks/useChainId'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

/**
 * Fetches the parent Safe's threshold and owners for the current nested Safe.
 * Returns undefined if the current user is not a nested Safe owner or data is loading.
 */
export const useParentSafeThreshold = () => {
  const nestedSafeOwners = useNestedSafeOwners()
  const chainId = useChainId()

  const parentSafeAddress = nestedSafeOwners?.[0]

  const { data: parentSafe, isLoading } = useSafesGetSafeV1Query(
    {
      chainId,
      safeAddress: parentSafeAddress || '',
    },
    {
      skip: !parentSafeAddress,
    },
  )

  return useMemo(() => {
    if (!parentSafeAddress || !parentSafe) {
      return { threshold: undefined, owners: undefined, parentSafeAddress: undefined, isLoading }
    }

    return {
      threshold: parentSafe.threshold,
      owners: parentSafe.owners,
      parentSafeAddress,
      isLoading,
    }
  }, [parentSafe, parentSafeAddress, isLoading])
}
