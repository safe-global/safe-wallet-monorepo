import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const FallbackSwapWidget = gatedDynamic(FEATURES.NATIVE_SWAPS, () => import('../../components/FallbackSwapWidget'))

export default FallbackSwapWidget
