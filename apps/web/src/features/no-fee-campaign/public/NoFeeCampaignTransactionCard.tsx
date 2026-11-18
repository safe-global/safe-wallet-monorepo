import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const NoFeeCampaignTransactionCard = gatedDynamic(
  FEATURES.NO_FEE_NOVEMBER,
  () => import('../components/NoFeeCampaignTransactionCard'),
)

export default NoFeeCampaignTransactionCard
