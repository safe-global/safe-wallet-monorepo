import type FeesPreview from './components/FeesPreview'
import type FeeInfoBanner from './components/FeeInfoBanner'
import type HistoryFeesAccordion from './components/HistoryFeesAccordion'

export interface GTFContract {
  FeesPreview: typeof FeesPreview
  FeeInfoBanner: typeof FeeInfoBanner
  HistoryFeesAccordion: typeof HistoryFeesAccordion
}
