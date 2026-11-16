import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const PayNowPayLater = gatedDynamic(FEATURES.COUNTERFACTUAL, () => import('../components/PayNowPayLater'))

export default PayNowPayLater
