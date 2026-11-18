import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HistoryFeesAccordion = gatedDynamic(
  FEATURES.GTF,
  () => import('@safe-global/views/features/fee-payment/components/HistoryFeesAccordion'),
)

export default HistoryFeesAccordion
