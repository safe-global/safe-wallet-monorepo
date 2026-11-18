import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryStatus = gatedDynamic(FEATURES.RECOVERY, () => import('../../components/RecoveryStatus'))

export default RecoveryStatus
