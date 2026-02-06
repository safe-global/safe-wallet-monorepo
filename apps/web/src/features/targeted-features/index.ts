import { createFeatureHandle } from '@/features/__core__'
import { FEATURES } from '@safe-global/utils/utils/chains'
import type { TargetedFeaturesContract } from './contract'

/**
 * Targeted Features Feature Handle
 *
 * This is a hooks-only utility feature that provides functionality for checking
 * if features are targeted for specific Safes. Since it's a utility feature that's
 * always available, we use FEATURES.TARGETED_SURVEY as the feature flag (related feature).
 *
 * All hooks are exported directly from this file (always loaded, not lazy) to avoid
 * Rules of Hooks violations.
 */

// Feature handle - uses TARGETED_SURVEY flag (related to targeted features functionality)
export const TargetedFeaturesFeature = createFeatureHandle<TargetedFeaturesContract>(
  'targeted-features',
  FEATURES.TARGETED_SURVEY,
)

// Export contract type for TypeScript inference
export type { TargetedFeaturesContract } from './contract'

// Export public types
export type { OutreachSafeResult } from './types'
export type { TargetedFeatures } from './hooks/useIsTargetedFeature'

// Export hooks directly (always loaded, not in contract)
// Hooks are never lazy-loaded to avoid Rules of Hooks violations
export { useIsTargetedFeature } from './hooks/useIsTargetedFeature'
export { useIsOutreachSafe } from './hooks/useIsOutreachSafe'
