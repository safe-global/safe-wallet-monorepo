import HnBannerDefault from './index'
import { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

/**
 * HnBanner wrapper for use in the Transaction History page.
 * Renders the default export of HnBanner with History-specific label.
 * The default export includes withHnFeature and withHnSignupFlow HOCs.
 */
export const HnBannerForHistory = () => {
  return <HnBannerDefault isDismissable={true} label={HYPERNATIVE_SOURCE.History} />
}
