import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafeProAnnouncementModal = gatedDynamic(
  FEATURES.SAFE_PRO_ANNOUNCEMENT,
  () => import('../components/SafeProAnnouncementModal'),
)

export default SafeProAnnouncementModal
