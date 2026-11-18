import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafeProWorkspacesBanner = gatedDynamic(
  FEATURES.SAFE_PRO_ANNOUNCEMENT,
  () => import('../components/SafeProWorkspacesBanner'),
)

export default SafeProWorkspacesBanner
