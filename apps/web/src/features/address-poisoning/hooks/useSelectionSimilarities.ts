import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import {
  detectListSimilarities,
  detectSimilarAddresses,
  normalizeAddress,
} from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import { selectAnchorIndex } from '../store'

export type SelectionSimilarity = { match?: SimilarityMatch; intraList?: boolean }

/**
 * Synthetic match for intra-list collisions: the intra-list engine buckets on front AND back,
 * so a flag is always a both-ends (CRITICAL) hit. No anchor exists (nothing is trusted yet).
 */
export const INTRA_LIST_MATCH: SimilarityMatch = { anchor: '', prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL }

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
 * Gated by the ADDRESS_POISONING_PROTECTION chain flag (consistent with Mode A) — returns an
 * empty map when the flag is off. Pass a referentially-stable `addresses` array.
 *
 * `flagAnchors`: by default an address that is itself a trusted anchor is never intra-list flagged
 * (selection surfaces don't want to warn about a Safe you already trust). Display surfaces that show
 * trusted + untrusted together (e.g. the All Accounts list) set this true so a trusted Safe that
 * looks like another listed Safe is flagged too.
 */
const useSelectionSimilarities = (
  addresses: string[],
  { flagAnchors = false }: { flagAnchors?: boolean } = {},
): Map<string, SelectionSimilarity> => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    const result = new Map<string, SelectionSimilarity>()
    if (!isEnabled || addresses.length === 0) return result

    const anchorAnnotations = detectListSimilarities(addresses, anchorIndex)
    const intraList = detectSimilarAddresses(addresses)

    // Trusted anchors that a listed safe imitates — the "originals" being impersonated. A pure anchor
    // hit must flag only the impostor, never the trusted original, so these are never intra-flagged.
    const imitatedAnchors = new Set<string>()
    anchorAnnotations.forEach((annotation) => {
      if (annotation.match) imitatedAnchors.add(annotation.match.anchor)
    })

    for (const address of addresses) {
      const match = anchorAnnotations.get(address)?.match
      if (match) {
        result.set(address, { match }) // resembles a trusted anchor — the impostor
      } else if (
        intraList.isFlagged(address) &&
        !imitatedAnchors.has(normalizeAddress(address)) &&
        (flagAnchors || !anchorIndex.isAnchor(address))
      ) {
        result.set(address, { match: INTRA_LIST_MATCH, intraList: true }) // genuine intra-list collision
      } else {
        result.set(address, {})
      }
    }
    return result
  }, [isEnabled, addresses, anchorIndex, flagAnchors])
}

export default useSelectionSimilarities
