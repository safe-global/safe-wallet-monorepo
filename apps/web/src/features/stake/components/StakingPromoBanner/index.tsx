import { useEffect } from 'react'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import { StakingPromoBannerView } from '@views/features/stake/components/StakingPromoBanner/StakingPromoBannerView'

const StakingPromoBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { openSafenetStakingApp, isNavigating } = useOpenSafenetStakingApp()

  useEffect(() => {
    trackEvent(OVERVIEW_EVENTS.SHOW_STAKING_BANNER)
  }, [])

  const onStake = () => {
    openSafenetStakingApp()
  }

  const onLearnMore = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER)
  }

  return (
    <StakingPromoBannerView
      isNavigating={isNavigating}
      onStake={onStake}
      onLearnMore={onLearnMore}
      onDismiss={onDismiss}
      renderPromoBanner={(props) => <PromoBanner {...props} />}
    />
  )
}

export default StakingPromoBanner
