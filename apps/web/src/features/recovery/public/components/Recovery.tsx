import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const Recovery = gatedDynamic(FEATURES.RECOVERY, () => import('../../components/Recovery'))

export default Recovery
