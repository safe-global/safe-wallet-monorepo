import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryHeader = gatedDynamic(FEATURES.RECOVERY, () => import('../components/RecoveryHeader'))

export default RecoveryHeader
