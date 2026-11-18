import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafeProAnnouncement = gatedDynamic(
  FEATURES.SAFE_PRO_ANNOUNCEMENT,
  () => import('../../components/SafeProAnnouncement'),
)

export default SafeProAnnouncement
