import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { selectAnchorIndex } from '@/features/address-poisoning/store'
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
    const matchedSafe = allSafes?.find((safe) => safe.address.toLowerCase() === matchedAddress.toLowerCase())

    return {
      hasSimilarAddress: true,
      similarAddresses: [{ address: matchedAddress, name: matchedSafe?.name }],
    }
  }, [safeAddress, anchorIndex, allSafes])
}

export default useSimilarAddressDetection
export type { SimilarAddressResult }
