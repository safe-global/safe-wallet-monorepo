import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SwapTokens = gatedDynamic(FEATURES.NATIVE_SWAPS, () => import('../components/SwapTokens'))

export default SwapTokens
