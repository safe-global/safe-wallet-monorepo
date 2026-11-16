import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnPendingBanner = gatedDynamic(FEATURES.HYPERNATIVE, () => import('../components/HnPendingBanner'))

export default HnPendingBanner
