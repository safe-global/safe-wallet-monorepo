import { useGetSafeQuery } from '@/store/slices'
import { skipToken } from '@reduxjs/toolkit/query'
import useSafeInfo from './useSafeInfo'
import type { getSafe } from '@safe-global/safe-client-gateway-sdk'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

export function useParentSafe(): getSafe | undefined {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { safe } = useSafeInfo()

  // Nested Safes are deployed by a single owner
  const maybeParent = safe.owners.length === 1 ? safe.owners[0].value : undefined

  const { data: parentSafe } = useGetSafeQuery(
    isEnabled && maybeParent
      ? {
          chainId: safe.chainId,
          safeAddress: maybeParent,
        }
      : skipToken,
  )

  if (parentSafe?.address.value === maybeParent) {
    return parentSafe
  }
}
