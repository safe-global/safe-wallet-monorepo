import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RemoveSpendingLimitReview = gatedDynamic(
  FEATURES.SPENDING_LIMIT,
  () => import('../../components/RemoveSpendingLimitReview'),
)

export default RemoveSpendingLimitReview
