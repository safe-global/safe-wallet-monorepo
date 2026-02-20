import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsCounterfactualEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.COUNTERFACTUAL)
}
