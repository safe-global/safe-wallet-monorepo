import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HYPERNATIVE_SOURCE, MixpanelEventParams } from '@/services/analytics'
import { HnMiniTxBannerView } from '@views/features/hypernative/components/HnMiniTxBanner/HnMiniTxBannerView'

export interface HnMiniTxBannerProps extends WithHnSignupFlowProps {
  onDismiss: () => void
}

/**
 * Mini Hypernative banner component for transaction flows.
 * Compact, clickable banner that opens the Hypernative signup flow.
 * Uses the same custom background and theme as HnBanner.
 */
export const HnMiniTxBanner = ({ onHnSignupClick, onDismiss }: HnMiniTxBannerProps) => {
  const handleClick = () => {
    onHnSignupClick()
  }

  const handleDismissClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  return (
    <HnMiniTxBannerView
      mixpanelParams={{
        [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.NewTransaction,
      }}
      onClick={handleClick}
      onDismissClick={handleDismissClick}
    />
  )
}
