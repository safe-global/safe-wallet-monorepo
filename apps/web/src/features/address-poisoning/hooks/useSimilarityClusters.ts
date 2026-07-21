import { useMemo } from 'react'
import {
  detectIntraListClusters,
  normalizeAddress,
  type ListClusterResult,
} from '@safe-global/utils/utils/addressSimilarity'
import useAnchorListMatches from './useAnchorListMatches'

export interface SimilarityClusters extends ListClusterResult {
  /** True if `address` looks alike another list member (case-insensitive). */
  isAddressFlagged: (address: string) => boolean
}

/**
 * Look-alike clustering for a rendered list: the always-on intra-list check merged with the
 * flag-gated anchor check ({@link useAnchorListMatches}). Pass a referentially-stable `addresses`.
 *
 * An anchor-only match with no in-list look-alike is flagged but carries no cluster id (per-row,
 * not grouped).
 */
const useSimilarityClusters = (addresses: string[]): SimilarityClusters => {
  const anchorAnnotations = useAnchorListMatches(addresses)

  return useMemo(() => {
    const { flagged, groupIdByAddress } = detectIntraListClusters(addresses)

    if (anchorAnnotations.size > 0) {
      const inListByNorm = new Map<string, string>()
      for (const address of addresses) inListByNorm.set(normalizeAddress(address), address.toLowerCase())

      anchorAnnotations.forEach((annotation) => {
        if (!annotation.match) return
        const impostor = annotation.address.toLowerCase()
        flagged.add(impostor)

        // Imitated original also in this list: group the pair explicitly so they read side by side
        // even when the intra-list bucket length and the anchor threshold differ.
        const anchorInList = inListByNorm.get(annotation.match.anchor)
        if (anchorInList) {
          flagged.add(anchorInList)
          const groupId = groupIdByAddress.get(impostor) ?? groupIdByAddress.get(anchorInList) ?? impostor
          groupIdByAddress.set(impostor, groupId)
          groupIdByAddress.set(anchorInList, groupId)
        }
      })
    }

    const isAddressFlagged = (address: string) => flagged.has(address.toLowerCase())
    return { flagged, groupIdByAddress, isAddressFlagged }
  }, [addresses, anchorAnnotations])
}

export default useSimilarityClusters
