import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafenetDetailsCard = gatedDynamic(FEATURES.SAFENET_CHECKS, () => import('../components/SafenetDetailsCard'))

export default SafenetDetailsCard
