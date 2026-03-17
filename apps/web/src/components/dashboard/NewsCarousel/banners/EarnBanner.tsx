import EarnIllustrationLight from '@/public/images/common/earn-illustration-light.png'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import { EARN_EVENTS, EARN_LABELS } from '@/services/analytics/events/earn'
import { AppRoutes } from '@/config/routes'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import { useRouter } from 'next/router'

export const earnBannerID = 'earnBanner'

export const earnBannerDisclaimer =
  '* based on historic averages of USD stablecoin and ETH Morpho vaults. Yields are variable and subject to change. Past performance is not a guarantee of future returns. The Kiln DeFi, Morpho Borrow and Vault products and features described herein are not offered or controlled by Safe Labs GmbH, Safe Ecosystem Foundation, and/or its affiliates.'
export const EarnBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <PromoBanner
      title="Try enterprise-grade yields with up to 8.10% APY*"
      description="Deposit stablecoins, wstETH, ETH, and WBTC and let your assets compound in minutes."
      ctaLabel="Try now"
      href={{ pathname: AppRoutes.earn, query: { safe: router.query.safe } }}
      imageSrc={EarnIllustrationLight}
      imageAlt="Earn illustration"
      endIcon={<ChevronRightIcon fontSize="small" />}
      ctaVariant="text"
      trackingEvents={{ ...EARN_EVENTS.OPEN_EARN_PAGE, label: EARN_LABELS.safe_dashboard_banner }}
      trackHideProps={EARN_EVENTS.HIDE_EARN_BANNER}
      onDismiss={onDismiss}
    />
  )
}
