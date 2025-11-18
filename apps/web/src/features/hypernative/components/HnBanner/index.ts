import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../withHnBannerConditions'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnBannerWithDismissal } from './HnBannerWithDismissal'
import { HnBannerWithLocalStorage } from './HnBannerWithLocalStorage'
import type { HYPERNATIVE_SOURCE } from '@/services/analytics/events/hypernative'

// Export the original pure component for tests and stories
export { HnBanner, hnBannerID } from './HnBanner'
export type { HnBannerProps } from './HnBanner'

// Export the carousel-compatible version
export { HnBannerForCarousel } from './HnBannerForCarousel'

// Export the composed HOC as default for use in Settings
// Apply withHnSignupFlow first (inner), then withHnBannerConditions, then withHnFeature (outer)
const HnBannerWithSignupAndDismissal = withHnSignupFlow(HnBannerWithDismissal)
const HnBannerWithConditions = withHnBannerConditions(BannerType.Promo)(
  HnBannerWithSignupAndDismissal as ComponentType<WithHnBannerConditionsProps>,
)
export default withHnFeature(HnBannerWithConditions)

// Export version with localStorage for use in pages without SafeInfo (e.g., /wallets/account)
// Apply withHnSignupFlow first (inner), then withHnFeature (outer)
// Visibility check is now handled directly in HnBannerWithLocalStorage
const HnBannerWithLocalStorageAndSignup = withHnSignupFlow(HnBannerWithLocalStorage)
const HnBannerWithLocalStorageVisibilityComponent = withHnFeature(HnBannerWithLocalStorageAndSignup)

// Type for the exported component (excludes onHnSignupClick which is provided by HOC)
export interface HnBannerWithLocalStorageVisibilityProps {
  label?: HYPERNATIVE_SOURCE
}

// Type assertion: the HOC provides onHnSignupClick, so consumers only need to pass label
export const HnBannerWithLocalStorageVisibility =
  HnBannerWithLocalStorageVisibilityComponent as ComponentType<HnBannerWithLocalStorageVisibilityProps>
