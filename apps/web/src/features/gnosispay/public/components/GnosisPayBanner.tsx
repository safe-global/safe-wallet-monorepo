import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const GnosisPayBanner = gatedDynamic(FEATURES.GNOSIS_PAY, () => import('../../GnosisPayBanner'))

export default GnosisPayBanner
