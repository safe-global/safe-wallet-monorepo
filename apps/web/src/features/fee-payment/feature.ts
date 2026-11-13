import type { FeePaymentContract } from './contract'
import FeeInfoBanner from './components/FeeInfoBanner'
import HistoryFeesAccordion from '@safe-global/views/features/fee-payment/components/HistoryFeesAccordion'
import GasPayerSelector from './components/GasPayerSelector'
import { resolveFeeParams } from './services/resolveFeeParams'

export default {
  FeeInfoBanner,
  HistoryFeesAccordion,
  GasPayerSelector,
  resolveFeeParams,
} satisfies FeePaymentContract
