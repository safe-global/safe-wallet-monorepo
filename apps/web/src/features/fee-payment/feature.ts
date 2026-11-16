import type { FeePaymentContract } from './contract'
import FeesPreview from './components/FeesPreview'
import FeeInfoBanner from './components/FeeInfoBanner'
import HistoryFeesAccordion from '@safe-global/views/features/fee-payment/components/HistoryFeesAccordion'
import { resolveFeeParams } from './services/resolveFeeParams'

export default {
  FeesPreview,
  FeeInfoBanner,
  HistoryFeesAccordion,
  resolveFeeParams,
} satisfies FeePaymentContract
