import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const CancelRecoveryReview = gatedDynamic(FEATURES.RECOVERY, () => import('../components/CancelRecoveryReview'))

export default CancelRecoveryReview
