import { useMemo } from 'react'
import { getFlaggedSimilarAddressSet, normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import useListSimilarities from './useListSimilarities'

/**
 * Flat set of addresses to flag as look-alikes, for the account/list display surfaces
 * (space onboarding, add-accounts, space safe-accounts, the "All accounts" modal).
 *
 * Combines the two detectors those surfaces need:
 *  - INTRA-LIST (`getFlaggedSimilarAddressSet`) — runs UNCONDITIONALLY, so the pre-existing
 *    look-alike check keeps working with the ADDRESS_POISONING_PROTECTION flag OFF.
 *  - ANCHOR (`useListSimilarities`) — flag-gated; when it fires, both the impostor AND the
 *    in-list trusted original it imitates are flagged so the pair reads side by side.
 *
 * Pass a referentially-stable `addresses` array (memoize at the call site).
 */
const useFlaggedSimilarAddresses = (addresses: string[]): Set<string> => {
  const anchorAnnotations = useListSimilarities(addresses)

  return useMemo(() => {
    const flagged = getFlaggedSimilarAddressSet(addresses)
    const imitated = new Set<string>()
    anchorAnnotations.forEach((annotation) => {
      if (annotation.match) {
        flagged.add(annotation.address.toLowerCase())
        imitated.add(annotation.match.anchor)
      }
    })
    for (const address of addresses) {
      if (imitated.has(normalizeAddress(address))) flagged.add(address.toLowerCase())
    }
    return flagged
  }, [addresses, anchorAnnotations])
}

export default useFlaggedSimilarAddresses
