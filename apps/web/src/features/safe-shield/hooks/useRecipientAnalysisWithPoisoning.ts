import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { selectAnchorIndex } from '@/features/address-poisoning'
import { normalizeAddress } from '@safe-global/utils/utils/addressSimilarity'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'
import { checksumAddress, sameAddress } from '@safe-global/utils/utils/addresses'
import { getAddressPoisoningResult } from '@safe-global/utils/features/safe-shield/utils'
import { StatusGroup, type RecipientAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'

/**
 * Adds the client-side address-poisoning check to recipient analysis: each recipient (and each
 * `extraAddresses` entry, for flows without recipient analysis) that resembles a trusted anchor
 * gains a CRITICAL ADDRESS_POISONING group. Flag-gated; returns the input unchanged when nothing matches.
 */
export const useRecipientAnalysisWithPoisoning = (
  recipient: AsyncResult<RecipientAnalysisResults>,
  extraAddresses?: string[],
): AsyncResult<RecipientAnalysisResults> => {
  const [data, error, loading] = recipient
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)
  const allAddressBooks = useAppSelector(selectAllAddressBooks)

  // Normalized anchor → contact name, built once per address-book change (O(1) name lookup per match).
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

      // Insert poisoning FIRST so it leads and wins insertion-order severity ties (the card
      // titles/colors only the top visible result).
      next[address] = { [StatusGroup.ADDRESS_POISONING]: poisoningGroup(address, match), ...groups }
      changed = true
    }

    // Poisoning-only entries for non-recipient addresses (skip partial input as the user types).
    for (const address of extraAddresses ?? []) {
      if (!isAddress(address)) continue

      // Dedupe case-insensitively — data-path keys are lowercased, a checksummed key would double-add.
      if (Object.keys(next).some((k) => sameAddress(k, address))) continue

      const match = anchorIndex.query(address)
      if (!match) continue

      next[checksumAddress(address)] = { [StatusGroup.ADDRESS_POISONING]: poisoningGroup(address, match) }
      changed = true
    }

    return changed ? next : data
  }, [isEnabled, data, extraAddresses, anchorIndex, anchorNameByAddress])

  return [overlaid, error, loading]
}
