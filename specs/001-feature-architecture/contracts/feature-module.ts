/**
 * Feature Module Type Definitions
 *
 * These interfaces define the contract for feature modules in the Safe{Wallet} web app.
 * Features MUST export types conforming to these interfaces.
 *
 * @see /specs/001-feature-architecture/data-model.md
 */

import type { ComponentType, ReactNode } from 'react'

/**
 * Feature public API structure.
 * Every feature's index.ts MUST export according to this interface.
 */
export interface FeatureModule<TProps = Record<string, unknown>> {
  /**
   * Default export: The lazy-loaded main component.
   * Consumers use this as the entry point.
   */
  default: ComponentType<TProps>
}

/**
 * Feature with optional hooks export.
 * Features MAY export hooks for external consumption.
 */
export interface FeatureModuleWithHooks<TProps = Record<string, unknown>> extends FeatureModule<TProps> {
  /**
   * Feature flag check hook.
   * Returns undefined while loading, boolean when resolved.
   */
  useIsFeatureEnabled: () => boolean | undefined
}

/**
 * Feature with Redux store exports.
 * Features with state MAY export selectors.
 */
export interface FeatureModuleWithStore<TProps = Record<string, unknown>, TState = unknown>
  extends FeatureModuleWithHooks<TProps> {
  /**
   * Selector to get feature state from root state.
   */
  selectFeatureState: (state: unknown) => TState
}

/**
 * Standard feature entry point props.
 * Features SHOULD accept these common props.
 */
export interface FeatureEntryProps {
  /**
   * Children to render inside the feature (optional).
   */
  children?: ReactNode
}

/**
 * Feature flag hook signature.
 * All features MUST implement this hook.
 */
export type UseIsFeatureEnabledHook = () => boolean | undefined

/**
 * Migration assessment for a feature.
 * Used during the migration phase to track compliance.
 */
export interface FeatureMigrationAssessment {
  /** Feature directory name (kebab-case) */
  featureName: string

  /** Feature flag enum key (e.g., 'NATIVE_WALLETCONNECT') */
  featureFlag: string

  /** Compliance checklist */
  compliance: {
    hasRootIndex: boolean
    hasTypes: boolean
    hasConstants: boolean
    hasComponentIndex: boolean
    hasHooksIndex: boolean
    hasEnabledHook: boolean
    hasServicesIndex: boolean | 'N/A'
    hasStoreIndex: boolean | 'N/A'
  }

  /** Number of external imports to feature internals */
  internalImportsCount: number

  /** Overall compliance score (0-100) */
  complianceScore: number

  /** Estimated migration effort */
  migrationEffort: 'low' | 'medium' | 'high'

  /** Notes or blockers for migration */
  notes?: string
}

/**
 * Feature barrel file (index.ts) exports type.
 * Defines what a feature is allowed to export.
 */
export interface AllowedFeatureExports {
  /** Default: lazy-loaded component */
  default: ComponentType<unknown>

  /** Types: Always allowed, tree-shakeable */
  types?: Record<string, unknown>

  /** Feature flag hook: Required */
  useIsFeatureEnabled: UseIsFeatureEnabledHook

  /** Store selectors: Optional */
  selectors?: Record<string, (state: unknown) => unknown>

  /** Constants: Optional, for external configuration */
  constants?: Record<string, unknown>
}

/**
 * ESLint rule configuration for feature imports.
 * Defines the pattern for no-restricted-imports rule.
 */
export interface FeatureImportRestriction {
  /** Glob patterns to restrict */
  patterns: Array<{
    group: string[]
    message: string
  }>
}

/**
 * Standard feature import restriction configuration.
 */
export const FEATURE_IMPORT_RESTRICTION: FeatureImportRestriction = {
  patterns: [
    {
      group: ['@/features/*/components/*', '@/features/*/hooks/*', '@/features/*/services/*', '@/features/*/store/*'],
      message:
        'Import from feature index file only (e.g., @/features/walletconnect). Internal imports are not allowed.',
    },
  ],
}
