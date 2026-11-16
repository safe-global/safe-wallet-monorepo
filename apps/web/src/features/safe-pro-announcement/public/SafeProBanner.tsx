import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafeProBanner = gatedDynamic(FEATURES.SAFE_PRO_ANNOUNCEMENT, () => import('../components/SafeProBanner'))

export default SafeProBanner
