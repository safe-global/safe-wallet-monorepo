import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnLoginCard = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../components/HnLoginCard/HnLoginCard').then((mod) => ({ default: mod.HnLoginCard })),
)

export default HnLoginCard
