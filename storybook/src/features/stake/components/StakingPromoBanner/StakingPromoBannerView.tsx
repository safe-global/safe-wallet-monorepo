import type { ReactNode } from 'react'
import { ArrowRight } from 'lucide-react'
import ExternalLink from '@/components/common/ExternalLink'
import { Spinner } from '@/components/ui/spinner'
import type { PromoBannerProps } from '@/components/common/PromoBanner/PromoBanner'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import css from './styles.module.css'

const LEARN_MORE_LINK =
  'https://forum.safefoundation.org/t/sep-55-phase-2-fund-safenet-beta-for-safe-token-utility/6967'

export type StakingPromoBannerViewProps = {
  isNavigating: boolean
  onStake: () => void
  onLearnMore: () => void
  onDismiss: () => void
  renderPromoBanner: (props: PromoBannerProps) => ReactNode
}

export const StakingPromoBannerView = ({
  isNavigating,
  onStake,
  onLearnMore,
  onDismiss,
  renderPromoBanner,
}: StakingPromoBannerViewProps) => {
  return (
    <div className={css.stakingPromoBanner}>
      {renderPromoBanner({
        title: 'Stake SAFE tokens and earn up to ~15% APR',
        description: (
          <>
            Earn by staking your SAFE tokens, currently rewarded up to 15%.{' '}
            <ExternalLink
              href={LEARN_MORE_LINK}
              noIcon
              onClick={onLearnMore}
              className="font-bold text-inherit [&>span]:underline"
            >
              Learn more
            </ExternalLink>
          </>
        ),
        ctaLabel: 'Stake now',
        onCtaClick: onStake,
        ctaVariant: 'text',
        endIcon: isNavigating ? <Spinner className="size-4" /> : <ArrowRight className="size-4" />,
        imageSrc: '/images/common/staking-promo/safe-coin.svg',
        imageAlt: 'Safe token',
        trackingEvents: OVERVIEW_EVENTS.OPEN_STAKING_WIDGET,
        trackHideProps: OVERVIEW_EVENTS.HIDE_STAKING_BANNER,
        onDismiss,
      })}
    </div>
  )
}
