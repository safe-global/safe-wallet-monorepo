import { useSafesGetSafeV1Query } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import useSafeInfo from './useSafeInfo'
import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

export function useParentSafe() {
  const isEnabled = useHasFeature(FEATURES.NESTED_SAFES)
  const { safe } = useSafeInfo()

  // Nested Safes are deployed by a single owner
  const maybeParent = safe.owners.length === 1 ? safe.owners[0].value : undefined

  const { data: parentSafe } = useSafesGetSafeV1Query(
    {
      chainId: safe.chainId || '',
      safeAddress: maybeParent || '',
    },
    {
      skip: !isEnabled || !maybeParent,
    },
  )

  if (parentSafe?.address.value === maybeParent) {
    return parentSafe
  }
}
