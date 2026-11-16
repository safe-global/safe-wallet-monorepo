import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const StakingPromoBanner = gatedDynamic(FEATURES.STAKING, () => import('../components/StakingPromoBanner'))

export default StakingPromoBanner
