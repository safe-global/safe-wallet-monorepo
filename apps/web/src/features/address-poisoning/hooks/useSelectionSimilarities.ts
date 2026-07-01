import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { detectListSimilarities, detectSimilarAddresses } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAnchorIndex } from '../store'
import { INTRA_LIST_MATCH } from '../components/SimilarityFlag'

export type SelectionSimilarity = { match?: SimilarityMatch; intraList?: boolean }

/**
 * Similarity for "decide what to trust" surfaces (space onboarding, add-accounts, the trusted-safe
 * modal, nested-safe curation). At selection time nothing may be trusted yet, so it combines two
 * detections:
 *  - ANCHOR (front OR back, two-tier): the row resembles a safe you already trust → flag it and
 *    name the trusted address. Precedence over intra-list; only the impostor is flagged.
 *  - INTRA-LIST (both-ends only, low-noise): two candidates in this list strongly resemble each
 *    other even when neither is trusted. Skipped for anchors (never flag a trusted safe here).
 *
 * Display-only surfaces should use `useListSimilarities` (anchor only) instead.
 * Pass a referentially-stable `addresses` array.
 */
const useSelectionSimilarities = (addresses: string[]): Map<string, SelectionSimilarity> => {
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    const result = new Map<string, SelectionSimilarity>()
    if (addresses.length === 0) return result

    const anchorAnnotations = detectListSimilarities(addresses, anchorIndex)
    const intraList = detectSimilarAddresses(addresses)

    for (const address of addresses) {
      const match = anchorAnnotations.get(address)?.match
      if (match) {
        result.set(address, { match }) // resembles a trusted anchor — anchor wins
      } else if (!anchorIndex.isAnchor(address) && intraList.isFlagged(address)) {
        result.set(address, { match: INTRA_LIST_MATCH, intraList: true }) // two untrusted candidates collide
      } else {
        result.set(address, {})
      }
    }
    return result
  }, [addresses, anchorIndex])
}

export default useSelectionSimilarities
