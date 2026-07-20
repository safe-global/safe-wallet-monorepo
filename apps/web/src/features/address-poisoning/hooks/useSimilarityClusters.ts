import { useMemo } from 'react'
import {
  detectListClusters,
  normalizeAddress,
  type ListClusterResult,
} from '@safe-global/utils/utils/addressSimilarity'
import useAnchorListMatches from './useAnchorListMatches'

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
  const anchorAnnotations = useAnchorListMatches(addresses)

  return useMemo(() => {
    const { flagged, groupIdByAddress } = detectListClusters(addresses)

    // Common case (flag off / no look-alike of a trusted anchor): intra-list result is the answer.
    if (anchorAnnotations.size === 0) return { flagged, groupIdByAddress }

    // normalized (no-0x) → lowercased 0x original, for locating an imitated anchor within the list.
    const inListByNorm = new Map<string, string>()
    for (const address of addresses) inListByNorm.set(normalizeAddress(address), address.toLowerCase())

    anchorAnnotations.forEach((annotation) => {
      if (!annotation.match) return
      const impostor = annotation.address.toLowerCase()
      flagged.add(impostor)

      // When the imitated trusted original is ALSO in this list, flag it and group it WITH the impostor
      // explicitly — so the pair reads side by side regardless of whether the intra-list bucket length
      // (SimilarityConfig) matches the anchor threshold (AnchorSimilarityConfig); both default to 4.
      const anchorInList = inListByNorm.get(annotation.match.anchor)
      if (anchorInList) {
        flagged.add(anchorInList)
        const groupId = groupIdByAddress.get(impostor) ?? groupIdByAddress.get(anchorInList) ?? impostor
        groupIdByAddress.set(impostor, groupId)
        groupIdByAddress.set(anchorInList, groupId)
      }
    })

    return { flagged, groupIdByAddress }
  }, [addresses, anchorAnnotations])
}

export default useSimilarityClusters
