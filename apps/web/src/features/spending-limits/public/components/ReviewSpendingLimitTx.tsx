import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const ReviewSpendingLimitTx = gatedDynamic(
  FEATURES.SPENDING_LIMIT,
  () => import('../../components/ReviewSpendingLimitTx'),
)

export default ReviewSpendingLimitTx
