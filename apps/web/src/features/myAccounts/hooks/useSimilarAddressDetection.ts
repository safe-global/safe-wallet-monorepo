import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { selectAllAddressBooks } from '@/store/addressBookSlice'
import { selectAnchorIndex } from '@/features/address-poisoning/store'
import { sameAddress } from '@safe-global/utils/utils/addresses'
import type { SimilarAddressInfo } from './useNonPinnedSafeWarning.types'

type SimilarAddressResult = {
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
}

/**
 * Detect whether the given address dangerously resembles one of the addresses the
 * user EXPLICITLY trusts (the anchor set: address book, added/pinned, curated nested
 * and undeployed safes). Used to warn about address-poisoning.
 *
 * The comparison baseline is anchors only — never CGW owner-owned safes — so an
 * attacker cannot poison the baseline by deploying a Safe that names the user as
 * owner (previously this compared against all `useAllSafes()`, which was exploitable).
 */
const useSimilarAddressDetection = (safeAddress: string | undefined): SimilarAddressResult => {
  const anchorIndex = useAppSelector(selectAnchorIndex)
  const allSafes = useAllSafes()
  const addressBooks = useAppSelector(selectAllAddressBooks)

  return useMemo(() => {
    const emptyResult: SimilarAddressResult = { hasSimilarAddress: false, similarAddresses: [] }

    if (!safeAddress) {
      return emptyResult
    }

    const match = anchorIndex.query(safeAddress)
    if (!match) {
      return emptyResult
    }

    const matchedAddress = `0x${match.anchor}`
    const matchedSafe = allSafes?.find((safe) => sameAddress(safe.address, matchedAddress))
    // The anchor set also includes address-book contacts that aren't in useAllSafes(); fall back to
    // the address-book name (any chain) so a lookalike of a contact still shows the trusted name.
    const addressBookName = Object.values(addressBooks)
      .flatMap((entries) => Object.entries(entries))
      .find(([addr]) => sameAddress(addr, matchedAddress))?.[1]

    return {
      hasSimilarAddress: true,
      similarAddresses: [{ address: matchedAddress, name: matchedSafe?.name ?? addressBookName }],
    }
  }, [safeAddress, anchorIndex, allSafes, addressBooks])
}

export default useSimilarAddressDetection
export type { SimilarAddressResult }
