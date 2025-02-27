import { useGetSafeQuery } from '@/store/slices'
import { skipToken } from '@reduxjs/toolkit/query'
import useSafeInfo from './useSafeInfo'
import type { getSafe } from '@safe-global/safe-client-gateway-sdk'
import { useIsTargetedFeature } from '@/features/targetedFeatures/hooks/useIsTargetedFeature'
import { FEATURES } from '@/utils/chains'

export function useParentSafe(): getSafe | undefined {
  const isEnabled = useIsTargetedFeature(FEATURES.TARGETED_NESTED_SAFES)
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
