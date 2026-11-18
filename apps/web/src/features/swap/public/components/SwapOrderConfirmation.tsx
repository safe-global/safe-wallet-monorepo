import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SwapOrderConfirmation = gatedDynamic(
  FEATURES.NATIVE_SWAPS,
  () => import('../../components/SwapOrderConfirmationView'),
)

export default SwapOrderConfirmation
