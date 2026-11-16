import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnMiniTxBanner = gatedDynamic(FEATURES.HYPERNATIVE, () => import('../components/HnMiniTxBanner'))

export default HnMiniTxBanner
