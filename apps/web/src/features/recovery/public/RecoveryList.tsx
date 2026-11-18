import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryList = gatedDynamic(FEATURES.RECOVERY, () => import('../components/RecoveryList'))

export default RecoveryList
