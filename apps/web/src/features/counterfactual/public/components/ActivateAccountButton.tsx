import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const ActivateAccountButton = gatedDynamic(
  FEATURES.COUNTERFACTUAL,
  () => import('../../components/ActivateAccountButton'),
)

export default ActivateAccountButton
