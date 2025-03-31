import { useContext } from 'react'

import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import { useHasFeature } from '@/hooks/useChains'

import type { FEATURES } from '@safe-global/utils/utils/chains'

// TODO: Refactor useIsStakingFeatureEnabled/useIsStakingFeatureEnabled to use this
export function useIsGeoblockedFeatureEnabled(feature: FEATURES): boolean | undefined {
  const isBlockedCountry = useContext(GeoblockingContext)
  return useHasFeature(feature) && !isBlockedCountry
}
