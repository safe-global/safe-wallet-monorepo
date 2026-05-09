import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * Hook to determine if Hypernative queue scan features should be enabled.
 * Checks if the HYPERNATIVE_QUEUE_SCAN feature is enabled on the current chain.
 *
 * @returns true if Hypernative queue scan features are enabled, false otherwise
 */
export const useIsHypernativeQueueScanFeature = (): boolean => {
  const hasFeature = useHasFeature(FEATURES.HYPERNATIVE_QUEUE_SCAN)
  return hasFeature === true
}
