import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const GasTooHighBanner = gatedDynamic(
  FEATURES.NO_FEE_NOVEMBER,
  () => import('@safe-global/views/features/no-fee-campaign/components/GasTooHighBanner'),
)

export default GasTooHighBanner
