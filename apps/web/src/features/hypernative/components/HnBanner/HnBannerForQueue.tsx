import HnBannerDefault from './index'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

/**
 * HnBanner wrapper for use in the Transaction Queue page.
 * Renders the default export of HnBanner with Queue-specific label.
 * The default export includes withHnFeature and withHnSignupFlow HOCs.
 */
export const HnBannerForQueue = () => {
  return <HnBannerDefault isDismissable={true} label={HYPERNATIVE_SOURCE.Queue} />
}
