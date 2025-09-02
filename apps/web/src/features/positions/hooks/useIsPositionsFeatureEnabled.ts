import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsPositionsFeatureEnabled = () => {
  return useHasFeature(FEATURES.POSITIONS)
}

export default useIsPositionsFeatureEnabled
