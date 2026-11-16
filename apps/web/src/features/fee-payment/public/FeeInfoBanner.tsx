import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const FeeInfoBanner = gatedDynamic(FEATURES.GTF, () => import('../components/FeeInfoBanner'))

export default FeeInfoBanner
