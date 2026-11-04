import { useMemo } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { useAppSelector } from '@/store'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { selectAnchorIndex } from '../store'
import useSimilarityClusters from './useSimilarityClusters'

const NO_ADDRESSES: string[] = []

/** Lowercased batch addresses that look like a saved address or another one in the batch; saved ones are skipped. */
const useAddressPoisoningBatchCheck = (addresses: string[]): Set<string> => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const anchorIndex = useAppSelector(selectAnchorIndex)

  const candidates = useMemo(
    () => (isEnabled ? addresses.filter((address) => !anchorIndex.isAnchor(address)) : NO_ADDRESSES),
    [isEnabled, addresses, anchorIndex],
  )

  return useSimilarityClusters(candidates).flagged
}

export default useAddressPoisoningBatchCheck
