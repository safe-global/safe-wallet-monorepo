import { FEATURES } from '@safe-global/utils/utils/chains'
import { gatedDynamic } from '@/utils/gatedDynamic'

const NoFeeCampaignBanner = gatedDynamic(FEATURES.NO_FEE_NOVEMBER, () => import('../components/NoFeeCampaignBanner'))

export default NoFeeCampaignBanner
