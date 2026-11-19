import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const CreateSpendingLimit = gatedDynamic(FEATURES.SPENDING_LIMIT, () => import('../../components/CreateSpendingLimit'))

export default CreateSpendingLimit
