/**
 * Hook to determine if Hypernative features should be enabled
 * This can be extended to check for feature flags, environment variables, or other conditions
 */
export const useIsHypernativeFeatureEnabled = (): boolean => {
  // TODO: Add feature flag check or environment variable check when needed
  // For now, return true to enable Hypernative features
  return true
}
