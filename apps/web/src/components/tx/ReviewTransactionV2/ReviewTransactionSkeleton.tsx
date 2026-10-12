import LoadingSpinner, {
  SpinnerStatus,
} from '@safe-global/design/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import TxCard from '@safe-global/design/components/tx-flow/common/TxCard'

const ReviewTransactionSkeleton = () => (
  <TxCard>
    <div className="mb-10 flex min-h-[38svh] items-center justify-center">
      <LoadingSpinner status={SpinnerStatus.PROCESSING} />
    </div>
  </TxCard>
)

export default ReviewTransactionSkeleton
