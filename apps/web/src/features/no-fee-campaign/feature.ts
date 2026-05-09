import type { NoFeeCampaignContract } from './contract'

// Direct imports - this file is already lazy-loaded via createFeatureHandle
// Do NOT use lazy() or dynamic() here
import NoFeeCampaignBanner from './components/NoFeeCampaignBanner'
const noFeeCampaignBannerID = 'noFeeCampaignBanner'
import NoFeeCampaignTransactionCard from './components/NoFeeCampaignTransactionCard'
import GasTooHighBanner from './components/GasTooHighBanner'

// Flat structure - naming conventions determine stub behavior
// PascalCase → component (stub renders null when not ready)
// camelCase → constant/utility (undefined when not ready)
export default {
  NoFeeCampaignBanner,
  NoFeeCampaignTransactionCard,
  GasTooHighBanner,
  noFeeCampaignBannerID,
} satisfies NoFeeCampaignContract
