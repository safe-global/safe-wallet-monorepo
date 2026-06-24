import type { ComponentType } from 'react'
import HnBannerDefault from './index'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

/**
 * HnBanner wrapper for the dashboard.
 * Ignores the dismiss prop and renders the default export of HnBanner.
 * The default export includes withHnFeature and withHnSignupFlow HOCs.
 */
export const HnBannerForCarousel: ComponentType<{ onDismiss: () => void }> = () => {
  return <HnBannerDefault isDismissable={true} label={HYPERNATIVE_SOURCE.Dashboard} />
}
