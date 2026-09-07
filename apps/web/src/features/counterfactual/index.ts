/**
 * Counterfactual Feature - Public API
 *
 * This feature provides counterfactual (undeployed) safe functionality.
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
export { useCounterfactualBalances } from './hooks/useCounterfactualBalances'
export { default as useCounterfactualSafeSync } from './hooks/useCounterfactualSafeSync'

export { default as PayNowPayLater } from './components/PayNowPayLater'
export { LoopIcon } from './components/CounterfactualStatusButton'
