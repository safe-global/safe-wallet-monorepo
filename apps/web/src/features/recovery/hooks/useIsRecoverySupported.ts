import { useHasFeature } from '@/hooks/useChains'

import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsRecoverySupported(): boolean {
  return useHasFeature(FEATURES.RECOVERY) ?? false
}
