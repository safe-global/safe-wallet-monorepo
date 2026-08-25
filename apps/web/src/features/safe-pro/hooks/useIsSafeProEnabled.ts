import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsSafeProEnabled() {
  return useHasFeature(FEATURES.SAFE_PRO) === true
}
