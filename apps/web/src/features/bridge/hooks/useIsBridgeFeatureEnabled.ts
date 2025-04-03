import { useIsGeoblockedFeatureEnabled } from '@/hooks/useIsGeoblockedFeatureEnabled'

import { FEATURES } from '@safe-global/utils/utils/chains'

export function useIsBridgeFeatureEnabled() {
  return useIsGeoblockedFeatureEnabled(FEATURES.BRIDGE)
}
