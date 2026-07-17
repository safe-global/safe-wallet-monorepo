import { useMemo } from 'react'
import {
  detectListClusters,
  normalizeAddress,
  type ListClusterResult,
} from '@safe-global/utils/utils/addressSimilarity'
import useListSimilarities from './useListSimilarities'

/**
 * Look-alike clustering for a rendered list, combining:
 *  - INTRA-LIST: union-find over "shares front-4 OR back-4" (always on). Dedupes identical
 *    addresses, so the same Safe listed on several chains never matches itself.
 *  - ANCHOR: resembles a trusted anchor, front-4 OR back-4 (flag-gated by ADDRESS_POISONING_PROTECTION).
 *
 * Returns the flat flagged set (for per-row badges) plus a cluster id per grouped address (for the
 * "similar addresses" box). An anchor-only match with no in-list look-alike is flagged but carries
 * no cluster id — it surfaces per-row, not in a group.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site).
 */
const useSimilarityClusters = (addresses: string[]): ListClusterResult => {
  const anchorAnnotations = useListSimilarities(addresses)

  return useMemo(() => {
    const { flagged, groupIdByAddress } = detectListClusters(addresses)

    const imitated = new Set<string>()
    anchorAnnotations.forEach((annotation) => {
      if (annotation.match) {
        flagged.add(annotation.address.toLowerCase())
        imitated.add(annotation.match.anchor)
      }
    })
    // Also flag an in-list trusted original that an impostor imitates, so the pair reads side by side.
    for (const address of addresses) {
      if (imitated.has(normalizeAddress(address))) flagged.add(address.toLowerCase())
    }

    return { flagged, groupIdByAddress }
  }, [addresses, anchorAnnotations])
}

export default useSimilarityClusters
