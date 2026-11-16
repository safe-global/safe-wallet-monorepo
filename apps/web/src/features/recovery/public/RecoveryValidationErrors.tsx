import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoveryValidationErrors = gatedDynamic(FEATURES.RECOVERY, () => import('../components/RecoveryValidationErrors'))

export default RecoveryValidationErrors
