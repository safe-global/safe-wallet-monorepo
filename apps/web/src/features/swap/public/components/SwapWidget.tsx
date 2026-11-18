import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SwapWidget = gatedDynamic(FEATURES.NATIVE_SWAPS, () => import('../../components/SwapWidget'))

export default SwapWidget
