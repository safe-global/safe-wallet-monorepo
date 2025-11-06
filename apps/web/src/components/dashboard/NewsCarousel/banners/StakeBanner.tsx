import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'
import { AppRoutes } from '@/config/routes'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { OVERVIEW_EVENTS } from '@/services/analytics'
import { useRouter } from 'next/router'
import { PromoBanner } from '@/components/common/PromoBanner'

export const stakeBannerID = 'stakeBanner'

const StakeBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <PromoBanner
      title="Stake your ETH and earn rewards"
      description="Lock 32 ETH and become a validator easily with the Kiln widget. You can also explore Safe Apps or home staking for other options. Staking involves risks like slashing."
      ctaLabel="Stake ETH"
      href={AppRoutes.stake && { pathname: AppRoutes.stake, query: { safe: router.query.safe } }}
      trackOpenProps={OVERVIEW_EVENTS.OPEN_STAKING_WIDGET}
      trackHideProps={OVERVIEW_EVENTS.HIDE_STAKING_BANNER}
      onDismiss={onDismiss}
      imageSrc={EarnIllustrationLight}
      imageAlt="Earn illustration"
      endIcon={<ChevronRightIcon fontSize="small" />}
    />
  )
}

export default StakeBanner
