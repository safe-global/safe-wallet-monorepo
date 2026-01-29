/**
 * Recovery Feature Implementation - LAZY LOADED
 *
 * This file is lazy-loaded via createFeatureHandle.
 * Use direct imports - do NOT use lazy() inside (one dynamic import per feature).
 *
 * IMPORTANT: Hooks are NOT included here - they're exported from index.ts
 * to avoid Rules of Hooks violations.
 */
import type { RecoveryContract } from './contract'

// Component imports - direct default imports
import Recovery from './components/Recovery'
import RecoveryList from './components/RecoveryList'
import RecoveryInfo from './components/RecoveryInfo'
import RecoveryStatus from './components/RecoveryStatus'
import RecoveryType from './components/RecoveryType'
import RecoveryValidationErrors from './components/RecoveryValidationErrors'
import RecoveryDescription from './components/RecoveryDescription'

// Service imports
import { 
  selectDelayModifierByRecoverer,
  selectDelayModifierByAddress 
} from './services/selectors'

import { 
  getRecoverySkipTransaction,
  getRecoveryProposalTransactions 
} from './services/transaction'

import {
  dispatchRecoveryProposal,
  dispatchRecoveryExecution
} from './services/recovery-sender'

import { getRecoveryUpsertTransactions } from './services/setup'

// Flat structure - NO hooks here
const feature: RecoveryContract = {
  // Components
  Recovery,
  RecoveryList,
  RecoveryInfo,
  RecoveryStatus,
  RecoveryType,
  RecoveryValidationErrors,
  RecoveryDescription,

  // Services
  selectDelayModifierByRecoverer,
  selectDelayModifierByAddress,
  getRecoverySkipTransaction,
  getRecoveryProposalTransactions,
  dispatchRecoveryProposal,
  dispatchRecoveryExecution,
  getRecoveryUpsertTransactions,
}

export default feature
