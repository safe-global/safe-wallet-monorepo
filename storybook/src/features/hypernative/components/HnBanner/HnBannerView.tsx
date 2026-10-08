import type { ReactNode } from 'react'
import { ArrowRight as ArrowForwardIcon } from 'lucide-react'
import type { PromoBannerProps } from '@/components/common/PromoBanner/PromoBanner'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'
import { HYPERNATIVE_EVENTS, HYPERNATIVE_CATEGORY } from '@/services/analytics/events/hypernative'

export type HnBannerViewProps = {
  onHnSignupClick: () => void
  onDismiss?: () => void
  label?: HYPERNATIVE_SOURCE
  renderPromoBanner: (props: PromoBannerProps) => ReactNode
}

export const HnBannerView = ({ onHnSignupClick, onDismiss, label, renderPromoBanner }: HnBannerViewProps) => {
  return (
    <>
      {renderPromoBanner({
        trackingEvents: {
          category: HYPERNATIVE_CATEGORY,
          action: HYPERNATIVE_EVENTS.GUARDIAN_FORM_VIEWED.action,
          label,
        },
        trackHideProps: {
          category: HYPERNATIVE_CATEGORY,
          action: HYPERNATIVE_EVENTS.GUARDIAN_BANNER_DISMISSED.action,
          label,
        },
        title: 'Enforce enterprise-grade security',
        description: (
          <>
            Automatically monitor and block risky transactions using advanced, user-defined security policies, powered
            by <span style={{ color: '#00B460', fontWeight: 'bold' }}>Hypernative</span>.
          </>
        ),
        ctaLabel: 'Learn more',
        imageSrc: '/images/hypernative/guardian-badge.svg',
        imageAlt: 'Guardian badge',
        onBannerClick: onHnSignupClick,
        ctaVariant: 'text',
        onDismiss,
        endIcon: <ArrowForwardIcon className="size-4" />,
        customBackground: 'linear-gradient(90deg, #1c5538 0%, #1c1c1c 54.327%, #1c1c1c 100%)',
        customTitleColor: 'var(--color-static-primary)',
        customFontColor: 'var(--color-static-text-secondary)',
        customCtaColor: 'var(--color-static-primary)',
        customCloseIconColor: 'var(--color-text-secondary)',
      })}
    </>
  )
}
