import type FeesPreview from './components/FeesPreview'
import type FeeInfoBanner from './components/FeeInfoBanner'

export interface GTFContract {
  FeesPreview: typeof FeesPreview
  FeeInfoBanner: typeof FeeInfoBanner
}
