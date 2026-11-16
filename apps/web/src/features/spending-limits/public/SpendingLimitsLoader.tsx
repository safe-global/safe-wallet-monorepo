import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SpendingLimitsLoader = gatedDynamic(FEATURES.SPENDING_LIMIT, () => import('../components/SpendingLimitsLoader'))

export default SpendingLimitsLoader
