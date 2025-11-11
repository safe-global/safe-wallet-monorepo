import type { ComponentType } from 'react'
import { withHnFeature } from '../withHnFeature'
import { withHnSignupFlow } from '../withHnSignupFlow'
import { HnMiniTxBanner } from './HnMiniTxBanner'

// Export the original pure component for tests and stories
export { HnMiniTxBanner } from './HnMiniTxBanner'
export type { HnMiniTxBannerProps } from './HnMiniTxBanner'

// Export the composed HOC as default for use in transaction flows
// Apply withHnSignupFlow first (inner), then withHnFeature (outer)
const HnMiniTxBannerWithSignup = withHnSignupFlow(HnMiniTxBanner)
export default withHnFeature(HnMiniTxBannerWithSignup as ComponentType<Record<string, never>>)

