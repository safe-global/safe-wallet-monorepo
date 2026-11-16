import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SpendingLimitRow = gatedDynamic(FEATURES.SPENDING_LIMIT, () => import('../components/SpendingLimitRow'))

export default SpendingLimitRow
