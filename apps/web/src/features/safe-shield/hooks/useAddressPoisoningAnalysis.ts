import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { selectAnchorIndex } from '@/features/address-poisoning'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { getAddressPoisoningResult } from '@safe-global/utils/features/safe-shield/utils'
import { StatusGroup, type RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

/**
 * Overlays the client-side address-poisoning check onto recipient analysis results.
 *
 * Every analyzed recipient is compared against the user's trusted anchors; any resemblance
 * (front or back) gains a single CRITICAL ADDRESS_POISONING status group ("Potential address
 * poisoning") rendered by the Copilot recipient card.
 *
 * `extraAddresses` covers tx-flows without recipient analysis (add owner, recovery,
 * spending limit, …): a matched extra address gets a poisoning-only entry so the card
 * shows just this check. Gated by the ADDRESS_POISONING_PROTECTION chain flag; a
 * pass-through when nothing matches.
 */
export const useRecipientAnalysisWithPoisoning = (
  recipient: AsyncResult<RecipientAnalysisResults>,
  extraAddresses?: string[],
): AsyncResult<RecipientAnalysisResults> => {
  const [data, error, loading] = recipient
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)
  const allAddressBooks = useAppSelector(selectAllAddressBooks)

  // Normalized anchor address → contact name, built once per address-book change so resolving a
  // name is O(1) per match instead of an O(chains × entries) scan for every look-alike.
  const anchorNameByAddress = useMemo(() => {
    const map = new Map<string, string>()
    for (const chainAddressBook of Object.values(allAddressBooks)) {
      for (const [address, name] of Object.entries(chainAddressBook ?? {})) {
        const normalized = normalizeAddress(address)
        if (name && !map.has(normalized)) map.set(normalized, name)
      }
    }
    return map
  }, [allAddressBooks])

  const overlaid = useMemo(() => {
    if (!isEnabled) {
      return data
    }

    let changed = false
    const next: RecipientAnalysisResults = {}

    const poisoningGroup = (address: string, match: SimilarityMatch) => {
      const anchorName = anchorNameByAddress.get(normalizeAddress(match.anchor))
      return [getAddressPoisoningResult({ address, anchor: match.anchor, anchorName })]
    }

    for (const [address, groups] of Object.entries(data ?? {})) {
      const match = anchorIndex.query(address)

      if (!match) {
        next[address] = groups
        continue
      }

      // Insert the poisoning group FIRST: the card colors/titles only the top visible result, and
      // the stable severity sort breaks ties by insertion order — so the CRITICAL poisoning group
      // leads and also wins any same-severity tie.
      next[address] = { [StatusGroup.ADDRESS_POISONING]: poisoningGroup(address, match), ...groups }
      changed = true
    }

    // Poisoning-only entries for registered addresses outside the recipient analysis.
    // Skip partial input (registration follows the field as the user types).
    for (const address of extraAddresses ?? []) {
      if (!isAddress(address)) continue

      // data-path keys are lowercased (useRecipientAnalysis), so dedupe case-insensitively — a
      // checksummed key would never match a lowercase one and could double-add the same address.
      const lowerKey = address.toLowerCase()
      if (Object.keys(next).some((k) => k.toLowerCase() === lowerKey)) continue

      const match = anchorIndex.query(address)
      if (!match) continue

      next[checksumAddress(address)] = { [StatusGroup.ADDRESS_POISONING]: poisoningGroup(address, match) }
      changed = true
    }

    return changed ? next : data
  }, [isEnabled, data, extraAddresses, anchorIndex, anchorNameByAddress])

  return [overlaid, error, loading]
}
