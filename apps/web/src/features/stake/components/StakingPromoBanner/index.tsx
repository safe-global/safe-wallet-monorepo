import { useEffect } from 'react'
import { ArrowRight } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { Spinner } from '@/components/ui/spinner'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import { useOpenSafenetStakingApp } from '@/hooks/useOpenSafenetStakingApp'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import css from './styles.module.css'

const LEARN_MORE_LINK =
  'https://forum.safefoundation.org/t/sep-55-phase-2-fund-safenet-beta-for-safe-token-utility/6967'

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
    <div className={css.stakingPromoBanner}>
      <PromoBanner
        title="Stake SAFE tokens and earn up to ~15% APR"
        description={
          <>
            Earn by staking your SAFE tokens, currently rewarded up to 15%.{' '}
            <ExternalLink
              href={LEARN_MORE_LINK}
              noIcon
              onClick={onLearnMore}
              className="font-bold text-inherit underline"
            >
              Learn more
            </ExternalLink>
          </>
        }
        ctaLabel="Stake now"
        onCtaClick={onStake}
        ctaVariant="text"
        endIcon={isNavigating ? <Spinner className="size-4" /> : <ArrowRight className="size-4" />}
        imageSrc="/images/common/staking-promo/safe-coin.svg"
        imageAlt="Safe token"
        trackingEvents={OVERVIEW_EVENTS.OPEN_STAKING_WIDGET}
        trackHideProps={OVERVIEW_EVENTS.HIDE_STAKING_BANNER}
        onDismiss={onDismiss}
      />
    </div>
  )
}

export default StakingPromoBanner
