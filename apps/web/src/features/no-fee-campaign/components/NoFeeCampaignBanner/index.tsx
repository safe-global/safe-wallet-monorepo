import { useContext } from 'react'
import { TxModalContext } from '@/components/tx-flow'
import { NewTxFlow } from '@/components/tx-flow/flows'
import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import useWallet from '@/hooks/wallets/useWallet'
import useIsSafeOwner from '@/hooks/useIsSafeOwner'
import { useSafeSDK } from '@/hooks/coreSDK/safeCoreSDK'
import type { AnalyticsEvent } from '@/services/analytics'
import { NoFeeCampaignBannerView } from '@views/features/no-fee-campaign/components/NoFeeCampaignBanner/NoFeeCampaignBannerView'

const TRACKING_EVENTS: AnalyticsEvent = { category: 'overview', action: 'open_no_fee_campaign_new_tx' }
const TRACK_HIDE_PROPS: AnalyticsEvent = { category: 'overview', action: 'hide_no_fee_campaign_banner' }

const NoFeeCampaignBanner = ({ onDismiss }: { onDismiss: () => void }) => {
  const { setTxFlow } = useContext(TxModalContext)
  const wallet = useWallet()
  const isSafeOwner = useIsSafeOwner()
  const safeSDK = useSafeSDK()
  const ctaDisabled = !wallet || !isSafeOwner || !safeSDK

  const handleNewTransaction = () => {
    setTxFlow(<NewTxFlow />, undefined, false)
  }

  return (
    <NoFeeCampaignBannerView
      renderPromoBanner={(props) => (
        <PromoBanner
          {...props}
          onCtaClick={handleNewTransaction}
          ctaDisabled={ctaDisabled}
          trackingEvents={TRACKING_EVENTS}
          trackHideProps={TRACK_HIDE_PROPS}
          onDismiss={onDismiss}
        />
      )}
    />
  )
}

export default NoFeeCampaignBanner
