import type { PayFromSafeContract } from './contract'
import FeesPreview from './components/FeesPreview'
import FeeInfoBanner from './components/FeeInfoBanner'
import HistoryFeesAccordion from '@safe-global/views/features/pay-from-safe/components/HistoryFeesAccordion'
import GasPayerSelector from './components/GasPayerSelector'
import { resolveFeeParams } from './services/resolveFeeParams'

export default {
  FeesPreview,
  FeeInfoBanner,
  HistoryFeesAccordion,
  GasPayerSelector,
  resolveFeeParams,
} satisfies PayFromSafeContract
