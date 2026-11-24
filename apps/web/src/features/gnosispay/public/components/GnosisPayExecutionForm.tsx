import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const GnosisPayExecutionForm = gatedDynamic(FEATURES.GNOSIS_PAY, () => import('../../GnosisPayExecutionForm'))

export default GnosisPayExecutionForm
