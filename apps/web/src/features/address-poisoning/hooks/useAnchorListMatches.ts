import { useMemo } from 'react'
import { useAppSelector } from '@/store'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { detectListSimilarities } from '@safe-global/utils/utils/addressSimilarity'
import type { ListAnnotation } from '@safe-global/utils/utils/addressSimilarity.types'
import { selectAnchorIndex } from '../store'

/**
 * Annotate each list address with the trusted anchor it resembles. Anchors come from local trust
 * state (never fetched, so unpoisonable); an address that IS an anchor is not annotated.
 * Flag-gated by ADDRESS_POISONING_PROTECTION — empty map when off. Pass a stable `addresses`.
 */
const useAnchorListMatches = (addresses: string[]): Map<string, ListAnnotation> => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)

  return useMemo(() => {
    if (!isEnabled || addresses.length === 0) return new Map<string, ListAnnotation>()
    return detectListSimilarities(addresses, anchorIndex)
  }, [isEnabled, addresses, anchorIndex])
}

export default useAnchorListMatches
