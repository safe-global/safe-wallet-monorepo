// import { useHasFeature } from '@/hooks/useChains'
// import { FEATURES } from '@safe-global/utils/utils/chains'
// import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * Hook to determine if the No Fee November feature should be enabled
 *
 * Feature is enabled when:
 * - Feature flag is enabled
 * - Safe is on Mainnet (chainId === '1')
 *
 * TODO: Remove mock when feature flag is enabled on Mainnet chain configuration
 */
const useIsNoFeeNovemberEnabled = (): boolean => {
  // const isFeatureEnabled = useHasFeature(FEATURES.NO_FEE_NOVEMBER)
  // const { safe } = useSafeInfo()

  // Mock: Always show banner for testing (remove this line when feature flag is enabled)
  return true

  // Production logic (uncomment when feature flag is enabled on Mainnet):
  // return Boolean(isFeatureEnabled && safe.chainId === '1')
}

export default useIsNoFeeNovemberEnabled
