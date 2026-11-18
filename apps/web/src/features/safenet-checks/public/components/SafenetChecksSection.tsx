import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafenetChecksSection = gatedDynamic(
  FEATURES.SAFENET_CHECKS,
  () => import('../../components/SafenetChecksSection'),
)

export default SafenetChecksSection
