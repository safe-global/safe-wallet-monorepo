import { PromoBanner } from '@/components/common/PromoBanner'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_CATEGORY } from '@/services/analytics/events/hypernative'

export const hnBannerID = 'hnBanner'

export interface HnBannerProps extends WithHnSignupFlowProps {
  onDismiss?: () => void
}

/**
 * Pure HnBanner component without side effects.
 * Receives onDismiss callback from parent wrapper.
 */
export const HnBanner = ({ onHnSignupClick, onDismiss }: HnBannerProps) => {
  return (
    <PromoBanner
      // TODO: check tracking events naming
      trackingEvents={{
        category: HYPERNATIVE_CATEGORY,
        action: HYPERNATIVE_EVENTS.GUARD_LEARN_MORE.action,
        label: 'Strengthen your Safe',
      }}
      trackHideProps={{
        category: 'hypernative',
        action: 'hide_hn_banner',
        label: 'Strengthen your Safe',
      }}
      title="Strengthen your Safe"
      description="Automatically monitor and block risky transactions using advanced, user-defined security policies, powered by Hypernative."
      ctaLabel="Learn more"
      imageSrc="/images/hypernative/guardian-badge.svg"
      imageAlt="Guardian badge"
      onBannerClick={onHnSignupClick}
      ctaVariant="text"
      onDismiss={onDismiss}
      endIcon={<ArrowForwardIcon fontSize="small" />}
      customBackground="linear-gradient(90deg, #1c5538 0%, #1c1c1c 54.327%, #1c1c1c 100%)"
      customTitleColor="var(--color-static-primary)"
      customFontColor="var(--color-static-text-secondary)"
      customCtaColor="var(--color-static-primary)"
      customCloseIconColor="var(--color-text-secondary)"
    />
  )
}
