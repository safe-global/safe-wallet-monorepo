import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const CounterfactualHooks = gatedDynamic(FEATURES.COUNTERFACTUAL, () => import('../components/CounterfactualHooks'))

export default CounterfactualHooks
