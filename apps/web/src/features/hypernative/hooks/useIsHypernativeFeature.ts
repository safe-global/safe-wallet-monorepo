import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

/**
 * Hook to determine if Hypernative features should be enabled.
 * Checks if the HYPERNATIVE feature is enabled on the current chain.
 *
 * @returns true if Hypernative features are enabled, false otherwise
 */
export const useIsHypernativeFeature = (): boolean => {
  const hasFeature = useHasFeature(FEATURES.HYPERNATIVE)
  // Return false if feature is undefined or false
  return hasFeature === true
}
