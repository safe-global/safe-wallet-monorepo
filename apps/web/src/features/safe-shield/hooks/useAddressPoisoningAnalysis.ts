import { useMemo } from 'react'
import { isAddress } from 'ethers'
import { useAppSelector } from '@/store'
import { selectAllAddressBooks, type AddressBookState } from '@/store/addressBookSlice'
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
 * Resolves a display name for a trusted anchor from the local address book (any chain).
 */
const resolveAnchorName = (allAddressBooks: AddressBookState, anchor: string): string | undefined => {
  // The similarity index returns anchors in normalized form (lowercase, no 0x prefix).
  const target = normalizeAddress(anchor)

  for (const chainAddressBook of Object.values(allAddressBooks)) {
    for (const [address, name] of Object.entries(chainAddressBook ?? {})) {
      if (name && normalizeAddress(address) === target) {
        return name
      }
    }
  }
}

/**
 * Overlays the client-side address-poisoning check onto recipient analysis results.
 *
 * Every analyzed recipient is compared against the user's trusted anchors; a look-alike
 * gains an ADDRESS_POISONING status group ("Resembles a trusted address" — CRITICAL, or
 * "Partly matches a trusted address" — WARN) rendered by the regular Copilot recipient card.
 *
 * `extraAddresses` covers tx-flows without recipient analysis (add owner, recovery,
 * spending limit, …): a matched extra address gets a poisoning-only entry so the card
 * shows just this check. Gated by the ADDRESS_POISONING_PROTECTION chain flag; a
 * pass-through when nothing matches.
 */
export const useAddressPoisoningOverlay = (
  recipient: AsyncResult<RecipientAnalysisResults>,
  extraAddresses?: string[],
): AsyncResult<RecipientAnalysisResults> => {
  const [data, error, loading] = recipient
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)
  const allAddressBooks = useAppSelector(selectAllAddressBooks)

  const overlaid = useMemo(() => {
    if (!isEnabled) {
      return data
    }

    let changed = false
    const next: RecipientAnalysisResults = {}

    const poisoningGroup = (address: string, match: SimilarityMatch) => {
      const anchorName = resolveAnchorName(allAddressBooks, match.anchor)
      return [getAddressPoisoningResult({ address, match, anchorName })]
    }

    for (const [address, groups] of Object.entries(data ?? {})) {
      const match = anchorIndex.query(address)

      if (!match) {
        next[address] = groups
        continue
      }

      // Insert the poisoning group FIRST: the card colors/titles only the top visible result,
      // and its stable severity sort breaks ties by insertion order. A look-alike warning must
      // win a WARN tie against generic states like LOW_ACTIVITY.
      next[address] = { [StatusGroup.ADDRESS_POISONING]: poisoningGroup(address, match), ...groups }
      changed = true
    }

    // Poisoning-only entries for registered addresses outside the recipient analysis.
    // Skip partial input (registration follows the field as the user types).
    for (const address of extraAddresses ?? []) {
      if (!isAddress(address)) continue

      const key = checksumAddress(address)
      if (key in next) continue

      const match = anchorIndex.query(address)
      if (!match) continue

      next[key] = { [StatusGroup.ADDRESS_POISONING]: poisoningGroup(address, match) }
      changed = true
    }

    return changed ? next : data
  }, [isEnabled, data, extraAddresses, anchorIndex, allAddressBooks])

  return [overlaid, error, loading]
}
