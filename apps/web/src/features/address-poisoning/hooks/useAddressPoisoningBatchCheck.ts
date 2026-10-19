import { useMemo } from 'react'
import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSimilarityClusters from './useSimilarityClusters'

/**
 * The addresses in a batch (e.g. a CSV import) that look like a saved address or like another
 * address in the same batch, lowercased. Unlike {@link useSimilarityClusters}, the in-batch check
 * is flag-gated too: nothing is flagged when ADDRESS_POISONING_PROTECTION is off.
 * Pass a referentially-stable `addresses`.
 */
const useAddressPoisoningBatchCheck = (addresses: string[]): Set<string> => {
  const isEnabled = useHasFeature(FEATURES.ADDRESS_POISONING_PROTECTION)
  const { flagged } = useSimilarityClusters(addresses)

  return useMemo(() => (isEnabled ? flagged : new Set<string>()), [isEnabled, flagged])
}

export default useAddressPoisoningBatchCheck
