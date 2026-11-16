import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SwapButton = gatedDynamic(FEATURES.NATIVE_SWAPS, () => import('../components/SwapButton'))

export default SwapButton
