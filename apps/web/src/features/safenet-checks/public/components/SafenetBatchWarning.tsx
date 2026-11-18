import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafenetBatchWarning = gatedDynamic(FEATURES.SAFENET_CHECKS, () => import('../../components/SafenetBatchWarning'))

export default SafenetBatchWarning
