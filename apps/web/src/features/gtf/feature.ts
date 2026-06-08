import type { GTFContract } from './contract'
import FeesPreview from './components/FeesPreview'
import FeeInfoBanner from './components/FeeInfoBanner'
import HistoryFeesAccordion from './components/HistoryFeesAccordion'
import { resolveFeeParams } from './services/resolveFeeParams'

export default {
  FeesPreview,
  FeeInfoBanner,
  HistoryFeesAccordion,
  resolveFeeParams,
} satisfies GTFContract
