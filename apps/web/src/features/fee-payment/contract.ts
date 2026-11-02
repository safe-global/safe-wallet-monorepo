import type FeesPreview from './components/FeesPreview'
import type FeeInfoBanner from './components/FeeInfoBanner'
import type HistoryFeesAccordion from '@safe-global/views/features/fee-payment/components/HistoryFeesAccordion'
import type GasPayerSelector from './components/GasPayerSelector'
import type { resolveFeeParams } from './services/resolveFeeParams'

export interface FeePaymentContract {
  FeesPreview: typeof FeesPreview
  FeeInfoBanner: typeof FeeInfoBanner
  HistoryFeesAccordion: typeof HistoryFeesAccordion
  GasPayerSelector: typeof GasPayerSelector
  resolveFeeParams: typeof resolveFeeParams
}
