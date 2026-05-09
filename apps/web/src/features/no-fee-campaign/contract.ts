/**
 * No Fee Campaign Feature Contract
 *
 * Defines the public API surface for lazy-loaded components.
 * Accessed via useLoadFeature(NoFeeCampaignFeature).
 *
 * Naming conventions determine stub behavior:
 * - PascalCase → Component (stub renders null when not ready)
 *
 * IMPORTANT: Hooks are NOT in the contract - exported directly from index.ts
 */

// Component imports for typeof pattern (enables IDE navigation)
import type NoFeeCampaignBanner from './components/NoFeeCampaignBanner'
import type NoFeeCampaignTransactionCard from './components/NoFeeCampaignTransactionCard'
import type GasTooHighBanner from './components/GasTooHighBanner'

/**
 * No Fee Campaign Feature Contract - flat structure (NO hooks)
 *
 * This is what gets loaded when handle.load() is called.
 * Hooks are exported directly from index.ts to avoid Rules of Hooks violations.
 */
export interface NoFeeCampaignContract {
  // Components (PascalCase) - stub renders null when not ready
  NoFeeCampaignBanner: typeof NoFeeCampaignBanner
  NoFeeCampaignTransactionCard: typeof NoFeeCampaignTransactionCard
  GasTooHighBanner: typeof GasTooHighBanner
  // Constants (camelCase) - undefined when not ready
  noFeeCampaignBannerID: string
}
