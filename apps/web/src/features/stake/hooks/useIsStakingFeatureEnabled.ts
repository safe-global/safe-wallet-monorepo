import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { useHasFeature } from '@/hooks/useChains'
import { useContext } from 'react'
import { FEATURES } from '@safe-global/utils/utils/chains'

const useIsStakingFeatureEnabled = () => {
  const isBlockedCountry = useContext(GeoblockingContext)
  return useHasFeature(FEATURES.STAKING) && !isBlockedCountry
}

export default useIsStakingFeatureEnabled
