import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { detectListSimilarities } from '@safe-global/utils/utils/addressSimilarity'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAnchorIndex } from '../store'

/**
 * Mode B: annotate each address in a list with the trusted anchor it resembles
 * (the impostor "lookalike next to your real Safe" case). Gated by the
 * ADDRESS_POISONING_PROTECTION chain flag.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site) so the
 * detection is not recomputed on every render.
 */
const useListSimilarities = (addresses: string[]): Map<string, ListAnnotation> => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    if (!isEnabled || addresses.length === 0) {
      return new Map<string, ListAnnotation>()
    }
    return detectListSimilarities(addresses, anchorIndex)
  }, [isEnabled, addresses, anchorIndex])
}

export default useListSimilarities
