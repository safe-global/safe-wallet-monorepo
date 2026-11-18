import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const CounterfactualForm = gatedDynamic(FEATURES.COUNTERFACTUAL, () => import('../../components/CounterfactualForm'))

export default CounterfactualForm
