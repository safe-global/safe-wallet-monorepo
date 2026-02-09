import { useMemo } from 'react'
import useAllSafes from '@/hooks/safes/useAllSafes'
import { detectSimilarAddresses } from '../services/addressSimilarity'
import type { SimilarAddressInfo } from './useNonPinnedSafeWarning.types'

type SimilarAddressResult = {
  hasSimilarAddress: boolean
  similarAddresses: SimilarAddressInfo[]
}

/**
 * Hook to detect if a given address has similar addresses among the user's safes.
 * Used for warning users about potential address poisoning attacks.
 */
const useSimilarAddressDetection = (safeAddress: string | undefined): SimilarAddressResult => {
  const allSafes = useAllSafes()

  return useMemo(() => {
    const emptyResult: SimilarAddressResult = { hasSimilarAddress: false, similarAddresses: [] }

    if (!safeAddress || !allSafes || allSafes.length === 0) {
      return emptyResult
    }

    const otherAddresses = allSafes
      .map((s) => s.address)
      .filter((addr) => addr.toLowerCase() !== safeAddress.toLowerCase())

    if (otherAddresses.length === 0) {
      return emptyResult
    }

    const allAddressesToCheck = [...otherAddresses, safeAddress]
    const result = detectSimilarAddresses(allAddressesToCheck)

    if (!result.isFlagged(safeAddress)) {
      return emptyResult
    }

    const group = result.getGroup(safeAddress)
    const similarAddresses =
      group?.addresses
        .filter((addr) => addr.toLowerCase() !== safeAddress.toLowerCase())
        .map((addr) => {
          const safeInfo = allSafes.find((s) => s.address.toLowerCase() === addr.toLowerCase())
          return { address: addr, name: safeInfo?.name }
        }) ?? []

    return { hasSimilarAddress: true, similarAddresses }
  }, [safeAddress, allSafes])
}

export default useSimilarAddressDetection
export type { SimilarAddressResult }
