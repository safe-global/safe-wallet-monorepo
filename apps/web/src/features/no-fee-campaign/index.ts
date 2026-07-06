import { createFeatureHandle } from '@/features/__core__'
import { useIsNoFeeCampaign } from '@/hooks/useChains'
import type { NoFeeCampaignContract } from './contract'

/**
 * No Fee Campaign Feature Handle
 *
 * Enablement is derived from `chain.relayer.type === 'NO_FEE_CAMPAIGN'`.
 */
export const NoFeeCampaignFeature = createFeatureHandle<NoFeeCampaignContract>('no-fee-campaign', useIsNoFeeCampaign)

// Export contract type for TypeScript inference
export type { NoFeeCampaignContract } from './contract'

// Export hooks directly (always loaded, not in contract)
// Hooks are never lazy-loaded to avoid Rules of Hooks violations
export { useIsNoFeeCampaignEnabled } from './hooks/useIsNoFeeCampaignEnabled'
export { useNoFeeCampaignEligibility } from './hooks/useNoFeeCampaignEligibility'
export { useGasTooHigh } from './hooks/useGasTooHigh'
