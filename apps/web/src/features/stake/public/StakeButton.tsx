import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const StakeButton = gatedDynamic(FEATURES.STAKING, () => import('../components/StakeButton'))

export default StakeButton
