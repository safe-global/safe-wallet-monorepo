import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const FeesPreview = gatedDynamic(FEATURES.GTF, () => import('../../components/FeesPreview'))

export default FeesPreview
