import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const WorkspaceTour = gatedDynamic(FEATURES.WORKSPACE_TOUR, () => import('../../components/WorkspaceTour'))

export default WorkspaceTour
