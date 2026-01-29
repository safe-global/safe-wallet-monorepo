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

// Components actually used by consumers
import type Recovery from './components/Recovery'
import type RecoveryList from './components/RecoveryList'
import type RecoveryInfo from './components/RecoveryInfo'
import type RecoveryStatus from './components/RecoveryStatus'
import type RecoveryValidationErrors from './components/RecoveryValidationErrors'
import type RecoveryDescription from './components/RecoveryDescription'

// Services from selectors.ts
import type { 
  selectDelayModifierByRecoverer,
  selectDelayModifierByAddress 
} from './services/selectors'

// Services from transaction.ts  
import type { 
  getRecoverySkipTransaction,
  getRecoveryProposalTransactions 
} from './services/transaction'

// Services from recovery-sender.ts
import type {
  dispatchRecoveryProposal,
  dispatchRecoveryExecution
} from './services/recovery-sender'

// Services from setup.ts
import type { getRecoveryUpsertTransactions } from './services/setup'

/**
 * Recovery Feature Contract - what's exposed via useLoadFeature()
 */
export interface RecoveryContract {
  // Components (PascalCase - stub renders null)
  Recovery: typeof Recovery
  RecoveryList: typeof RecoveryList  
  RecoveryInfo: typeof RecoveryInfo
  RecoveryStatus: typeof RecoveryStatus
  RecoveryValidationErrors: typeof RecoveryValidationErrors
  RecoveryDescription: typeof RecoveryDescription

  // Services (camelCase - undefined when not ready, check $isReady before calling)
  selectDelayModifierByRecoverer: typeof selectDelayModifierByRecoverer
  selectDelayModifierByAddress: typeof selectDelayModifierByAddress
  getRecoverySkipTransaction: typeof getRecoverySkipTransaction
  getRecoveryProposalTransactions: typeof getRecoveryProposalTransactions
  dispatchRecoveryProposal: typeof dispatchRecoveryProposal
  dispatchRecoveryExecution: typeof dispatchRecoveryExecution
  getRecoveryUpsertTransactions: typeof getRecoveryUpsertTransactions
}
