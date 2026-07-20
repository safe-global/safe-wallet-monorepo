import { useMemo } from 'react'
import {
  detectListClusters,
  normalizeAddress,
  type ListClusterResult,
} from '@safe-global/utils/utils/addressSimilarity'
import useAnchorListMatches from './useAnchorListMatches'

/**
 * Look-alike clustering for a rendered list: the always-on intra-list check merged with the
 * flag-gated anchor check ({@link useAnchorListMatches}). Pass a referentially-stable `addresses`.
 *
 * An anchor-only match with no in-list look-alike is flagged but carries no cluster id (per-row,
 * not grouped).
 */
const useSimilarityClusters = (addresses: string[]): ListClusterResult => {
  const anchorAnnotations = useAnchorListMatches(addresses)

  return useMemo(() => {
    const { flagged, groupIdByAddress } = detectListClusters(addresses)

    if (anchorAnnotations.size === 0) return { flagged, groupIdByAddress }

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

    return { flagged, groupIdByAddress }
  }, [addresses, anchorAnnotations])
}

export default useSimilarityClusters
