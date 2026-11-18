import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const FirstTxFlow = gatedDynamic(FEATURES.COUNTERFACTUAL, () => import('../../components/FirstTxFlow'))

export default FirstTxFlow
