import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const GnosisPayQueue = gatedDynamic(FEATURES.GNOSIS_PAY, () => import('../../GnosisPayQueue'))

export default GnosisPayQueue
