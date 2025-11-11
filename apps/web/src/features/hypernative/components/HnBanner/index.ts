import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withHnBannerConditions, type WithHnBannerConditionsProps } from '../withHnBannerConditions'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { BannerType } from '../../hooks/useBannerStorage'
import { HnBannerWithDismissal } from './HnBannerWithDismissal'
import { HnBannerWithLocalStorage } from './HnBannerWithLocalStorage'

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
export const HnBannerWithLocalStorageVisibility = withHnFeature(HnBannerWithLocalStorageAndSignup)
