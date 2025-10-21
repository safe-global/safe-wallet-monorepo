// import { useHasFeature } from '@/hooks/useChains'
// import { FEATURES } from '@safe-global/utils/utils/chains'
// import useSafeInfo from '@/hooks/useSafeInfo'

/**
 * Hook to determine if the No Fee November banner should be visible
 *
 * Banner is visible when:
 * - Feature flag is enabled
 * - Safe is on Mainnet (chainId === '1')
 *
 * TODO: Remove mock when ready for production
 */
const useIsNoFeeNovemberBannerVisible = (): boolean => {
  // const isFeatureEnabled = useHasFeature(FEATURES.NO_FEE_NOVEMBER)
  // const { safe } = useSafeInfo()

  // Mock: Always show banner for testing (remove this line when ready for production)
  return true

  // Production logic (uncomment when ready):
  // return Boolean(isFeatureEnabled && safe.chainId === '1')
}

export default useIsNoFeeNovemberBannerVisible
