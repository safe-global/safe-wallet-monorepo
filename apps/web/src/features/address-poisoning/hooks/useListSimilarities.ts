import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { detectListSimilarities } from '@safe-global/utils/utils/addressSimilarity'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAnchorIndex } from '../store'

/**
 * Mode B: annotate each address in a rendered list with the trusted anchor it resembles —
 * the "impostor sitting next to your real Safe" case. An address that IS an anchor is never
 * annotated (it is the trusted original).
 *
 * Detection is always-on: the anchor index is derived from local trust state (address book,
 * added/pinned/curated/undeployed safes), never fetched, so it can't be poisoned. Surfaces
 * that are new to this feature gate *rendering* of the flag behind the
 * ADDRESS_POISONING_PROTECTION chain flag; surfaces that already warned stay always-on.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site) so detection is
 * not recomputed on every render.
 */
const useListSimilarities = (addresses: string[]): Map<string, ListAnnotation> => {
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    if (addresses.length === 0) return new Map<string, ListAnnotation>()
    return detectListSimilarities(addresses, anchorIndex)
  }, [addresses, anchorIndex])
}

export default useListSimilarities
