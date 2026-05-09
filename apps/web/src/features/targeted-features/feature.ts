import type { TargetedFeaturesContract } from './contract'

/**
 * Targeted Features implementation
 *
 * This feature is hooks-only - all hooks are exported directly from index.ts
 * and are always loaded (not lazy-loaded) per the feature architecture.
 *
 * The feature implementation is empty since there are no components or services.
 */
export default {} satisfies TargetedFeaturesContract
