import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const SafenetAuditRow = gatedDynamic(FEATURES.SAFENET_CHECKS, () => import('../../components/SafenetAuditRow'))

export default SafenetAuditRow
