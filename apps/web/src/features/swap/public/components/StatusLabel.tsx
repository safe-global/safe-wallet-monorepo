import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const StatusLabel = gatedDynamic(
  FEATURES.NATIVE_SWAPS,
  () => import('@safe-global/views/features/swap/components/StatusLabel'),
)

export default StatusLabel
