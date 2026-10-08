import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HnBannerView } from '@views/features/hypernative/components/HnBanner/HnBannerView'

export interface HnBannerProps extends WithHnSignupFlowProps {
  onDismiss?: () => void
  label?: HYPERNATIVE_SOURCE
}

/**
 * Pure HnBanner component without side effects.
 * Receives onDismiss callback from parent wrapper.
 */
export const HnBanner = ({ onHnSignupClick, onDismiss, label }: HnBannerProps) => {
  return (
    <HnBannerView
      onHnSignupClick={onHnSignupClick}
      onDismiss={onDismiss}
      label={label}
      renderPromoBanner={(props) => <PromoBanner {...props} />}
    />
  )
}
