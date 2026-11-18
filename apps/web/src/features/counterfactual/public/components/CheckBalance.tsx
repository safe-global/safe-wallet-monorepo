import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const CheckBalance = gatedDynamic(FEATURES.COUNTERFACTUAL, () => import('../../components/CheckBalance'))

export default CheckBalance
