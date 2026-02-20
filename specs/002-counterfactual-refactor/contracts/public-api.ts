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
// INTEGRATION HOOKS (for React components)
// ============================================================================

export { useIsCounterfactualSafe } from './hooks'
// Returns: boolean - Wrapper around selectIsUndeployedSafe selector
// Usage: Used across tx flows to check if current Safe is undeployed
// Example: 11 external files use this for conditional UI rendering

export { useCounterfactualBalances } from './hooks'
// Returns: Balance data for undeployed Safes
// Usage: Used by loadables to get balance information for counterfactual Safes

export { safeCreationPendingStatuses } from './hooks'
// Returns: Array of pending Safe creation statuses
// Usage: Used by StatusStep to monitor Safe creation progress

// NOTE: While store selectors are architecturally preferred, these hooks are
// exported because they're actively used by 11+ external files for UI integration.
// They provide convenient React-friendly wrappers around store selectors.

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
// COMPONENTS (UI integration points)
// ============================================================================

export { CounterfactualHooks } from './components'
// Global hooks component that renders counterfactual UI (success screens, monitoring)
// Usage: Rendered in _app.tsx to provide feature-wide UI

export { ActivateAccountButton } from './components'
// Button to activate an undeployed Safe
// Usage: Sidebar, NewTxButton

export { CheckBalance } from './components'
// Component to check and display counterfactual Safe balance
// Usage: AssetsTable

export { CounterfactualForm } from './components'
// Form for executing counterfactual Safe transactions
// Usage: Tx flow actions (Counterfactual.tsx)

export { CounterfactualStatusButton } from './components'
// Status indicator button for undeployed Safes
// Usage: SidebarHeader

export { FirstTxFlow } from './components'
// UI for creating first transaction on undeployed Safe
// Usage: Dashboard FirstSteps

export { PayNowPayLater } from './components'
// Payment method selector for Safe deployment
// Usage: New Safe creation flow (ReviewStep)

export { LoopIcon } from './components'
// Loading icon for counterfactual operations
// Usage: Account info chips

// NOTE: These components are exported because they're used at specific
// integration points across the application (tx flows, sidebars, dashboard).
// While components being exported is non-standard, it reflects the actual
// usage pattern where counterfactual UI needs to be rendered at multiple points.

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
