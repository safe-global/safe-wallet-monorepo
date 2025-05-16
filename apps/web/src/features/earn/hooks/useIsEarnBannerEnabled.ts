import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@/utils/chains'
import { useContext } from 'react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'

const useIsEarnBannerEnabled = () => {
  const isBlockedCountry = useContext(GeoblockingContext)

  return useHasFeature(FEATURES.EARN) && !isBlockedCountry
}

export default useIsEarnBannerEnabled
