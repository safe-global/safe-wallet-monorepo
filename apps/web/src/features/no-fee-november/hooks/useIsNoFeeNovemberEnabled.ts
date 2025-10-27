import { useHasFeature } from '@/hooks/useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { useContext } from 'react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'

/**
 * Hook to determine if the No Fee November feature should be enabled
 *
 * Feature is enabled when:
 * - Feature flag is enabled
 * - User is NOT in a geofenced/blocked country
 * - Safe is on Mainnet (chainId === '1')
 */
const useIsNoFeeNovemberEnabled = (): boolean => {
  const isFeatureEnabled = useHasFeature(FEATURES.NO_FEE_NOVEMBER)
  const { safe } = useSafeInfo()
  const isBlockedCountry = useContext(GeoblockingContext)

  // Feature is disabled if user is in blocked country
  if (isBlockedCountry) {
    return false
  }

  return Boolean(isFeatureEnabled && safe.chainId === '1')
}

export default useIsNoFeeNovemberEnabled
