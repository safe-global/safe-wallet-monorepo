import PromoBanner from '@/components/common/PromoBanner/PromoBanner'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import type { WithHnSignupFlowProps } from '../withHnSignupFlow'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_CATEGORY } from '@/services/analytics/events/hypernative'

export const hnBannerID = 'hnBanner'

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
    <PromoBanner
      trackingEvents={{
        category: HYPERNATIVE_CATEGORY,
        action: HYPERNATIVE_EVENTS.GUARDIAN_FORM_VIEWED.action,
        label,
      }}
      trackHideProps={{
        category: HYPERNATIVE_CATEGORY,
        action: HYPERNATIVE_EVENTS.GUARDIAN_BANNER_DISMISSED.action,
        label,
      }}
      title="Enforce enterprise-grade security"
      description={
        <>
          Automatically monitor and block risky transactions using advanced, user-defined security policies, powered by{' '}
          <span style={{ color: '#00B460', fontWeight: 'bold' }}>Hypernative</span>.
        </>
      }
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
