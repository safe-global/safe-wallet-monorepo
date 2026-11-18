import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const StakingConfirmationTx = gatedDynamic(FEATURES.STAKING, () => import('../../components/StakingConfirmationTx'))

export default StakingConfirmationTx
