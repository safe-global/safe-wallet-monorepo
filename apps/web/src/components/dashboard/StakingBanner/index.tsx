/**
 * @usedBy pages/balances/index.tsx (StakingBanner, useIsStakingBannerVisible)
 */
import { useDarkMode } from '@/hooks/useDarkMode'
import { useRouter } from 'next/router'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import useLocalStorage from '@/services/local-storage/useLocalStorage'
import { AppRoutes } from '@/config/routes'
import useIsStakingBannerVisible from '@/components/dashboard/StakingBanner/useIsStakingBannerVisible'
import { useSafeLinkQuery } from '@/hooks/useSafeLinkQuery'
import { StakingBannerView } from '@views/components/dashboard/StakingBanner/StakingBannerView'

const STAKING_CATEGORY = 'Staking'

const StakingBanner = ({
  hideLocalStorageKey = 'hideStakingBanner',
}: { large?: boolean; hideLocalStorageKey?: string } = {}) => {
  const isDarkMode = useDarkMode()
  const router = useRouter()
  const safeLinkQuery = useSafeLinkQuery()
  const isStakingBannerVisible = useIsStakingBannerVisible()

  const [_, setWidgetHidden] = useLocalStorage<boolean>(hideLocalStorageKey)

  if (!isStakingBannerVisible) return null

  const onClick = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_STAKING_WIDGET)
  }

  const onHide = () => {
    setWidgetHidden(true)
    trackEvent(OVERVIEW_EVENTS.HIDE_STAKING_BANNER)
  }

  const onLearnMore = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER)
  }

  return (
    <StakingBannerView
      isDarkMode={isDarkMode}
      exploreAppsHref={{ pathname: AppRoutes.apps.index, query: { ...router.query, categories: [STAKING_CATEGORY] } }}
      stakeHref={
        AppRoutes.stake && {
          pathname: AppRoutes.stake,
          query: safeLinkQuery,
        }
      }
      onStakeClick={onClick}
      onHide={onHide}
      onLearnMore={onLearnMore}
    />
  )
}

export default StakingBanner
