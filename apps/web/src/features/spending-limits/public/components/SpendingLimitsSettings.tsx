import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SpendingLimitsSettings = gatedDynamic(
  FEATURES.SPENDING_LIMIT,
  () => import('../../components/SpendingLimitsSettings'),
)

export default SpendingLimitsSettings
