import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryDescription = gatedDynamic(FEATURES.RECOVERY, () => import('../components/RecoveryDescription'))

export default RecoveryDescription
