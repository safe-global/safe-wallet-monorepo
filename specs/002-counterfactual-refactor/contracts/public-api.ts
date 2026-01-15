// Public API Contract: Counterfactual Feature
// This file defines the TypeScript interface contract for the counterfactual feature's public API.
// External code MUST import from @/features/counterfactual only (not internal paths).

// ============================================================================
// TYPES (tree-shakeable - always safe to export)
// ============================================================================

export type {
  // Core entities
  UndeployedSafe,
  UndeployedSafesState,
  UndeployedSafeStatus,
  UndeployedSafeProps,

  // Safe props variants
  ReplayedSafeProps,
  // Note: PredictedSafeProps imported from @safe-global/protocol-kit, not re-exported
} from './types'

// ============================================================================
// FEATURE FLAG HOOK (REQUIRED)
// ============================================================================

export { useIsCounterfactualEnabled } from './hooks'
// Returns: boolean | undefined (true=enabled, false=disabled, undefined=loading)
// Usage: Check before rendering counterfactual UI or executing counterfactual logic

// ============================================================================
// REDUX STORE EXPORTS
// ============================================================================

export {
  // Slice itself (for store configuration)
  undeployedSafesSlice,

  // Actions
  addUndeployedSafe,
  addUndeployedSafes,
  updateUndeployedSafeStatus,
  removeUndeployedSafe,

  // Selectors
  selectUndeployedSafes,
  selectUndeployedSafe,
  selectUndeployedSafesByAddress,
  selectIsUndeployedSafe,
} from './store'

// ============================================================================
// SERVICE FUNCTIONS (business logic used externally)
// ============================================================================

export {
  // Safe info utilities
  getUndeployedSafeInfo,
  extractCounterfactualSafeSetup,

  // Deployment functions
  deploySafeAndExecuteTx,
  dispatchTxExecutionAndDeploySafe,
  activateReplayedSafe,

  // Balance utilities
  getCounterfactualBalance,

  // Safe creation replay
  replayCounterfactualSafeDeployment,

  // Transaction monitoring
  checkSafeActivation,
  checkSafeActionViaRelay,

  // Type guards
  isReplayedSafeProps,
  isPredictedSafeProps,
} from './services'

// ============================================================================
// CONSTANTS (used externally for transaction monitoring)
// ============================================================================

export { CF_TX_GROUP_KEY } from './constants'
// Transaction group key for counterfactual Safe deployments
// Used by transaction monitoring services to track deployment transactions

// ============================================================================
// LAZY-LOADED COMPONENTS (if any need external access)
// ============================================================================

// NOTE: Counterfactual feature does NOT export components directly.
// All counterfactual UI is internal to the feature.
// External code interacts via hooks, store selectors, and service functions.

// No default export - feature is integrated at multiple points, not a single widget

// ============================================================================
// INTERNAL APIs (NOT EXPORTED - for reference only)
// ============================================================================

// These hooks and components are INTERNAL to the feature:
// - useCounterfactualBalances (internal helper hook)
// - useDeployGasLimit (internal calculation hook)
// - useIsCounterfactualSafe (internal - external code should use selectIsUndeployedSafe)
// - usePendingSafeStatuses (internal monitoring hook)
// - usePendingSafeNotifications (internal notification hook)
// - All 10 component files (ActivateAccountButton, ActivateAccountFlow, etc.)

// External code MUST use store selectors or service functions instead of internal hooks.

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Check feature flag
 *
 * import { useIsCounterfactualEnabled } from '@/features/counterfactual'
 *
 * const isEnabled = useIsCounterfactualEnabled()
 * if (isEnabled !== true) return null
 * // Feature logic here
 */

/**
 * Example 2: Check if Safe is undeployed
 *
 * import { selectIsUndeployedSafe } from '@/features/counterfactual'
 * import { useAppSelector } from '@/store'
 *
 * const isUndeployed = useAppSelector(selectIsUndeployedSafe)
 * if (isUndeployed) {
 *   // Show activation UI
 * }
 */

/**
 * Example 3: Add undeployed Safe to store
 *
 * import { addUndeployedSafe } from '@/features/counterfactual'
 * import { useAppDispatch } from '@/store'
 *
 * const dispatch = useAppDispatch()
 * dispatch(addUndeployedSafe({
 *   chainId: '1',
 *   address: '0x...',
 *   type: 'payLater',
 *   safeProps: predictedProps
 * }))
 */

/**
 * Example 4: Get undeployed Safe info
 *
 * import { getUndeployedSafeInfo, selectUndeployedSafe } from '@/features/counterfactual'
 * import { useAppSelector } from '@/store'
 *
 * const undeployedSafe = useAppSelector(selectUndeployedSafe)
 * if (undeployedSafe) {
 *   const safeInfo = getUndeployedSafeInfo(undeployedSafe, address, chain)
 *   // Use safeInfo
 * }
 */

/**
 * Example 5: Deploy Safe and execute first transaction
 *
 * import { deploySafeAndExecuteTx } from '@/features/counterfactual'
 *
 * const txHash = await deploySafeAndExecuteTx(
 *   txOptions,
 *   wallet,
 *   safeAddress,
 *   safeTx,
 *   provider
 * )
 */
