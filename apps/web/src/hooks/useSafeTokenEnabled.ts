import { useContext } from 'react'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import useSafeInfo from './useSafeInfo'
import { useHasFeature } from './useChains'
import { FEATURES } from '@safe-global/utils/utils/chains'
import { SAFE_TOKEN_ADDRESSES } from '@/config/constants'

export function useSafeTokenEnabled(): boolean {
  const isBlockedCountry = useContext(GeoblockingContext)
  const { safe, safeLoaded } = useSafeInfo()
  const hasSafeTokenFeature = useHasFeature(FEATURES.SAFE_STAKING)
  return !isBlockedCountry && safeLoaded && !!hasSafeTokenFeature && !!SAFE_TOKEN_ADDRESSES[safe.chainId]
}
