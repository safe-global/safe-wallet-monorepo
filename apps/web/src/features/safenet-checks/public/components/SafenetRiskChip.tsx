import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafenetRiskChip = gatedDynamic(FEATURES.SAFENET_CHECKS, () => import('../../components/SafenetRiskChip'))

export default SafenetRiskChip
