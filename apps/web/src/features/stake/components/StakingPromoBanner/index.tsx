import { useEffect } from 'react'
import { useRouter } from 'next/router'
import { Link } from '@mui/material'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import { AppRoutes } from '@/config/routes'
import { OVERVIEW_EVENTS, trackEvent } from '@/services/analytics'
import css from './styles.module.css'

const LEARN_MORE_LINK =
  'https://forum.safefoundation.org/t/sep-55-phase-2-fund-safenet-beta-for-safe-token-utility/6967'

const StakingPromoBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  useEffect(() => {
    trackEvent(OVERVIEW_EVENTS.SHOW_STAKING_BANNER)
  }, [])

  const onStake = () => {
    router.push({ pathname: AppRoutes.stake, query: { safe: router.query.safe } })
  }

  const onLearnMore = () => {
    trackEvent(OVERVIEW_EVENTS.OPEN_LEARN_MORE_STAKING_BANNER)
  }

  return (
    <div className={css.stakingPromoBanner}>
      <PromoBanner
        title="SAFE staking is now live"
        description={
          <>
            Stake SAFE tokens now and get rewards on deposit.{' '}
            <Link
              href={LEARN_MORE_LINK}
              target="_blank"
              rel="noopener noreferrer"
              onClick={onLearnMore}
              sx={{ color: 'inherit', textDecoration: 'underline', fontWeight: 'bold' }}
            >
              Learn more
            </Link>
          </>
        }
        ctaLabel="Stake now"
        onCtaClick={onStake}
        ctaVariant="text"
        endIcon={<ArrowForwardIcon fontSize="small" />}
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
