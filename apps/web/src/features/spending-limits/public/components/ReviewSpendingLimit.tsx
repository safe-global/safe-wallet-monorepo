import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const ReviewSpendingLimit = gatedDynamic(FEATURES.SPENDING_LIMIT, () => import('../../components/ReviewSpendingLimit'))

export default ReviewSpendingLimit
