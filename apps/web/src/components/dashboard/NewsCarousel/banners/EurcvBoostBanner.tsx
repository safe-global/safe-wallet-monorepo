import { Link as MuiLink } from '@mui/material'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { OVERVIEW_EVENTS } from '@/services/analytics/events/overview'
import { useRouter } from 'next/router'
import { AppRoutes } from '@/config/routes'
import { EARN_HELP_ARTICLE } from '@/features/earn/constants'
import { EURCV_ASSET_ID } from '@/config/eurcv'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'

export const eurcvBoostBannerID = 'eurcvBoostBanner'

export const EurcvBoostBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  const handleCtaClick = () => {
    router.push({
      pathname: AppRoutes.earn,
      query: {
        safe: router.query.safe,
        asset_id: EURCV_ASSET_ID,
      },
    })
  }

  return (
    <PromoBanner
      title="EURCV is now available"
      description={
        <>
          Stake EURCV and earn boosted APY on deposits.{' '}
          <MuiLink
            href={EARN_HELP_ARTICLE}
            target="_blank"
            rel="noopener noreferrer"
            sx={{ color: 'inherit', textDecoration: 'underline' }}
          >
            Learn more
          </MuiLink>
        </>
      }
      ctaLabel="Start earning"
      onCtaClick={handleCtaClick}
      onDismiss={onDismiss}
      imageSrc="/images/eurcv-boost/eurcv.svg"
      imageAlt="EURCV"
      endIcon={<ChevronRightIcon fontSize="small" />}
      trackingEvents={OVERVIEW_EVENTS.OPEN_EURCV_BOOST}
      trackHideProps={OVERVIEW_EVENTS.HIDE_EURCV_BOOST_BANNER}
      ctaVariant="text"
    />
  )
}
