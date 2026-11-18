import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const RecoverAccountReview = gatedDynamic(FEATURES.RECOVERY, () => import('../components/RecoverAccountReview'))

export default RecoverAccountReview
