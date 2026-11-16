import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const StakePage = gatedDynamic(FEATURES.STAKING, () => import('../components/StakePage'))

export default StakePage
