/**
 * Recovery Feature Contract - Minimal working version
 *
 * This includes only the components and services actually used by consumers.
 * Hooks are NOT included here - they're exported directly from index.ts.
 *
 * Naming conventions:
 * - PascalCase → component (stub renders null when not ready)
 * - camelCase → service (undefined when not ready)
 */

// Components used by external consumers
import type Recovery from './components/Recovery'
import type RecoveryList from './components/RecoveryList'
import type RecoveryInfo from './components/RecoveryInfo'
import type RecoveryStatus from './components/RecoveryStatus'
import type RecoveryType from './components/RecoveryType'
import type RecoveryValidationErrors from './components/RecoveryValidationErrors'
import type RecoveryDescription from './components/RecoveryDescription'

// Internal review components (used as wrappers by tx-flow)
import type CancelRecoveryReview from './components/CancelRecoveryReview'
import type RecoverAccountReview from './components/RecoverAccountReview'

// Lightweight services (selectors) used by external consumers
import type { selectDelayModifierByRecoverer, selectDelayModifierByAddress } from './services/selectors'

/**
 * Recovery Feature Contract - what's exposed via useLoadFeature()
 */
export interface RecoveryContract {
  // Components (PascalCase - stub renders null)
  Recovery: typeof Recovery
  RecoveryList: typeof RecoveryList
  RecoveryInfo: typeof RecoveryInfo
  RecoveryStatus: typeof RecoveryStatus
  RecoveryType: typeof RecoveryType
  RecoveryValidationErrors: typeof RecoveryValidationErrors
  RecoveryDescription: typeof RecoveryDescription

  // Internal review components for tx-flow wrappers
  CancelRecoveryReview: typeof CancelRecoveryReview
  RecoverAccountReview: typeof RecoverAccountReview

  // Lightweight services (selectors - safe to use directly)
  selectDelayModifierByRecoverer: typeof selectDelayModifierByRecoverer
  selectDelayModifierByAddress: typeof selectDelayModifierByAddress
}
