import dynamic from '@/utils/dynamic'

// No feature flag: the history shows who paid the fees on every chain.
const HistoryFeesAccordion = dynamic(
  () => import('@safe-global/views/features/fee-payment/components/HistoryFeesAccordion'),
)

export default HistoryFeesAccordion
