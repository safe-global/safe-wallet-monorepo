import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_SOURCE, trackEvent, MixpanelEventParams } from '@/services/analytics'
import { HnDashboardBannerView } from '@views/features/hypernative/components/HnDashboardBanner/HnDashboardBannerView'

export interface HnDashboardBannerProps extends WithHnSignupFlowProps {}

export const HnDashboardBanner = ({ onHnSignupClick }: HnDashboardBannerProps) => {
  const handleBannerClick = () => {
    trackEvent(
      { ...HYPERNATIVE_EVENTS.GUARDIAN_FORM_VIEWED, label: HYPERNATIVE_SOURCE.Tutorial },
      { [MixpanelEventParams.SOURCE]: HYPERNATIVE_SOURCE.Tutorial },
    )
    onHnSignupClick()
  }

  return <HnDashboardBannerView onBannerClick={handleBannerClick} />
}
