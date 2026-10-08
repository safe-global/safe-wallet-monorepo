import LoadingSpinner, { SpinnerStatus } from '@/components/new-safe/create/steps/StatusStep/LoadingSpinner'
import { ReviewTransactionSkeletonView } from '@views/components/tx/ReviewTransactionV2/ReviewTransactionSkeletonView'

const ReviewTransactionSkeleton = () => (
  <ReviewTransactionSkeletonView spinner={<LoadingSpinner status={SpinnerStatus.PROCESSING} />} />
)

export default ReviewTransactionSkeleton
