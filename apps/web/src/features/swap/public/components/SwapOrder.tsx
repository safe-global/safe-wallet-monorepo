import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SwapOrder = gatedDynamic(FEATURES.NATIVE_SWAPS, () => import('../../components/SwapOrder'))

export default SwapOrder
