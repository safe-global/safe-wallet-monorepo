/**
 * Counterfactual Feature Public API
 *
 * This barrel file exports only "safe" items that don't create circular dependencies:
 * - Types (tree-shakeable, no runtime code)
 * - Constants (no dependencies)
 * - Store exports (isolated, no component/hook dependencies)
 * - Hooks (depend on store but not on components)
 *
 * For services and components, import directly from their sub-paths:
 * - Services: import from '@/features/counterfactual/services'
 * - Components: import from '@/features/counterfactual/components'
 */

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

// Hooks - safe to export (depend on store/chains but not on components)
export {
  useIsCounterfactualEnabled,
  useIsCounterfactualSafe,
  useCounterfactualBalances,
  safeCreationPendingStatuses,
} from './hooks'

// NOTE: Services and Components are NOT exported from this barrel to prevent
// circular dependencies. Import them directly from their sub-paths:
//
// Services: import { ... } from '@/features/counterfactual/services'
// Components: import { ... } from '@/features/counterfactual/components'
