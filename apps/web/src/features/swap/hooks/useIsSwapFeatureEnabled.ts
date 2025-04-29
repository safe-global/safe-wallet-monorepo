import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { useHasFeature } from '@/hooks/useChains'
import { useContext } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsSwapFeatureEnabled = () => {
  const isBlockedCountry = useContext(GeoblockingContext)
  return useHasFeature(FEATURES.NATIVE_SWAPS) && !isBlockedCountry
}

export default useIsSwapFeatureEnabled
