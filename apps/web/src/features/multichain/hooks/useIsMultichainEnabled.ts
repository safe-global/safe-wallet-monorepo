import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsMultichainEnabled(): boolean | undefined {
  return useHasFeature(FEATURES.MULTI_CHAIN_SAFE_CREATION)
}
