/**
 * Counterfactual Feature - Public API
 *
 * This feature provides counterfactual (undeployed) safe functionality.
 *
 * ## Usage
 *
 * ```typescript
 * import {
 *   CounterfactualFeature,
 *   useIsCounterfactualEnabled,
 *   useIsCounterfactualSafe
 * } from '@/features/counterfactual'
 * import { useLoadFeature } from '@/features/__core__'
 *
 * function MyComponent() {
 *   const cf = useLoadFeature(CounterfactualFeature)
 *   const isEnabled = useIsCounterfactualEnabled()  // Hook (always loaded)
 *
 *   // No null check needed - always returns an object
 *   // Components render null when not ready (proxy stub)
 *   return <cf.ActivateAccountButton />
 * }
 *
 * // For explicit loading/disabled states:
 * function MyComponentWithStates() {
 *   const cf = useLoadFeature(CounterfactualFeature)
 *
 *   if (!cf.$isReady) return <Skeleton />
 *   if (cf.$isDisabled) return null
 *
 *   return <cf.CheckBalance />
 * }
 * ```
 *
 * All feature functionality is accessed via flat structure from useLoadFeature().
 * Naming conventions determine stub behavior:
 * - PascalCase → component (stub renders null)
 * - camelCase → service (undefined when not ready)
 *
 * Hooks are exported directly from this file (always loaded, not lazy) to avoid
 * Rules of Hooks violations.
 *
 * For store exports (slice, selectors, actions), import directly:
 *   import { selectUndeployedSafe } from '@/features/counterfactual/store'
 *
 * For lightweight type guards, import directly:
 *   import { isPredictedSafeProps } from '@/features/counterfactual/services'
 */

import { createFeatureHandle } from '@/features/__core__'
import type { CounterfactualImplementation } from './contract'

// Feature handle - uses auto-derivation (counterfactual → FEATURES.COUNTERFACTUAL)
export const CounterfactualFeature = createFeatureHandle<CounterfactualImplementation>('counterfactual')

// Contract type (for type-safe registry lookup)
export type { CounterfactualContract, PayNowPayLaterProps, CounterfactualFormProps, FirstTxFlowProps } from './contract'

// Types - safe, tree-shakeable
export type {
  UndeployedSafe,
  UndeployedSafesState,
  UndeployedSafeStatus,
  UndeployedSafeProps,
  ReplayedSafeProps,
  PredictedSafeProps,
  PayMethod,
} from './types'

export { PendingSafeStatus } from './types'

// Constants - safe, no dependencies
export { CF_TX_GROUP_KEY } from './constants'

// Hooks - lightweight, safe to export (depend on store/chains but not on components)
// NOTE: Import from specific files, not from './hooks' barrel, because the barrel includes
// useCounterfactualBalances which creates a circular dependency with CounterfactualFeature
export { useIsCounterfactualEnabled } from './hooks/useIsCounterfactualEnabled'
export { default as useIsCounterfactualSafe } from './hooks/useIsCounterfactualSafe'
export { safeCreationPendingStatuses } from './hooks/safeCreationPendingStatuses'
