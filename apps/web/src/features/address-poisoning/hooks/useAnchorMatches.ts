import { useMemo } from 'react'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import useListSimilarities from './useListSimilarities'

export type AnchorMatches = {
  /** Impostor address (lowercased) → the trusted anchor `SimilarityMatch` it resembles. */
  anchorMatches: Map<string, SimilarityMatch>
  /** In-list trusted originals being imitated (lowercased, `0x`-prefixed) — for side-by-side grouping. */
  imitatedInList: Set<string>
}

/**
 * Anchor-match fold for the grouping surfaces (trusted-safes modal, nested-safe curation), which
 * feed the split into a union-find rather than a flat set. Maps each in-list impostor to the anchor
 * it resembles, and collects the in-list originals being imitated so the grouping UI can box the
 * impostor next to its original.
 *
 * Flag-gated via `useListSimilarities` (empty when ADDRESS_POISONING_PROTECTION is off). The
 * intra-list layer is applied separately by each surface (kept always-on). Pass a
 * referentially-stable `addresses` array.
 */
const useAnchorMatches = (addresses: string[]): AnchorMatches => {
  const anchorAnnotations = useListSimilarities(addresses)

  return useMemo(() => {
    const anchorMatches = new Map<string, SimilarityMatch>()
    const imitated = new Set<string>()
    anchorAnnotations.forEach((annotation) => {
      if (annotation.match) {
        anchorMatches.set(annotation.address.toLowerCase(), annotation.match)
        imitated.add(annotation.match.anchor)
      }
    })
    const imitatedInList = new Set<string>()
    for (const address of addresses) {
      if (imitated.has(normalizeAddress(address))) imitatedInList.add(address.toLowerCase())
    }
    return { anchorMatches, imitatedInList }
  }, [anchorAnnotations, addresses])
}

export default useAnchorMatches
