import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const HnQueueAssessment = gatedDynamic(FEATURES.HYPERNATIVE, () =>
  import('../../components/HnQueueAssessment/HnQueueAssessment').then((mod) => ({ default: mod.HnQueueAssessment })),
)

export default HnQueueAssessment
