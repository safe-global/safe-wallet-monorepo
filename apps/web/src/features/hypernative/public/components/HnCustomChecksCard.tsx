import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnCustomChecksCard = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../../components/HnCustomChecksCard').then((mod) => ({ default: mod.HnCustomChecksCard })),
)

export default HnCustomChecksCard
