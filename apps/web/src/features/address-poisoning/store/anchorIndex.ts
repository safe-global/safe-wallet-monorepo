import { createSelector } from '@reduxjs/toolkit'
import { buildSimilarityIndex } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityIndex } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { selectAllAddedSafes } from '@/store/addedSafesSlice'
import { selectAllCuratedNestedSafes } from '@/store/settingsSlice'
import { selectUndeployedSafes } from '@/features/counterfactual/store'

/**
 * Every address the user has EXPLICITLY trusted, gathered only from local sources
 * that an attacker cannot inject via fetched/chain data:
 *  - local address book contacts
 *  - added / pinned safes
 *  - curated nested safes
 *  - undeployed (counterfactual) safes the user authored
 *
 * Flattened across chains, lowercased, deduped. Deliberately excludes CGW
 * owner-owned safes and viewed-Safe owners — those are poisonable candidates,
 * never anchors, so the similarity baseline itself cannot be poisoned.
 */
export const selectAnchorAddresses = createSelector(
  [selectAllAddressBooks, selectAllAddedSafes, selectAllCuratedNestedSafes, selectUndeployedSafes],
  (addressBooks, addedSafes, curatedNested, undeployedSafes): string[] => {
    const addresses: string[] = []
    for (const perChain of Object.values(addressBooks)) addresses.push(...Object.keys(perChain))
    for (const perChain of Object.values(addedSafes)) addresses.push(...Object.keys(perChain))
    addresses.push(...curatedNested)
    for (const perChain of Object.values(undeployedSafes)) addresses.push(...Object.keys(perChain))
    return Array.from(new Set(addresses.map((address) => address.toLowerCase())))
  },
)

/**
 * Memoized similarity index over the user's trusted anchors. Rebuilt only when
 * the anchor set changes (reselect). The index (Maps + closures) lives ONLY in
 * this selector's output — never in store state or a dispatched action — so it
 * is never poisoned by fetched data and never trips `serializableCheck`.
 */
export const selectAnchorIndex = createSelector(
  [selectAnchorAddresses],
  (anchors): SimilarityIndex => buildSimilarityIndex(anchors),
)
