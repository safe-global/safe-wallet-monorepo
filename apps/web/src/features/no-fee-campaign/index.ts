import { createFeatureHandle } from '@/features/__core__'
import type { NoFeeCampaignContract } from './contract'

/**
 * No Fee Campaign Feature Handle
 *
 * Uses semantic mapping: 'no-fee-campaign' → FEATURES.NO_FEE_NOVEMBER
 * No second parameter needed (mapping exists in createFeatureHandle.ts)
 */
export const NoFeeCampaignFeature = createFeatureHandle<NoFeeCampaignContract>('no-fee-campaign')

// Export contract type for TypeScript inference
export type { NoFeeCampaignContract } from './contract'

// Export hooks directly (always loaded, not in contract)
// Hooks are never lazy-loaded to avoid Rules of Hooks violations
export { useIsNoFeeCampaignEnabled } from './hooks/useIsNoFeeCampaignEnabled'
export { useNoFeeCampaignEligibility } from './hooks/useNoFeeCampaignEligibility'
export { useGasTooHigh } from './hooks/useGasTooHigh'
