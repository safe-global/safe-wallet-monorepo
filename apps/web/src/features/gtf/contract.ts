import type FeesPreview from './components/FeesPreview'
import type FeeInfoBanner from './components/FeeInfoBanner'
import type HistoryFeesAccordion from './components/HistoryFeesAccordion'
import type { resolveFeeParams } from './services/resolveFeeParams'

export interface GTFContract {
  FeesPreview: typeof FeesPreview
  FeeInfoBanner: typeof FeeInfoBanner
  HistoryFeesAccordion: typeof HistoryFeesAccordion
  resolveFeeParams: typeof resolveFeeParams
}
