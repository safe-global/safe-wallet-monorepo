import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoverySettings = gatedDynamic(FEATURES.RECOVERY, () => import('../../components/RecoverySettings'))

export default RecoverySettings
