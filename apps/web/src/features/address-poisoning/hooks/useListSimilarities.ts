import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { detectListSimilarities } from '@safe-global/utils/utils/addressSimilarity'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAnchorIndex } from '../store'

/**
 * Mode B: annotate each address in a rendered list with the trusted anchor it resembles —
 * the "impostor sitting next to your real Safe" case. An address that IS an anchor is never
 * annotated (it is the trusted original).
 *
 * The anchor index is derived from local trust state (address book, added/pinned/curated/
 * undeployed safes), never fetched, so it can't be poisoned. Gated by the
 * ADDRESS_POISONING_PROTECTION chain flag (consistent with Mode A) — returns an empty map
 * when the flag is off, so every consuming surface goes dark together.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site) so detection is
 * not recomputed on every render.
 */
const useListSimilarities = (addresses: string[]): Map<string, ListAnnotation> => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    if (!isEnabled || addresses.length === 0) return new Map<string, ListAnnotation>()
    return detectListSimilarities(addresses, anchorIndex)
  }, [isEnabled, addresses, anchorIndex])
}

export default useListSimilarities
