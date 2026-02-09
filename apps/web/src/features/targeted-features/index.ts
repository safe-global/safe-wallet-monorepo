// Export public types
export type { OutreachSafeResult } from './types'
export type { TargetedFeatures } from './hooks/useIsTargetedFeature'

// Export hooks directly (always loaded, not in contract)
// Hooks are never lazy-loaded to avoid Rules of Hooks violations
export { useIsTargetedFeature } from './hooks/useIsTargetedFeature'
export { useIsOutreachSafe } from './hooks/useIsOutreachSafe'
