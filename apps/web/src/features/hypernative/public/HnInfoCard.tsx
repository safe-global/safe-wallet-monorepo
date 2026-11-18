import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnInfoCard = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../components/HnInfoCard').then((mod) => ({ default: mod.HnInfoCard })),
)

export default HnInfoCard
