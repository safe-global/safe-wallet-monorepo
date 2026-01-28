/**
 * Feature Architecture Types - v3 Flat Structure
 *
 * Features use a flat structure with naming conventions:
 * - PascalCase → component (stub renders null)
 * - useSomething → hook (stub returns {})
 * - camelCase → service (stub is no-op)
 */

/**
 * Feature implementation - the lazy-loaded part of a feature.
 *
 * Uses a flat structure where naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - useSomething → hook (stub returns {})
 * - camelCase → service (stub is no-op)
 *
 * @example
 * interface MyFeatureImplementation {
 *   MyComponent: typeof MyComponent      // PascalCase → component
 *   useMyHook: typeof useMyHook          // useSomething → hook
 *   myService: typeof myService          // camelCase → service
 * }
 */

export interface FeatureImplementation {}

/**
 * Minimal feature handle - always bundled, tiny (~100 bytes).
 *
 * This is the ONLY part that gets bundled at app startup.
 * Contains just the name, flag check, and a lazy loader for the full implementation.
 *
 * @example
 * export const myFeatureHandle: FeatureHandle<MyFeatureImpl> = {
 *   name: 'my-feature',
 *   useIsEnabled: () => useHasFeature(FEATURES.MY_FEATURE),
 *   load: () => import('./feature'),
 * }
 */
export interface FeatureHandle<TImpl extends FeatureImplementation = FeatureImplementation> {
  /** Unique feature identifier used for registry lookup */
  readonly name: string

  /**
   * Feature flag hook - STATIC, always bundled.
   * Implementation should be: () => useHasFeature(FEATURES.MY_FEATURE)
   *
   * @returns true if enabled, false if disabled, undefined if still loading
   */
  useIsEnabled: () => boolean | undefined

  /**
   * Lazy loader for the full feature implementation.
   * Only called when the feature is enabled AND accessed.
   */
  load: () => Promise<{ default: TImpl }>
}
