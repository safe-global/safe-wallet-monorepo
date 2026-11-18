import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const OutreachPopup = gatedDynamic(FEATURES.TARGETED_SURVEY, () => import('../../components/OutreachPopup'))

export default OutreachPopup
