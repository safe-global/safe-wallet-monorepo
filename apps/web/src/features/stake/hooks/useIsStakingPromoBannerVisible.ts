import useLocalStorage from '@/services/local-storage/useLocalStorage'
import useSafeInfo from '@/hooks/useSafeInfo'
import useBalances from '@/hooks/useBalances'
import useIsStakingBannerEnabled from './useIsStakingBannerEnabled'

export const STAKING_PROMO_BANNER_HIDE_KEY = 'hideStakingPromoBanner'

/**
 * Visibility for the staking promo banner.
 * Visible when the STAKING_PROMO feature flag is enabled, the Safe is activated (deployed, not
 * counterfactual), it holds a positive fiat balance, and the user has not dismissed the banner.
 */
const useIsStakingPromoBannerVisible = () => {
  const isStakingPromoEnabled = useIsStakingBannerEnabled()
  const { safe } = useSafeInfo()
  const { balances } = useBalances()
  const [isHidden] = useLocalStorage<boolean>(STAKING_PROMO_BANNER_HIDE_KEY)

  const hasPositiveBalance = Number(balances.fiatTotal) > 0

  return isStakingPromoEnabled && safe.deployed && hasPositiveBalance && !isHidden
}

export default useIsStakingPromoBannerVisible
