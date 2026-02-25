import { useMemo } from 'react'
import useChainId from '@/hooks/useChainId'
import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'

/**
 * Fetches a Safe's threshold and owners for a given Safe address.
 * Used to determine if a parent Safe requires multi-sig for delegation operations.
 * Returns undefined if no safeAddress is provided or data is loading.
 */
export const useParentSafeThreshold = (safeAddress: string | undefined) => {
  const chainId = useChainId()

  const { data: parentSafe, isLoading } = useSafesGetSafeV1Query(
    {
      chainId,
      safeAddress: safeAddress || '',
    },
    {
      skip: !safeAddress,
    },
  )

  return useMemo(() => {
    if (!safeAddress || !parentSafe) {
      return { threshold: undefined, owners: undefined, parentSafeAddress: undefined, isLoading }
    }

    return {
      threshold: parentSafe.threshold,
      owners: parentSafe.owners,
      parentSafeAddress: safeAddress,
      isLoading,
    }
  }, [parentSafe, safeAddress, isLoading])
}
