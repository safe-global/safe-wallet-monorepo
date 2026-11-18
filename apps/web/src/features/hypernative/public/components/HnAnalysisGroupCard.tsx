import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnAnalysisGroupCard = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../../components/HnAnalysisGroupCard').then((mod) => ({ default: mod.HnAnalysisGroupCard })),
)

export default HnAnalysisGroupCard
